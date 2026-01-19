// Biometric attendance calculation utilities

export const calculateAttendanceStatus = (clockIn, clockOut, date = null, roster = null) => {
  if (!clockIn || !clockOut) {
    return { status: 'Absent', workHours: 0, workingDays: 0 };
  }

  const rules = JSON.parse(localStorage.getItem('attendanceRules') || '[]');
  const defaultRule = rules.find(r => r.isDefault) || {
    fullDayHours: 8.0,
    halfDayHours: 4.0,
    minPresentHours: 1.0,
    gracePeriodMins: 15
  };

  // Calculate work hours
  const [inHour, inMin] = clockIn.split(':').map(Number);
  const [outHour, outMin] = clockOut.split(':').map(Number);
  const workHours = outHour - inHour + (outMin - inMin) / 60;

  // Apply grace period
  const graceHours = defaultRule.gracePeriodMins / 60;
  const adjustedHours = workHours + graceHours;

  // Determine status
  let status, workingDays;
  if (adjustedHours >= defaultRule.fullDayHours) {
    status = 'Present';
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

  // Check if late based on roster or default
  const shiftStartTime = roster?.startTime || '09:00';
  const [shiftHour, shiftMin] = shiftStartTime.split(':').map(Number);
  const shiftStartInMinutes = shiftHour * 60 + shiftMin;
  const clockInInMinutes = inHour * 60 + inMin;

  const gracePeriod = roster?.gracePeriod || defaultRule.gracePeriodMins;

  if (status === 'Present' && clockInInMinutes > (shiftStartInMinutes + gracePeriod)) {
    status = 'Late';
  }

  return {
    status,
    workHours: workHours.toFixed(2),
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
