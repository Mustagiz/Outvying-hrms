import { calculateAbsDuration, getEffectiveWorkDate, getTodayLocal } from './helpers';

// Biometric attendance calculation utilities

const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  try {
    const cleanTime = timeStr.trim().toUpperCase();
    const isPM = cleanTime.includes('PM');
    const isAM = cleanTime.includes('AM');
    const [timePart] = cleanTime.split(' ');
    let [h, m] = timePart.split(':').map(Number);

    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;

    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;

    return h * 60 + m;
  } catch (e) {
    return 0;
  }
};

export const calculateAttendanceStatus = (clockIn, clockOut, date = null, roster = null, rules = []) => {
  const istDate = date || getTodayLocal();

  if (!clockIn) {
    if (roster && (roster.shiftName === 'Holiday' || roster.shiftName === 'Weekly Off' || roster.fullDayHours === 0)) {
      return { status: roster.shiftName, workHours: 0, workingDays: 0, ruleApplied: `Roster: ${roster.shiftName}` };
    }
    const day = new Date(istDate).getDay();
    if (!roster && (day === 0 || day === 6)) {
      return { status: 'Weekly Off', workHours: 0, workingDays: 0, ruleApplied: 'Default Weekend' };
    }
    return { status: 'Absent', workHours: 0, workingDays: 0 };
  }

  const defaultRule = rules.find(r => r.isDefault) || { fullDayHours: 8.0, halfDayHours: 4.0, minPresentHours: 1.0, gracePeriodMins: 5 };

  const timezone = roster?.timezone || 'Asia/Kolkata';
  const workDate = roster?.date || getEffectiveWorkDate(clockIn, istDate, timezone);

  const shiftStartTime = roster?.startTime || '09:00';
  const shiftStartInMinutes = timeToMinutes(shiftStartTime);
  const gracePeriod = Number(roster?.gracePeriod ?? defaultRule.gracePeriodMins);

  let clockInInMinutes = timeToMinutes(clockIn);

  // Timezone adjustment for non-IST
  if (timezone && timezone !== 'Asia/Kolkata') {
    try {
      const parts = clockIn.split(':');
      const normalizedClockIn = parts.length > 2 ? parts.slice(0, 2).join(':') : clockIn;
      const istTimestamp = new Date(`${istDate}T${normalizedClockIn}:00+05:30`);
      const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false });
      const timeStr = formatter.format(istTimestamp);
      clockInInMinutes = timeToMinutes(timeStr);
    } catch (e) {
      console.warn("Timezone error:", e);
    }
  }

  const lateThreshold = shiftStartInMinutes + gracePeriod;
  let status = clockInInMinutes > lateThreshold ? 'Late' : 'Present';

  let workingDays = 0;
  let workHours = 0;
  let overtime = 0;

  const effectiveClockOut = (clockOut && clockOut !== 'N/A') ? clockOut : null;

  if (effectiveClockOut) {
    let clockOutDate = istDate;
    const inMin = timeToMinutes(clockIn);
    const outMin = timeToMinutes(effectiveClockOut);

    if (outMin < inMin) {
      const nextDay = new Date(istDate);
      nextDay.setDate(nextDay.getDate() + 1);
      clockOutDate = nextDay.toISOString().split('T')[0];
    }

    workHours = calculateAbsDuration(clockIn, istDate, effectiveClockOut, clockOutDate);

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
      if (status !== 'Late') status = 'Present';
    }

    const overtimeThreshold = roster?.overtimeThreshold || (fullDayThreshold + 1);
    overtime = workHours > overtimeThreshold ? Math.round((workHours - overtimeThreshold) * 100) / 100 : 0;
  }

  const diag = ` (In:${clockInInMinutes}, Thr:${lateThreshold})`;
  return {
    status,
    workHours: Math.round(workHours * 100) / 100,
    workingDays,
    workDate,
    overtime,
    ruleApplied: (roster ? `Roster: ${roster.shiftName}` : (defaultRule.name || 'Standard Office')) + diag
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
    let time = row['Time']; // HH:MM

    // Normalize time to HH:MM if it has seconds
    if (time && time.split(':').length > 2) {
      time = time.split(':').slice(0, 2).join(':');
    }

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
