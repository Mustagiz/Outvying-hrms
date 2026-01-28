import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';

// Global search component with fuzzy search (Command Palette)
export const GlobalSearch = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Search index
    const searchableItems = [
        // Pages
        { type: 'page', title: 'Dashboard', path: '/dashboard', keywords: ['home', 'overview', 'stats'] },
        { type: 'page', title: 'Attendance', path: '/attendance', keywords: ['clock', 'time', 'present', 'absent'] },
        { type: 'page', title: 'Leave Management', path: '/leave', keywords: ['vacation', 'time off', 'holiday'] },
        { type: 'page', title: 'Employee Directory', path: '/employees', keywords: ['staff', 'team', 'people'] },
        { type: 'page', title: 'Payroll', path: '/payroll', keywords: ['salary', 'payment', 'compensation'] },
        { type: 'page', title: 'Reports', path: '/reports', keywords: ['analytics', 'statistics', 'data'] },
        { type: 'page', title: 'Settings', path: '/settings', keywords: ['configuration', 'preferences'] },
        { type: 'page', title: 'System Health', path: '/system-health', keywords: ['monitoring', 'errors', 'performance'] },
        { type: 'page', title: 'Job Postings', path: '/job-postings', keywords: ['recruitment', 'hiring'] },
        { type: 'page', title: 'Asset Management', path: '/assets', keywords: ['inventory', 'equipment'] },

        // Actions
        { type: 'action', title: 'Apply for Leave', path: '/leave', action: 'apply', keywords: ['request leave'] },
        { type: 'action', title: 'Clock In', path: '/attendance', action: 'clockin', keywords: ['start work'] },
        { type: 'action', title: 'Clock Out', path: '/attendance', action: 'clockout', keywords: ['end work'] },
        { type: 'action', title: 'Add New Employee', path: '/employees', action: 'add', keywords: ['onboarding', 'hiring'] },
        { type: 'action', title: 'Export Payroll Report', path: '/payroll', action: 'export', keywords: ['download', 'csv'] },
    ];

    // Initialize Fuse.js for fuzzy search
    const fuse = new Fuse(searchableItems, {
        keys: ['title', 'keywords'],
        threshold: 0.3,
        includeScore: true,
    });

    // Load recent searches
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, [isOpen]);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle search
    useEffect(() => {
        if (query.trim()) {
            const searchResults = fuse.search(query).map((result) => result.item);
            setResults(searchResults.slice(0, 10));
        } else {
            setResults([]);
        }
    }, [query]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const max = query ? results.length : recentSearches.length;
                setSelectedIndex((prev) => (prev + 1) % max);
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const max = query ? results.length : recentSearches.length;
                setSelectedIndex((prev) => (prev - 1 + max) % max);
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                const list = query ? results : recentSearches;
                if (list[selectedIndex]) {
                    handleSelect(list[selectedIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, recentSearches, selectedIndex, query]);

    // Save search to recent
    const saveRecentSearch = (item) => {
        const updated = [item, ...recentSearches.filter((s) => s.path !== item.path)].slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    // Handle item selection
    const handleSelect = (item) => {
        saveRecentSearch(item);
        navigate(item.path);
        setQuery('');
        onClose();
    };

    if (!isOpen) return null;

    const listToDisplay = query ? results : recentSearches;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-200">
                {/* Search Input */}
                <div className="flex items-center border-b border-gray-100 dark:border-gray-700 px-6 py-4">
                    <Search className="w-5 h-5 text-gray-400 mr-4" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search for anything... (Cmd+K)"
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 text-lg"
                    />
                    {query && (
                        <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Results List */}
                <div className="max-h-[400px] overflow-y-auto p-2">
                    {listToDisplay.length > 0 ? (
                        <div className="space-y-1">
                            {!query && <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Searches</div>}
                            {listToDisplay.map((item, index) => (
                                <button
                                    key={`${item.path}-${index}`}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-150 ${selectedIndex === index ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <div className="flex-1">
                                        <div className={`text-sm font-semibold ${selectedIndex === index ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                            {item.title}
                                        </div>
                                        <div className={`text-xs ${selectedIndex === index ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {item.type === 'page' ? 'Navigation' : 'Action'}
                                        </div>
                                    </div>
                                    {selectedIndex === index && <TrendingUp className="w-4 h-4 ml-2 animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No results found for "{query}"</p>
                            <p className="text-sm mt-1">Try another search term or browse the directory.</p>
                        </div>
                    )}
                </div>

                {/* Footer Shortcuts */}
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-[10px] font-bold shadow-sm">Enter</kbd>
                            <span className="text-xs text-gray-500 font-medium">to select</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-[10px] font-bold shadow-sm">↑↓</kbd>
                            <span className="text-xs text-gray-500 font-medium">to navigate</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-[10px] font-bold shadow-sm">ESC</kbd>
                        <span className="text-xs text-gray-500 font-medium">to close</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
