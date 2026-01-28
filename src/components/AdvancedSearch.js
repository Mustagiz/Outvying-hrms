import React, { useState } from 'react';
import { Search, Filter, X, Calendar, User, Building } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { animations } from '../utils/animations';

const AdvancedSearch = ({ onSearch, filters = [] }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({});

    const handleSearch = () => {
        onSearch({
            searchTerm,
            filters: activeFilters,
        });
    };

    const handleFilterChange = (filterKey, value) => {
        setActiveFilters((prev) => ({
            ...prev,
            [filterKey]: value,
        }));
    };

    const clearFilters = () => {
        setActiveFilters({});
        setSearchTerm('');
        onSearch({ searchTerm: '', filters: {} });
    };

    const activeFilterCount = Object.keys(activeFilters).filter(
        (key) => activeFilters[key]
    ).length;

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search employees, departments, positions..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                </div>

                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`px-4 py-3 rounded-lg border transition-colors ${isExpanded
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        <span>Filters</span>
                        {activeFilterCount > 0 && (
                            <span className="bg-white text-primary-600 px-2 py-0.5 rounded-full text-xs font-medium">
                                {activeFilterCount}
                            </span>
                        )}
                    </div>
                </button>

                <button
                    onClick={handleSearch}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                    Search
                </button>
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        {...animations.collapse}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Advanced Filters
                            </h3>
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                >
                                    <X className="w-4 h-4" />
                                    Clear All
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Department Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Building className="w-4 h-4 inline mr-1" />
                                    Department
                                </label>
                                <select
                                    value={activeFilters.department || ''}
                                    onChange={(e) => handleFilterChange('department', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">All Departments</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="HR">HR</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Marketing">Marketing</option>
                                    <option value="Finance">Finance</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <User className="w-4 h-4 inline mr-1" />
                                    Status
                                </label>
                                <select
                                    value={activeFilters.status || ''}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="On Leave">On Leave</option>
                                </select>
                            </div>

                            {/* Date Range Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Joining Date
                                </label>
                                <select
                                    value={activeFilters.dateRange || ''}
                                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Any Time</option>
                                    <option value="last7days">Last 7 Days</option>
                                    <option value="last30days">Last 30 Days</option>
                                    <option value="last3months">Last 3 Months</option>
                                    <option value="last6months">Last 6 Months</option>
                                    <option value="lastyear">Last Year</option>
                                </select>
                            </div>
                        </div>

                        {/* Active Filters Display */}
                        {activeFilterCount > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    Active Filters:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(activeFilters).map(
                                        ([key, value]) =>
                                            value && (
                                                <span
                                                    key={key}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                                                >
                                                    {key}: {value}
                                                    <button
                                                        onClick={() => handleFilterChange(key, '')}
                                                        className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            )
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdvancedSearch;
