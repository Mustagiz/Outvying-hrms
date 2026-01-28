import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const phoneSchema = z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const dateSchema = z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
}, 'Invalid date format');

// Employee validation schemas
export const employeeSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    email: emailSchema,
    phone: phoneSchema.optional(),
    employeeId: z.string().min(1, 'Employee ID is required'),
    department: z.string().min(1, 'Department is required'),
    designation: z.string().min(1, 'Designation is required'),
    dateOfJoining: dateSchema,
    salary: z.number().positive('Salary must be positive').optional(),
});

// Leave application validation
export const leaveSchema = z.object({
    leaveType: z.enum(['Sick', 'Casual', 'Annual', 'Maternity', 'Paternity']),
    startDate: dateSchema,
    endDate: dateSchema,
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
    halfDay: z.boolean().optional(),
}).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
}, {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
});

// Attendance validation
export const attendanceSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    date: dateSchema,
    clockIn: z.string().optional(),
    clockOut: z.string().optional(),
    status: z.enum(['Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Holiday']),
    workHours: z.number().min(0).max(24).optional(),
    location: z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
    }).optional(),
});

// Bank account validation
export const bankAccountSchema = z.object({
    accountHolderName: z.string().min(1, 'Account holder name is required'),
    accountNumber: z.string().min(8, 'Invalid account number').max(20),
    bankName: z.string().min(1, 'Bank name is required'),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code'),
    branchName: z.string().min(1, 'Branch name is required'),
    accountType: z.enum(['Savings', 'Current']),
});

// Document validation
export const documentSchema = z.object({
    documentType: z.enum(['Resume', 'ID Proof', 'Address Proof', 'Certificate', 'Other']),
    documentName: z.string().min(1, 'Document name is required'),
    expiryDate: dateSchema.optional(),
    fileSize: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
    fileType: z.enum(['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']),
});

// Payroll validation
export const payrollSchema = z.object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    month: z.number().min(1).max(12),
    year: z.number().min(2000).max(2100),
    basicSalary: z.number().positive('Basic salary must be positive'),
    allowances: z.number().min(0).optional(),
    deductions: z.number().min(0).optional(),
    tax: z.number().min(0).optional(),
    netSalary: z.number().positive('Net salary must be positive'),
});

// Login validation
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required'),
});

// Expense validation
export const expenseSchema = z.object({
    category: z.enum(['Travel', 'Food', 'Accommodation', 'Equipment', 'Other']),
    amount: z.number().positive('Amount must be positive'),
    date: dateSchema,
    description: z.string().min(10, 'Description must be at least 10 characters').max(500),
    receiptUrl: z.string().url().optional(),
});

// Asset validation
export const assetSchema = z.object({
    assetName: z.string().min(1, 'Asset name is required'),
    assetType: z.enum(['Laptop', 'Mobile', 'Tablet', 'Monitor', 'Keyboard', 'Mouse', 'Other']),
    assetId: z.string().min(1, 'Asset ID is required'),
    serialNumber: z.string().optional(),
    purchaseDate: dateSchema,
    warrantyExpiry: dateSchema.optional(),
    assignedTo: z.string().optional(),
});

// Validation helper function
export const validateData = (schema, data) => {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData, errors: null };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.reduce((acc, err) => {
                const path = err.path.join('.');
                acc[path] = err.message;
                return acc;
            }, {});
            return { success: false, data: null, errors: formattedErrors };
        }
        return { success: false, data: null, errors: { general: 'Validation failed' } };
    }
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Validate file upload
export const validateFileUpload = (file, maxSize = 10 * 1024 * 1024, allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']) => {
    const errors = [];

    if (!file) {
        errors.push('No file selected');
        return { valid: false, errors };
    }

    if (file.size > maxSize) {
        errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
        errors.push(`File type must be one of: ${allowedTypes.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
};

export default {
    emailSchema,
    passwordSchema,
    phoneSchema,
    dateSchema,
    employeeSchema,
    leaveSchema,
    attendanceSchema,
    bankAccountSchema,
    documentSchema,
    payrollSchema,
    loginSchema,
    expenseSchema,
    assetSchema,
    validateData,
    sanitizeInput,
    validateFileUpload,
};
