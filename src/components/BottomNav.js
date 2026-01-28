import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Home,
    Users,
    Calendar,
    FileText,
    Settings,
    BarChart3,
} from 'lucide-react';

// Bottom navigation for mobile devices
export const BottomNav = ({ userRole = 'employee' }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Navigation items based on user role
    const getNavItems = () => {
        const commonItems = [
            { path: '/dashboard', icon: Home, label: 'Home' },
            { path: '/attendance', icon: Calendar, label: 'Attendance' },
        ];

        if (userRole === 'employee') {
            return [
                ...commonItems,
                { path: '/leave', icon: FileText, label: 'Leave' },
                { path: '/profile', icon: Users, label: 'Profile' },
            ];
        }

        if (userRole === 'hr' || userRole === 'admin' || userRole === 'superadmin') {
            return [
                ...commonItems,
                { path: '/employees', icon: Users, label: 'Employees' },
                { path: '/reports', icon: BarChart3, label: 'Reports' },
                { path: '/settings', icon: Settings, label: 'Settings' },
            ];
        }

        return commonItems;
    };

    const navItems = getNavItems();

    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-inset-bottom">
            <nav className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Icon className={`w-6 h-6 mb-1 ${active ? 'stroke-2' : 'stroke-1.5'}`} />
                            <span className={`text-xs ${active ? 'font-semibold' : 'font-normal'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default BottomNav;
