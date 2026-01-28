import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { animations } from '../utils/animations';

const Accordion = ({ items, allowMultiple = false }) => {
    const [openItems, setOpenItems] = useState([]);

    const toggleItem = (index) => {
        if (allowMultiple) {
            setOpenItems((prev) =>
                prev.includes(index)
                    ? prev.filter((i) => i !== index)
                    : [...prev, index]
            );
        } else {
            setOpenItems((prev) => (prev.includes(index) ? [] : [index]));
        }
    };

    return (
        <div className="space-y-2">
            {items.map((item, index) => {
                const isOpen = openItems.includes(index);

                return (
                    <div
                        key={index}
                        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleItem(index)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {item.icon && (
                                    <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                                        <item.icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {item.title}
                                    </h3>
                                    {item.subtitle && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {item.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            </motion.div>
                        </button>

                        {/* Content */}
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div
                                    {...animations.collapse}
                                    className="border-t border-gray-200 dark:border-gray-700"
                                >
                                    <div className="p-4 text-gray-700 dark:text-gray-300">
                                        {item.content}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
};

export default Accordion;
