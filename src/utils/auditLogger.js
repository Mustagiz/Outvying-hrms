import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Log an administrative action to Firestore
 * @param {Object} logData - The data to log
 * @param {string} logData.action - Type of action (e.g., 'CREATE_EMPLOYEE', 'UPDATE_SALARY', 'RELEASE_PAYSLIP')
 * @param {Object} logData.performedBy - User object { uid, name, role }
 * @param {string} logData.targetId - ID of the entity being modified (e.g., employeeId)
 * @param {string} [logData.targetName] - Name of the entity being modified
 * @param {Object} [logData.details] - Additional context or data being changed
 * @param {string} [logData.category] - Category (e.g., 'EMPLOYEE', 'PAYROLL', 'ATTENDANCE', 'SYSTEM')
 */
export const logAuditAction = async ({
    action,
    performedBy,
    targetId,
    targetName = '',
    details = {},
    category = 'SYSTEM'
}) => {
    try {
        const auditRef = collection(db, 'auditLogs');
        await addDoc(auditRef, {
            action,
            category,
            performedBy: {
                uid: performedBy?.uid || 'unknown',
                email: performedBy?.email || 'unknown',
                name: performedBy?.displayName || performedBy?.name || 'System',
                role: performedBy?.role || 'Guest'
            },
            targetId,
            targetName,
            details,
            timestamp: serverTimestamp(),
            // Helpful for quick filtering in the dashboard
            dateString: new Date().toLocaleDateString('en-IN')
        });
    } catch (error) {
        console.error('Failed to log audit action:', error);
    }
};

// Convenient object export for simpler API: auditLogger.log({...})
export const auditLogger = {
    log: (action, description, currentUser, targetId = 'SYSTEM', category = 'SYSTEM') => {
        return logAuditAction({
            action,
            performedBy: currentUser,
            targetId: targetId,
            targetName: description,
            category
        });
    }
};
