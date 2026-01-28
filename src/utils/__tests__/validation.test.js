// Example test for validation utilities
import { validateData, employeeSchema, sanitizeInput } from '../validation';

describe('Validation Utilities', () => {
    describe('employeeSchema', () => {
        it('should validate correct employee data', () => {
            const validData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '+91 9876543210',
                department: 'Engineering',
                designation: 'Software Engineer',
                dateOfJoining: '2024-01-15',
            };

            const result = validateData(employeeSchema, validData);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(validData);
            expect(result.errors).toEqual({});
        });

        it('should reject invalid email', () => {
            const invalidData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'invalid-email',
                phone: '+91 9876543210',
                department: 'Engineering',
                designation: 'Software Engineer',
                dateOfJoining: '2024-01-15',
            };

            const result = validateData(employeeSchema, invalidData);

            expect(result.success).toBe(false);
            expect(result.errors.email).toBeDefined();
        });

        it('should reject missing required fields', () => {
            const invalidData = {
                firstName: 'John',
                // Missing lastName
                email: 'john@example.com',
            };

            const result = validateData(employeeSchema, invalidData);

            expect(result.success).toBe(false);
            expect(result.errors.lastName).toBeDefined();
        });
    });

    describe('sanitizeInput', () => {
        it('should remove script tags', () => {
            const malicious = '<script>alert("XSS")</script>Hello';
            const sanitized = sanitizeInput(malicious);

            expect(sanitized).not.toContain('<script>');
            expect(sanitized).toContain('Hello');
        });

        it('should preserve safe HTML', () => {
            const safe = '<p>Hello <strong>World</strong></p>';
            const sanitized = sanitizeInput(safe);

            expect(sanitized).toContain('Hello');
            expect(sanitized).toContain('World');
        });

        it('should handle empty strings', () => {
            const result = sanitizeInput('');
            expect(result).toBe('');
        });
    });
});
