import React from 'react';

// Skeleton component for loading states
export const Skeleton = ({ className = '', width, height, variant = 'rectangular', animation = 'pulse' }) => {
    const baseClasses = 'bg-gray-200 dark:bg-gray-700';

    const variantClasses = {
        rectangular: 'rounded',
        circular: 'rounded-full',
        text: 'rounded h-4',
    };

    const animationClasses = {
        pulse: 'animate-pulse',
        wave: 'animate-wave',
        none: '',
    };

    const style = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%'),
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
            style={style}
        />
    );
};

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={`header-${i}`} height="40px" />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="32px" />
                    ))}
                </div>
            ))}
        </div>
    );
};

// Card skeleton
export const CardSkeleton = ({ count = 1 }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
                    <Skeleton height="24px" width="60%" />
                    <Skeleton height="16px" width="40%" />
                    <div className="space-y-2">
                        <Skeleton height="12px" />
                        <Skeleton height="12px" width="90%" />
                        <Skeleton height="12px" width="80%" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// List skeleton
export const ListSkeleton = ({ items = 5 }) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <Skeleton variant="circular" width="48px" height="48px" />
                    <div className="flex-1 space-y-2">
                        <Skeleton height="16px" width="40%" />
                        <Skeleton height="12px" width="60%" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// Dashboard skeleton
export const DashboardSkeleton = () => {
    return (
        <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-3">
                        <Skeleton height="20px" width="50%" />
                        <Skeleton height="32px" width="70%" />
                        <Skeleton height="12px" width="40%" />
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <Skeleton height="24px" width="40%" className="mb-4" />
                    <Skeleton height="300px" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <Skeleton height="24px" width="40%" className="mb-4" />
                    <Skeleton height="300px" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <Skeleton height="24px" width="30%" className="mb-4" />
                <TableSkeleton rows={5} columns={5} />
            </div>
        </div>
    );
};

// Form skeleton
export const FormSkeleton = ({ fields = 6 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton height="16px" width="30%" />
                    <Skeleton height="40px" />
                </div>
            ))}
            <div className="flex gap-4 mt-6">
                <Skeleton height="40px" width="120px" />
                <Skeleton height="40px" width="120px" />
            </div>
        </div>
    );
};

export default Skeleton;
