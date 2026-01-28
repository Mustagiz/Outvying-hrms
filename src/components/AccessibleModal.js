import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { focusManagement, announce } from '../utils/accessibility';

const AccessibleModal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const modalRef = useRef(null);
    const previousFocusRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            // Store previously focused element
            previousFocusRef.current = document.activeElement;

            // Announce modal opening
            announce.message(`${title} dialog opened`);

            // Trap focus
            if (modalRef.current) {
                const cleanup = focusManagement.trapFocus(modalRef.current);
                focusManagement.focusFirst(modalRef.current);

                // Prevent body scroll
                document.body.style.overflow = 'hidden';

                return () => {
                    cleanup();
                    document.body.style.overflow = '';

                    // Return focus
                    focusManagement.returnFocus(previousFocusRef.current);

                    // Announce modal closing
                    announce.message(`${title} dialog closed`);
                };
            }
        }
    }, [isOpen, title]);

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-full mx-4',
    };

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                aria-hidden="true"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    ref={modalRef}
                    className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl ${sizeClasses[size]} w-full`}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2
                            id="modal-title"
                            className="text-xl font-semibold text-gray-900 dark:text-white"
                        >
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Close dialog"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">{children}</div>
                </div>
            </div>
        </div>
    );
};

export default AccessibleModal;
