import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Breadcrumbs component for navigation context
export const Breadcrumbs = ({ className = '' }) => {
    const location = useLocation();

    // Generate breadcrumb items from current path
    const generateBreadcrumbs = () => {
        const pathnames = location.pathname.split('/').filter((x) => x);

        const breadcrumbs = [
            { name: 'Home', path: '/dashboard', icon: Home },
        ];

        let currentPath = '';
        pathnames.forEach((pathname) => {
            currentPath += `/${pathname}`;

            // Convert pathname to readable name
            const name = pathname
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            breadcrumbs.push({
                name,
                path: currentPath,
            });
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    // Don't show breadcrumbs on dashboard
    if (location.pathname === '/dashboard' || location.pathname === '/') {
        return null;
    }

    return (
        <nav className={`flex items-center space-x-2 text-sm mb-6 ${className}`} aria-label="Breadcrumb">
            {breadcrumbs.map((breadcrumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                const Icon = breadcrumb.icon;

                return (
                    <div key={breadcrumb.path} className="flex items-center">
                        {index > 0 && (
                            <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                        )}
                        {isLast ? (
                            <span className="text-gray-900 dark:text-white font-medium flex items-center">
                                {Icon && <Icon className="w-4 h-4 mr-1" />}
                                {breadcrumb.name}
                            </span>
                        ) : (
                            <Link
                                to={breadcrumb.path}
                                className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center"
                            >
                                {Icon && <Icon className="w-4 h-4 mr-1" />}
                                {breadcrumb.name}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};

export default Breadcrumbs;
