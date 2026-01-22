// IP validation utilities
export const ipToNumber = (ip) => {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
};

export const cidrToRange = (cidr) => {
  const [ip, bits] = cidr.includes('/') ? cidr.split('/') : [cidr, '32'];
  const mask = ~((1 << (32 - parseInt(bits))) - 1);
  const ipNum = ipToNumber(ip);
  return {
    start: (ipNum & mask) >>> 0,
    end: (ipNum | ~mask) >>> 0
  };
};

export const ipMatchesRange = (clientIP, allowedIP) => {
  const clientNum = ipToNumber(clientIP);
  const range = cidrToRange(allowedIP);
  return clientNum >= range.start && clientNum <= range.end;
};

export const validateIP = (clientIP, config = {}) => {
  if (!config.enabled || !config.ipList || config.ipList.length === 0) {
    return { allowed: true, location: 'Unrestricted' };
  }

  for (let item of config.ipList) {
    if (ipMatchesRange(clientIP, item.ip)) {
      return { allowed: true, location: item.label };
    }
  }

  return { allowed: false, location: 'Unknown', message: config.blockMessage };
};

export const logIPAccess = (employeeId, employeeName, action, ipAddress, status, location) => {
  const logs = JSON.parse(localStorage.getItem('ipAccessLogs') || '[]');
  logs.push({
    employeeId,
    employeeName,
    action,
    ipAddress,
    status,
    location,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('ipAccessLogs', JSON.stringify(logs));
};

export const getCurrentIP = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    return data.ip;
  } catch (error) {
    return '127.0.0.1';
  }
};

export const checkModuleAccess = (module, config = {}) => {
  return config.enabled && config.modules && config.modules[module];
};
