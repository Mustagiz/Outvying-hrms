import React from 'react';
import { FileText, Inbox, Users, Calendar, AlertCircle } from 'lucide-react';
import { Button } from './UI';

// Empty state component
export const EmptyState = ({
    icon: Icon = Inbox,
    title = 'No data found',
    description = 'There are no items to display at the moment.',
    action,
    actionLabel,
    className = '',
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
            <div className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-600">
                <Icon className="w-full h-full" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
                {description}
            </p>
            {action && actionLabel && (
                <Button onClick={action} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

// Pre-configured empty states
export const NoEmployees = ({ onAdd }) => (
    <EmptyState
        icon={Users}
        title="No employees found"
        description="Get started by adding your first employee to the system."
        action={onAdd}
        actionLabel="Add Employee"
    />
);

export const NoAttendance = () => (
    <EmptyState
        icon={Calendar}
        title="No attendance records"
        description="Attendance records will appear here once employees start clocking in."
    />
);

export const NoLeaves = ({ onApply }) => (
    <EmptyState
        icon={FileText}
        title="No leave applications"
        description="You haven't applied for any leaves yet. Apply for leave when you need time off."
        action={onApply}
        actionLabel="Apply for Leave"
    />
);

export const NoDocuments = ({ onUpload }) => (
    <EmptyState
        icon={FileText}
        title="No documents uploaded"
        description="Upload important documents like ID proofs, certificates, and more."
        action={onUpload}
        actionLabel="Upload Document"
    />
);

export const NoSearchResults = ({ searchQuery }) => (
    <EmptyState
        icon={AlertCircle}
        title="No results found"
        description={`We couldn't find anything matching "${searchQuery}". Try adjusting your search.`}
    />
);

export const NoNotifications = () => (
    <EmptyState
        icon={Inbox}
        title="No notifications"
        description="You're all caught up! New notifications will appear here."
    />
);

export const ErrorState = ({ onRetry, message }) => (
    <EmptyState
        icon={AlertCircle}
        title="Something went wrong"
        description={message || "We encountered an error loading this data. Please try again."}
        action={onRetry}
        actionLabel="Try Again"
    />
);

export default EmptyState;
