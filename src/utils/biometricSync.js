// Biometric attendance calculation utilities

export const calculateAttendanceStatus = (clockIn, clockOut, date = null, roster = null) => {
  if (!clockIn) {
    return { status: 'Absent', workHours: 0, workingDays: 0 };
  }

  const rules = JSON.parse(localStorage.getItem('attendanceRules') || '[]');
  const defaultRule = rules.find(r => r.isDefault) || {
    fullDayHours: 8.0,
    halfDayHours: 4.0,
    minPresentHours: 1.0,
    gracePeriodMins: 15
  };

  const [inHour, inMin] = clockIn.split(':').map(Number);
  let clockInInMinutes = inHour * 60 + inMin;

  const timezone = roster?.timezone || 'Asia/Kolkata';
  if (timezone !== 'Asia/Kolkata') {
    // If the shift is in another timezone, convert the actual clock-in (IST) to that timezone
    // to compare it with the shift's regional start time.
    const dateToUse = date || new Date().toISOString().split('T')[0];
    const istDate = new Date(`${dateToUse}T${clockIn}:00+05:30`);

    const regionalTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(istDate);

    const [regH, regM] = regionalTimeStr.split(':').map(Number);
    clockInInMinutes = regH * 60 + regM;
  }

  const shiftStartTime = roster?.startTime || '09:00';
  const [shiftHour, shiftMin] = shiftStartTime.split(':').map(Number);
  const shiftStartInMinutes = shiftHour * 60 + shiftMin;
  const gracePeriod = roster?.gracePeriod || defaultRule.gracePeriodMins;

  // Initial status based on regional clockIn time
  let status = clockInInMinutes > (shiftStartInMinutes + gracePeriod) ? 'Late' : 'Present';
  let workingDays = 0; // Only count days after clockOut
  let workHours = 0;

  if (clockOut) {
    const [outHour, outMin] = clockOut.split(':').map(Number);
    workHours = outHour - inHour + (outMin - inMin) / 60;

    // Final status and working days calculation
    const graceHours = defaultRule.gracePeriodMins / 60;
    const adjustedHours = workHours + graceHours;

    if (adjustedHours >= defaultRule.fullDayHours) {
      workingDays = 1.0;
    } else if (adjustedHours >= defaultRule.halfDayHours) {
      status = 'Half Day';
      workingDays = 0.5;
    } else if (adjustedHours >= defaultRule.minPresentHours) {
      status = 'Half Day';
      workingDays = 0.5;
    } else {
      status = 'Absent';
      workingDays = 0;
    }

    // STRICT RULE: If work hours < 5, mark as LWP
    if (workHours < 5) {
      status = 'LWP';
      workingDays = 0;
    }

    if (status === 'Present' && clockInInMinutes > (shiftStartInMinutes + gracePeriod)) {
      status = 'Late';
    }
  }

  return {
    status,
    workHours: typeof workHours === 'number' ? Math.round(workHours * 100) / 100 : 0,
    workingDays,
    ruleApplied: roster ? `Roster: ${roster.shiftName}` : (defaultRule.name || 'Standard Office')
  };
};

export const getFirstInLastOut = (punches) => {
  if (!punches || punches.length === 0) return { firstIn: null, lastOut: null };

  const inTimes = punches.filter(p => p.type === 'IN').map(p => p.time);
  const outTimes = punches.filter(p => p.type === 'OUT').map(p => p.time);

  const firstIn = inTimes.length > 0 ? inTimes.reduce((min, time) => time < min ? time : min) : null;
  const lastOut = outTimes.length > 0 ? outTimes.reduce((max, time) => time > max ? time : max) : null;

  return { firstIn, lastOut };
};

export const calculateMonthlyWorkingDays = (attendance, employeeId, month, year) => {
  const monthAttendance = attendance.filter(a => {
    const date = new Date(a.date);
    return a.employeeId === employeeId &&
      date.getMonth() === month &&
      date.getFullYear() === year;
  });

  let totalWorkingDays = 0;
  monthAttendance.forEach(record => {
    const result = calculateAttendanceStatus(record.clockIn, record.clockOut, record.date);
    totalWorkingDays += result.workingDays;
  });

  return totalWorkingDays;
};

export const syncBiometricData = () => {
  // Simulated biometric sync - in production, this would call actual biometric API
  const mockBiometricData = [
    {
      employeeId: 1, date: new Date().toISOString().split('T')[0], punches: [
        { time: '09:05', type: 'IN' },
        { time: '13:00', type: 'OUT' },
        { time: '14:00', type: 'IN' },
        { time: '18:15', type: 'OUT' }
      ]
    }
  ];

  return mockBiometricData;
};

export const processBiometricSync = () => {
  const biometricData = syncBiometricData();
  const attendance = JSON.parse(localStorage.getItem('attendance') || '[]');
  const rosters = JSON.parse(localStorage.getItem('rosters') || '[]');

  biometricData.forEach(data => {
    const { firstIn, lastOut } = getFirstInLastOut(data.punches);
    const todayRoster = rosters.find(r => r.employeeId === data.employeeId && r.date === data.date);
    const result = calculateAttendanceStatus(firstIn, lastOut, data.date, todayRoster);

    const existingIndex = attendance.findIndex(
      a => a.employeeId === data.employeeId && a.date === data.date
    );

    const record = {
      id: `${data.employeeId}-${data.date}`,
      employeeId: data.employeeId,
      date: data.date,
      clockIn: firstIn,
      clockOut: lastOut,
      status: result.status,
      workHours: result.workHours,
      workingDays: result.workingDays,
      ruleApplied: result.ruleApplied,
      overtime: result.workHours > 9 ? (result.workHours - 9).toFixed(2) : 0
    };

    if (existingIndex >= 0) {
      attendance[existingIndex] = record;
    } else {
      attendance.push(record);
    }
  });

  localStorage.setItem('attendance', JSON.stringify(attendance));
  return { success: true, processed: biometricData.length };
};
