import React, { useState } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';
import { Button } from './UI';

// Confirmation Dialog Component
export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger', // 'danger', 'warning', 'info', 'success'
    loading = false,
}) => {
    if (!isOpen) return null;

    const variantConfig = {
        danger: {
            icon: AlertCircle,
            iconColor: 'text-red-600',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
        },
        warning: {
            icon: AlertCircle,
            iconColor: 'text-yellow-600',
            confirmButtonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        },
        info: {
            icon: Info,
            iconColor: 'text-blue-600',
            confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
        },
        success: {
            icon: Check,
            iconColor: 'text-green-600',
            confirmButtonClass: 'bg-green-600 hover:bg-green-700 text-white',
        },
    };

    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 animate-fadeIn">
                <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 ${config.iconColor}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        disabled={loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex gap-3 mt-6 justify-end">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmButtonClass}`}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Hook for using confirmation dialogs
export const useConfirmDialog = () => {
    const [dialogState, setDialogState] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'danger',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
    });

    const showConfirm = (options) => {
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                title: options.title || 'Confirm Action',
                message: options.message || 'Are you sure?',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                variant: options.variant || 'danger',
                onConfirm: () => {
                    setDialogState((prev) => ({ ...prev, isOpen: false }));
                    resolve(true);
                },
            });
        });
    };

    const hideConfirm = () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
    };

    const ConfirmDialogComponent = () => (
        <ConfirmDialog
            isOpen={dialogState.isOpen}
            onClose={hideConfirm}
            onConfirm={dialogState.onConfirm}
            title={dialogState.title}
            message={dialogState.message}
            confirmText={dialogState.confirmText}
            cancelText={dialogState.cancelText}
            variant={dialogState.variant}
        />
    );

    return {
        showConfirm,
        hideConfirm,
        ConfirmDialog: ConfirmDialogComponent,
    };
};

// Pre-configured confirmation dialogs
export const confirmDelete = (itemName) => ({
    title: 'Delete Confirmation',
    message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger',
});

export const confirmApprove = (itemName) => ({
    title: 'Approve Confirmation',
    message: `Are you sure you want to approve ${itemName}?`,
    confirmText: 'Approve',
    cancelText: 'Cancel',
    variant: 'success',
});

export const confirmReject = (itemName) => ({
    title: 'Reject Confirmation',
    message: `Are you sure you want to reject ${itemName}?`,
    confirmText: 'Reject',
    cancelText: 'Cancel',
    variant: 'danger',
});

export const confirmLogout = () => ({
    title: 'Logout Confirmation',
    message: 'Are you sure you want to logout?',
    confirmText: 'Logout',
    cancelText: 'Cancel',
    variant: 'warning',
});

export default ConfirmDialog;
