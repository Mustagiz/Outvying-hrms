/**
 * Permissions Configuration
 * Defines the available actions and resources for the RBAC system
 */

export const PERMISSIONS = {
    EMPLOYEES: {
        VIEW: 'employees.view',
        CREATE: 'employees.create',
        UPDATE: 'employees.update',
        DELETE: 'employees.delete',
        VIEW_SENSITIVE: 'employees.view_sensitive', // For salary/bank info
    },
    ATTENDANCE: {
        VIEW: 'attendance.view',
        MARK: 'attendance.mark',
        APPROVE: 'attendance.approve',
        MANAGE_RULES: 'attendance.manage_rules',
    },
    PAYROLL: {
        VIEW: 'payroll.view',
        GENERATE: 'payroll.generate',
        APPROVE: 'payroll.approve',
        DOWNLOAD_SLIPS: 'payroll.download_slips',
    },
    LEAVE: {
        APPLY: 'leave.apply',
        APPROVE: 'leave.approve',
        MANAGE_POLICY: 'leave.manage_policy',
    },
    RECRUITMENT: {
        VIEW_JOBS: 'recruitment.view_jobs',
        POST_JOB: 'recruitment.post_job',
        MANAGE_APPLICANTS: 'recruitment.manage_applicants',
    },
    SYSTEM: {
        VIEW_LOGS: 'system.view_logs',
        MANAGE_PERMISSIONS: 'system.manage_permissions',
        VIEW_HEALTH: 'system.view_health',
        MANAGE_WEBHOOKS: 'system.manage_webhooks',
    }
};

/**
 * Default Role Sets
 */
export const DEFAULT_ROLES = {
    SUPER_ADMIN: {
        name: 'Super Admin',
        permissions: ['*'], // All access
    },
    HR_MANAGER: {
        name: 'HR Manager',
        permissions: [
            'employees.*',
            'attendance.view',
            'attendance.approve',
            'leave.approve',
            'recruitment.*',
            'payroll.view'
        ],
    },
    EMPLOYEE: {
        name: 'Employee',
        permissions: [
            'employees.view',
            'attendance.view',
            'attendance.mark',
            'leave.apply',
            'payroll.download_slips'
        ],
    }
};

/**
 * Permission Checker Logic
 */
export const hasPermission = (userPermissions, requiredPermission) => {
    if (!userPermissions) return false;
    if (userPermissions.includes('*')) return true;

    // Support wildcard patterns (e.g., 'employees.*')
    const [resource, action] = requiredPermission.split('.');
    if (userPermissions.includes(`${resource}.*`)) return true;

    return userPermissions.includes(requiredPermission);
};
