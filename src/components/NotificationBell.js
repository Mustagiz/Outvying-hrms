import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Safety check for notifications
    const safeNotifications = notifications || [];
    const unreadCount = safeNotifications.filter(n => !n.read).length;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = async (notification) => {
        try {
            // Mark as read first
            if (!notification.read) {
                await markNotificationAsRead(notification.id);
            }

            // Small delay to ensure Firestore updates
            await new Promise(resolve => setTimeout(resolve, 100));

            // Navigate to action URL if provided
            if (notification.actionUrl) {
                navigate(notification.actionUrl);
            }

            setShowDropdown(false);
        } catch (error) {
            console.error('Error handling notification click:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type) => {
        const iconClass = "w-2 h-2 rounded-full";
        switch (type) {
            case 'leave_request':
            case 'regularization_request':
                return <div className={`${iconClass} bg-blue-500`} />;
            case 'leave_approved':
            case 'regularization_approved':
                return <div className={`${iconClass} bg-green-500`} />;
            case 'leave_rejected':
            case 'regularization_rejected':
                return <div className={`${iconClass} bg-red-500`} />;
            case 'roster_change':
                return <div className={`${iconClass} bg-yellow-500`} />;
            default:
                return <div className={`${iconClass} bg-gray-500`} />;
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {safeNotifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                                No notifications
                            </div>
                        ) : (
                            safeNotifications.slice(0, 10).map((notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-normal'} text-gray-900 dark:text-white`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                {formatTime(notification.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {safeNotifications.length > 10 && (
                        <div className="p-2 text-center border-t border-gray-200 dark:border-gray-700">
                            <button className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
