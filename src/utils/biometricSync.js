import { calculateAbsDuration, getEffectiveWorkDate } from './helpers';

// Biometric attendance calculation utilities

export const calculateAttendanceStatus = (clockIn, clockOut, date = null, roster = null) => {
  const istDate = date || new Date().toISOString().split('T')[0];

  if (!clockIn) {
    // Check Roster for Holiday/Weekly Off
    if (roster && (roster.shiftName === 'Holiday' || roster.shiftName === 'Weekly Off')) {
      return {
        status: roster.shiftName,
        workHours: 0,
        workingDays: 0,
        ruleApplied: `Roster: ${roster.shiftName}`
      };
    }

    // Default Weekend Logic: Sat (6) and Sun (0) are Weekly Offs if no roster
    // If roster exists, we assume roster handles off days (e.g. shiftName 'Weekly Off')
    // But if roster is purely shift timing, we might need check roster.isOff
    // For now, if no roster is provided (Standard Office), Sat/Sun are OFF.
    const day = new Date(istDate).getDay();
    if (!roster && (day === 0 || day === 6)) {
      return { status: 'Weekly Off', workHours: 0, workingDays: 0, ruleApplied: 'Default Weekend' };
    }
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
  let overtime = 0;

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
    // Rules: < halfDayHours = LWP, halfDayHours to fullDayHours = Half Day, >= fullDayHours = Full Day
    const fullDayThreshold = roster?.fullDayHours || defaultRule.fullDayHours;
    const halfDayThreshold = roster?.halfDayHours || defaultRule.halfDayHours;

    if (workHours < halfDayThreshold) {
      status = 'LWP';
      workingDays = 0;
    } else if (workHours < fullDayThreshold) {
      status = 'Half Day';
      workingDays = 0.5;
    } else if (workHours >= fullDayThreshold) {
      workingDays = 1.0;
      // Status remains 'Present' or 'Late' as determined by clock-in time (lines 43)
      if (status !== 'Late') {
        status = 'Present';
      }
    }

    const overtimeThreshold = roster?.overtimeThreshold || (fullDayThreshold + 1);
    overtime = workHours > overtimeThreshold ? Math.round((workHours - overtimeThreshold) * 100) / 100 : 0;
  }

  return {
    status,
    workHours: Math.round(workHours * 100) / 100,
    workingDays,
    workDate,
    overtime,
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
      overtime: result.overtime
    };

    if (existingIndex >= 0) {
      updatedAttendance[existingIndex] = record;
    } else {
      updatedAttendance.push(record);
    }
  });

  return { success: true, processed: biometricData.length, updatedAttendance };
};

export const processBiometricImport = (importedRows, users, rosters, currentAttendance) => {
  // importedRows expected format: { EmployeeID, Date, Time, Status? } or similar

  const processedData = [];
  const errors = [];

  // 1. Group by Employee and Date
  const grouped = {};

  importedRows.forEach((row, index) => {
    const empId = row['EmployeeID'] || row['Employee ID'] || row['EmpID'];
    const date = row['Date']; // YYYY-MM-DD
    const time = row['Time']; // HH:MM

    if (!empId || !date || !time) {
      // Skip invalid rows or log error
      return;
    }

    const key = `${empId}_${date}`;
    if (!grouped[key]) {
      grouped[key] = {
        employeeId: empId,
        date: date,
        punches: []
      };
    }
    grouped[key].punches.push(time);
  });

  // 2. Process each group
  Object.values(grouped).forEach(group => {
    // Find User
    // Flexible matching: check EmployeeID field in users
    const user = users.find(u => u.employeeId === group.employeeId || u.id === group.employeeId);

    if (!user) {
      errors.push(`User not found for Employee ID: ${group.employeeId}`);
      return;
    }

    // Sort punches
    const sortedPunches = group.punches.sort();
    const firstIn = sortedPunches[0];
    const lastOut = sortedPunches.length > 1 ? sortedPunches[sortedPunches.length - 1] : null;

    // Use existing calculation logic
    // Find Roster
    const targetRoster = rosters.find(r => r.employeeId === user.employeeId && r.date === group.date);

    const result = calculateAttendanceStatus(firstIn, lastOut, group.date, targetRoster);

    // Create Attendance Record
    const record = {
      id: `${user.employeeId}-${group.date}`,
      employeeId: user.employeeId, // Keep string/number consistent
      uid: user.id || user.uid, // Store Firestore UID if available
      name: user.name || user.displayName,
      date: group.date,
      clockIn: firstIn,
      clockOut: lastOut,
      status: result.status,
      workHours: result.workHours,
      workingDays: result.workingDays,
      ruleApplied: result.ruleApplied,
      overtime: result.overtime,
      isManualImport: true,
      lastUpdated: new Date().toISOString()
    };

    processedData.push(record);
  });

  return { processedData, errors };
};

export const parseDatFile = (content) => {
  const rows = [];
  const lines = content.split(/\r?\n/);

  lines.forEach(line => {
    // Basic cleaning
    const trimmed = line.trim();
    if (!trimmed) return;

    // Split by whitespace (tabs or spaces)
    const parts = trimmed.split(/\s+/);

    // Expected formats often used in .dat:
    // Format 1: ID Date Time VerifyState WorkCode (e.g., 101 2024-01-23 09:00:00 1 0)
    // Format 2: ID Date Time (e.g., 101 2024-01-23 09:00:00)

    // We assume at least 3 parts: ID, Date, Time (or Date+Time combined string)
    if (parts.length >= 3) {
      const id = parts[0];
      let dateStr = parts[1];
      let timeStr = parts[2];

      // Handle combined DateTime if stuck together or variations.
      // Standard "YYYY-MM-DD" "HH:MM:SS"

      rows.push({
        'EmployeeID': id,
        'Date': dateStr,
        'Time': timeStr,
        'Raw': line
      });
    }
  });

  return rows;
};
