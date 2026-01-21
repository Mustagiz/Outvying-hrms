export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const setToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const calculateWorkHours = (clockIn, clockOut) => {
  if (!clockIn || !clockOut) return 0;
  const [inHour, inMin] = clockIn.split(':').map(Number);
  const [outHour, outMin] = clockOut.split(':').map(Number);
  const hours = outHour - inHour + (outMin - inMin) / 60;
  return hours.toFixed(2);
};

export const getMonthName = (monthIndex) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex];
};

export const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

export const getStatusColor = (status) => {
  const colors = {
    'Present': 'text-green-600 bg-green-100',
    'Absent': 'text-red-600 bg-red-100',
    'Late': 'text-yellow-600 bg-yellow-100',
    'Approved': 'text-green-600 bg-green-100',
    'Pending': 'text-yellow-600 bg-yellow-100',
    'Rejected': 'text-red-600 bg-red-100',
    'LWP': 'text-orange-600 bg-orange-100'
  };
  return colors[status] || 'text-gray-600 bg-gray-100';
};

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const filterData = (data, searchTerm, fields) => {
  if (!searchTerm) return data;

  return data.filter(item =>
    fields.some(field =>
      String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
};

export const sortData = (data, key, direction = 'asc') => {
  return [...data].sort((a, b) => {
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });
};

export const paginateData = (data, page, itemsPerPage) => {
  const startIndex = (page - 1) * itemsPerPage;
  return data.slice(startIndex, startIndex + itemsPerPage);
};

export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return re.test(phone);
};

export const getYearOptions = (startYear = 2022, futureYears = 5) => {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + futureYears;
  const years = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push({ value: year, label: year.toString() });
  }
  return years;
};

// Timezone Utilities
export const TIMEZONES = [
  { label: 'IST (India)', value: 'Asia/Kolkata', offset: '+5:30' },
  { label: 'EST (US East)', value: 'America/New_York', offset: '-5:00' },
  { label: 'CST (US Central)', value: 'America/Chicago', offset: '-6:00' },
  { label: 'MST (US Mountain)', value: 'America/Denver', offset: '-7:00' },
  { label: 'PST (US Pacific)', value: 'America/Los_Angeles', offset: '-8:00' },
  { label: 'UK (London)', value: 'Europe/London', offset: '+0:00' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai', offset: '+4:00' },
  { label: 'Singapore (APAC)', value: 'Asia/Singapore', offset: '+8:00' },
  { label: 'Japan (JST)', value: 'Asia/Tokyo', offset: '+9:00' },
  { label: 'Australia (AEST)', value: 'Australia/Sydney', offset: '+10:00' },
];

/**
 * Converts a time string (HH:mm) from one timezone to another on a specific date.
 * Useful for showing IST equivalents of regional shifts.
 */
export const convertTimeInRange = (timeStr, dateStr, fromTz, toTz = 'Asia/Kolkata') => {
  if (!timeStr || !dateStr) return null;

  try {
    // Combine date and time to create a full Date object context
    const [hours, minutes] = timeStr.split(':').map(Number);
    const dateObj = new Date(dateStr);
    dateObj.setHours(hours, minutes, 0, 0);

    // Use Intl to format the date in the source timezone to get the offset and correct time
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: fromTz,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });

    // Calculate the difference between the intended time in source timezone and the system's local time
    const parts = formatter.formatToParts(dateObj);
    const tzYear = parseInt(parts.find(p => p.type === 'year').value);
    const tzMonth = parseInt(parts.find(p => p.type === 'month').value) - 1;
    const tzDay = parseInt(parts.find(p => p.type === 'day').value);
    const tzHour = parseInt(parts.find(p => p.type === 'hour').value);
    const tzMin = parseInt(parts.find(p => p.type === 'minute').value);

    const tzDate = new Date(Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMin));
    const localDate = new Date(Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate(), dateObj.getUTCHours(), dateObj.getUTCMinutes()));

    const diffMs = localDate.getTime() - tzDate.getTime();
    const convertedDate = new Date(dateObj.getTime() + diffMs);

    // Now format that converted date into the target timezone
    return new Intl.DateTimeFormat('en-US', {
      timeZone: toTz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(convertedDate);
  } catch (error) {
    console.error("Timezone conversion error:", error);
    return timeStr; // Fallback to original time if invalid timezone
  }
};

export const getISTEquivalent = (timeStr, dateStr, sourceTz) => {
  return convertTimeInRange(timeStr, dateStr, sourceTz, 'Asia/Kolkata');
};
