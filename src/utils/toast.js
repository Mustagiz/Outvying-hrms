import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Toast notification wrapper component
export const ToastProvider = ({ children }) => {
    return (
        <>
            {children}
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                    // Default options
                    className: '',
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '16px',
                        fontSize: '14px',
                    },
                    // Success
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                        style: {
                            background: '#10b981',
                            color: '#fff',
                        },
                    },
                    // Error
                    error: {
                        duration: 5000,
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                        style: {
                            background: '#ef4444',
                            color: '#fff',
                        },
                    },
                    // Loading
                    loading: {
                        iconTheme: {
                            primary: '#3b82f6',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </>
    );
};

// Toast notification utilities
export const showToast = {
    success: (message, options = {}) => {
        return toast.success(message, {
            ...options,
            icon: '✓',
        });
    },

    error: (message, options = {}) => {
        return toast.error(message, {
            ...options,
            icon: '✕',
        });
    },

    loading: (message, options = {}) => {
        return toast.loading(message, options);
    },

    promise: (promise, messages) => {
        return toast.promise(promise, {
            loading: messages.loading || 'Loading...',
            success: messages.success || 'Success!',
            error: messages.error || 'Error occurred',
        });
    },

    custom: (message, options = {}) => {
        return toast(message, options);
    },

    dismiss: (toastId) => {
        if (toastId) {
            toast.dismiss(toastId);
        } else {
            toast.dismiss();
        }
    },
};

// Pre-configured toast messages for common actions
export const toastMessages = {
    // Authentication
    loginSuccess: () => showToast.success('Welcome back!'),
    loginError: () => showToast.error('Invalid credentials. Please try again.'),
    logoutSuccess: () => showToast.success('Logged out successfully'),

    // Attendance
    clockInSuccess: () => showToast.success('Clocked in successfully'),
    clockOutSuccess: () => showToast.success('Clocked out successfully'),
    attendanceError: () => showToast.error('Failed to update attendance'),

    // Leave
    leaveApplied: () => showToast.success('Leave application submitted'),
    leaveApproved: () => showToast.success('Leave approved'),
    leaveRejected: () => showToast.error('Leave rejected'),
    leaveError: () => showToast.error('Failed to process leave request'),

    // Employee
    employeeAdded: () => showToast.success('Employee added successfully'),
    employeeUpdated: () => showToast.success('Employee updated successfully'),
    employeeDeleted: () => showToast.success('Employee deleted successfully'),
    employeeError: () => showToast.error('Failed to process employee data'),

    // Document
    documentUploaded: () => showToast.success('Document uploaded successfully'),
    documentDeleted: () => showToast.success('Document deleted successfully'),
    documentError: () => showToast.error('Failed to process document'),

    // Payroll
    payrollGenerated: () => showToast.success('Payroll generated successfully'),
    payrollError: () => showToast.error('Failed to generate payroll'),

    // General
    saveSuccess: () => showToast.success('Changes saved successfully'),
    saveError: () => showToast.error('Failed to save changes'),
    deleteSuccess: () => showToast.success('Deleted successfully'),
    deleteError: () => showToast.error('Failed to delete'),
    updateSuccess: () => showToast.success('Updated successfully'),
    updateError: () => showToast.error('Failed to update'),

    // Network
    networkError: () => showToast.error('Network error. Please check your connection.'),
    serverError: () => showToast.error('Server error. Please try again later.'),

    // Validation
    validationError: (message) => showToast.error(message || 'Please check your input'),

    // Permission
    permissionDenied: () => showToast.error('You don\'t have permission to perform this action'),
};

export default showToast;
