/**
 * Centralized Data Integrity Utilities
 * Handles ID normalization, deduplication, and data consistency
 */

// ============= ID NORMALIZATION =============

/**
 * Get canonical employee ID from user object
 * Priority: uid > id > employeeId
 */
export const getCanonicalId = (user) => {
  if (!user) return null;
  return user.uid || user.id || user.employeeId;
};

/**
 * Normalize employee ID for comparison
 */
export const normalizeId = (id) => {
  return id ? String(id).trim() : null;
};

/**
 * Check if two IDs match (handles uid, id, employeeId)
 */
export const idsMatch = (id1, id2) => {
  if (!id1 || !id2) return false;
  return normalizeId(id1) === normalizeId(id2);
};

/**
 * Find user by any ID field
 */
export const findUserById = (users, targetId) => {
  if (!targetId || !users) return null;
  const normalized = normalizeId(targetId);
  return users.find(u => 
    normalizeId(u.uid) === normalized || 
    normalizeId(u.id) === normalized || 
    normalizeId(u.employeeId) === normalized
  );
};

// ============= DEDUPLICATION =============

/**
 * Deduplicate attendance records by employee and date
 * Keeps the most recent non-virtual record
 */
export const deduplicateAttendance = (attendance, allUsers = []) => {
  const recordsMap = new Map();
  
  attendance.forEach(record => {
    const user = findUserById(allUsers, record.employeeId);
    const canonicalId = user ? getCanonicalId(user) : normalizeId(record.employeeId);
    const key = `${canonicalId}_${record.date}`;
    
    const existing = recordsMap.get(key);
    
    // Keep non-virtual over virtual, or most recent
    if (!existing || 
        (!record.isVirtual && existing.isVirtual) ||
        (record.updatedAt?.toMillis?.() > existing.updatedAt?.toMillis?.())) {
      recordsMap.set(key, { ...record, _canonicalId: canonicalId });
    }
  });
  
  return Array.from(recordsMap.values());
};

/**
 * Deduplicate rosters by employee and date
 */
export const deduplicateRosters = (rosters, allUsers = []) => {
  const rostersMap = new Map();
  
  rosters.forEach(roster => {
    const user = findUserById(allUsers, roster.employeeId);
    const canonicalId = user ? getCanonicalId(user) : normalizeId(roster.employeeId);
    const key = `${canonicalId}_${roster.date}`;
    
    const existing = rostersMap.get(key);
    if (!existing || roster.updatedAt?.toMillis?.() > existing.updatedAt?.toMillis?.()) {
      rostersMap.set(key, { ...roster, _canonicalId: canonicalId });
    }
  });
  
  return Array.from(rostersMap.values());
};

/**
 * Deduplicate leaves by employee
 */
export const deduplicateLeaves = (leaves) => {
  const seen = new Set();
  return leaves.filter(leave => {
    const key = `${leave.id}_${leave.employeeId}_${leave.startDate}_${leave.endDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Get today's attendance for an employee (deduplicated)
 */
export const getTodayAttendance = (attendance, employeeId, date, allUsers = []) => {
  const user = findUserById(allUsers, employeeId);
  const canonicalId = user ? getCanonicalId(user) : normalizeId(employeeId);
  
  const todayRecords = attendance.filter(a => 
    a.date === date && idsMatch(a.employeeId, canonicalId)
  );
  
  if (todayRecords.length === 0) return null;
  if (todayRecords.length === 1) return todayRecords[0];
  
  // Return non-virtual or most recent
  return todayRecords.reduce((best, current) => {
    if (!best) return current;
    if (!current.isVirtual && best.isVirtual) return current;
    if (current.isVirtual && !best.isVirtual) return best;
    return (current.updatedAt?.toMillis?.() > best.updatedAt?.toMillis?.()) ? current : best;
  });
};

// ============= BATCH OPERATIONS =============

/**
 * Create batch operation helper for Firestore
 */
export const createBatchOperation = (db) => {
  const { writeBatch } = require('firebase/firestore');
  return writeBatch(db);
};

/**
 * Execute batch writes with automatic chunking (max 500 per batch)
 */
export const executeBatchWrites = async (db, operations) => {
  const { writeBatch } = require('firebase/firestore');
  const BATCH_SIZE = 500;
  const batches = [];
  
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = operations.slice(i, i + BATCH_SIZE);
    
    chunk.forEach(op => {
      if (op.type === 'set') {
        batch.set(op.ref, op.data, op.options || {});
      } else if (op.type === 'update') {
        batch.update(op.ref, op.data);
      } else if (op.type === 'delete') {
        batch.delete(op.ref);
      }
    });
    
    batches.push(batch.commit());
  }
  
  return Promise.all(batches);
};

// ============= DATA VALIDATION =============

/**
 * Validate attendance record structure
 */
export const validateAttendanceRecord = (record) => {
  const errors = [];
  
  if (!record.employeeId) errors.push('Missing employeeId');
  if (!record.date) errors.push('Missing date');
  if (record.clockIn && !/^\d{2}:\d{2}$/.test(record.clockIn)) {
    errors.push('Invalid clockIn format (expected HH:MM)');
  }
  if (record.clockOut && !/^\d{2}:\d{2}$/.test(record.clockOut)) {
    errors.push('Invalid clockOut format (expected HH:MM)');
  }
  
  return { valid: errors.length === 0, errors };
};

/**
 * Validate user record structure
 */
export const validateUserRecord = (user) => {
  const errors = [];
  
  if (!user.email) errors.push('Missing email');
  if (!user.name) errors.push('Missing name');
  if (!user.role) errors.push('Missing role');
  if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Invalid email format');
  }
  
  return { valid: errors.length === 0, errors };
};

// ============= EXPORT =============

export default {
  getCanonicalId,
  normalizeId,
  idsMatch,
  findUserById,
  deduplicateAttendance,
  deduplicateRosters,
  deduplicateLeaves,
  getTodayAttendance,
  createBatchOperation,
  executeBatchWrites,
  validateAttendanceRecord,
  validateUserRecord
};
