import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Tabs = ({ tabs, defaultTab = 0, onChange }) => {
    const [activeTab, setActiveTab] = useState(defaultTab);

    const handleTabChange = (index) => {
        setActiveTab(index);
        if (onChange) {
            onChange(index);
        }
    };

    return (
        <div>
            {/* Tab Headers */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-8" role="tablist">
                    {tabs.map((tab, index) => {
                        const isActive = activeTab === index;

                        return (
                            <button
                                key={index}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`panel-${index}`}
                                onClick={() => handleTabChange(index)}
                                className={`relative pb-4 px-1 text-sm font-medium transition-colors ${isActive
                                        ? 'text-primary-600 dark:text-primary-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    {tab.icon && <tab.icon className="w-5 h-5" />}
                                    <span>{tab.label}</span>
                                    {tab.badge && (
                                        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full text-xs">
                                            {tab.badge}
                                        </span>
                                    )}
                                </div>

                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Panels */}
            <div className="mt-6">
                {tabs.map((tab, index) => {
                    const isActive = activeTab === index;

                    return (
                        <div
                            key={index}
                            id={`panel-${index}`}
                            role="tabpanel"
                            aria-labelledby={`tab-${index}`}
                            hidden={!isActive}
                        >
                            {isActive && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {tab.content}
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Tabs;
