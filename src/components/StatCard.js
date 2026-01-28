import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, change, changeType, icon: Icon, color = 'blue' }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
        green: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
        yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
        red: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
    };

    const getTrendIcon = () => {
        if (changeType === 'increase') return TrendingUp;
        if (changeType === 'decrease') return TrendingDown;
        return Minus;
    };

    const getTrendColor = () => {
        if (changeType === 'increase') return 'text-green-600 dark:text-green-400';
        if (changeType === 'decrease') return 'text-red-600 dark:text-red-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    const TrendIcon = getTrendIcon();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {title}
                    </p>
                    <motion.p
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="text-3xl font-bold text-gray-900 dark:text-white"
                    >
                        {value}
                    </motion.p>

                    {change !== undefined && (
                        <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
                            <TrendIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {Math.abs(change)}%
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                vs last month
                            </span>
                        </div>
                    )}
                </div>

                {Icon && (
                    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default StatCard;
