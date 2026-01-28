import React from 'react';
import { motion } from 'framer-motion';

const ProgressBar = ({
    value,
    max = 100,
    color = 'primary',
    size = 'md',
    showLabel = true,
    label = '',
    animated = true,
}) => {
    const percentage = Math.min((value / max) * 100, 100);

    const sizeClasses = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    };

    const colorClasses = {
        primary: 'bg-primary-600',
        success: 'bg-green-600',
        warning: 'bg-yellow-600',
        danger: 'bg-red-600',
        info: 'bg-blue-600',
    };

    const bgColorClasses = {
        primary: 'bg-primary-100 dark:bg-primary-900',
        success: 'bg-green-100 dark:bg-green-900',
        warning: 'bg-yellow-100 dark:bg-yellow-900',
        danger: 'bg-red-100 dark:bg-red-900',
        info: 'bg-blue-100 dark:bg-blue-900',
    };

    return (
        <div className="w-full">
            {(showLabel || label) && (
                <div className="flex items-center justify-between mb-2">
                    {label && (
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {label}
                        </span>
                    )}
                    {showLabel && (
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}

            <div
                className={`w-full ${bgColorClasses[color]} rounded-full overflow-hidden ${sizeClasses[size]}`}
            >
                {animated ? (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
                    />
                ) : (
                    <div
                        style={{ width: `${percentage}%` }}
                        className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
                    />
                )}
            </div>
        </div>
    );
};

export default ProgressBar;
