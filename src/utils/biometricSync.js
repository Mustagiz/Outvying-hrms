import { calculateAbsDuration, getEffectiveWorkDate } from './helpers';

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

  const timezone = roster?.timezone || 'Asia/Kolkata';
  const istDate = date || new Date().toISOString().split('T')[0];

  // Map IST time to the regional Business Day
  // If we have a roster, we use its assigned date. 
  // Otherwise, we calculate the effective work date for the target region.
  const workDate = roster?.date || getEffectiveWorkDate(clockIn, istDate, timezone);

  const shiftStartTime = roster?.startTime || '09:00';
  const [shiftHour, shiftMin] = shiftStartTime.split(':').map(Number);
  const shiftStartInMinutes = shiftHour * 60 + shiftMin;
  const gracePeriod = roster?.gracePeriod || defaultRule.gracePeriodMins;

  // Latency check in regional time
  const istTimestamp = new Date(`${istDate}T${clockIn}:00+05:30`);
  const regionalFormat = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(istTimestamp);

  const [regH, regM] = regionalFormat.split(':').map(Number);
  const clockInInMinutes = regH * 60 + regM;

  let status = clockInInMinutes > (shiftStartInMinutes + gracePeriod) ? 'Late' : 'Present';
  let workingDays = 0;
  let workHours = 0;

  if (clockOut) {
    let clockOutDate = istDate;
    const [outH] = clockOut.split(':').map(Number);
    const [inH] = clockIn.split(':').map(Number);

    // Auto-detect cross-midnight clockout in IST
    if (outH < inH) {
      const nextDay = new Date(istDate);
      nextDay.setDate(nextDay.getDate() + 1);
      clockOutDate = nextDay.toISOString().split('T')[0];
    }

    workHours = calculateAbsDuration(clockIn, istDate, clockOut, clockOutDate);

    // Standard business day accounting
    if (workHours >= defaultRule.fullDayHours) {
      workingDays = 1.0;
    } else if (workHours >= 5) {
      workingDays = 1.0; // Overriding to 1 day if >= 5 hours as per rule
    } else if (workHours >= defaultRule.halfDayHours) {
      status = 'Half Day';
      workingDays = 0.5;
    } else {
      status = 'Absent';
      workingDays = 0;
    }

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
    workHours: Math.round(workHours * 100) / 100,
    workingDays,
    workDate,
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
  // Disabled mock biometric data to prevent ghost records
  const mockBiometricData = [];

  return mockBiometricData;
};

export const processBiometricSync = (rosters = [], attendance = []) => {
  const biometricData = syncBiometricData();
  const updatedAttendance = [...attendance];

  biometricData.forEach(data => {
    const { firstIn, lastOut } = getFirstInLastOut(data.punches);

    // Intelligent Roster Matching (Business Day Logic)
    const findRosterMatch = () => {
      // 1. Direct match (IST date)
      const direct = rosters.find(r => String(r.employeeId) === String(data.employeeId) && r.date === data.date);

      // If it's daytime in IST (Standard Office), direct match is usually correct
      if (direct && firstIn > '06:00' && firstIn < '18:00') return direct;

      // 2. Cross-midnight match (Previous Day's night shift)
      // Check if there was a shift assigned yesterday that spans into today
      const prevDate = new Date(data.date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevStr = prevDate.toISOString().split('T')[0];
      const prevRoster = rosters.find(r => String(r.employeeId) === String(data.employeeId) && r.date === prevStr);

      // Night Shift Logic: If first in is late night/early morning IST, it's likely part of yesterday's US business day
      if (prevRoster && prevRoster.timezone !== 'Asia/Kolkata' && firstIn < '06:00') {
        return prevRoster;
      }
      return direct;
    };

    const targetRoster = findRosterMatch();
    const result = calculateAttendanceStatus(firstIn, lastOut, data.date, targetRoster);

    // Use the Effective Work Date (Business Day)
    const effectiveDate = targetRoster?.date || result.workDate || data.date;

    const existingIndex = attendance.findIndex(
      a => a.employeeId === data.employeeId && a.date === effectiveDate
    );

    const record = {
      id: `${data.employeeId}-${effectiveDate}`,
      employeeId: data.employeeId,
      date: effectiveDate, // Store under Business Day
      istDate: data.date, // Preserve IST for audit
      clockIn: firstIn,
      clockOut: lastOut,
      status: result.status,
      workHours: result.workHours,
      workingDays: result.workingDays,
      ruleApplied: result.ruleApplied,
      overtime: result.workHours > 9 ? (result.workHours - 9).toFixed(2) : 0
    };

    if (existingIndex >= 0) {
      updatedAttendance[existingIndex] = record;
    } else {
      updatedAttendance.push(record);
    }
  });

  return { success: true, processed: biometricData.length, updatedAttendance };
};
