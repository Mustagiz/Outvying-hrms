import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';

// Global search component with fuzzy search
export const GlobalSearch = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Search index - this would ideally come from your data
    const searchableItems = [
        // Pages
        { type: 'page', title: 'Dashboard', path: '/dashboard', keywords: ['home', 'overview', 'stats'] },
        { type: 'page', title: 'Attendance', path: '/attendance', keywords: ['clock', 'time', 'present', 'absent'] },
        { type: 'page', title: 'Leave Management', path: '/leave', keywords: ['vacation', 'time off', 'holiday'] },
        { type: 'page', title: 'Employee Directory', path: '/employees', keywords: ['staff', 'team', 'people'] },
        { type: 'page', title: 'Payroll', path: '/payroll', keywords: ['salary', 'payment', 'compensation'] },
        { type: 'page', title: 'Reports', path: '/reports', keywords: ['analytics', 'statistics', 'data'] },
        { type: 'page', title: 'Settings', path: '/settings', keywords: ['configuration', 'preferences'] },
        { type: 'page', title: 'Roster', path: '/roster', keywords: ['schedule', 'shift', 'planning'] },
        { type: 'page', title: 'Documents', path: '/documents', keywords: ['files', 'uploads'] },
        { type: 'page', title: 'Onboarding', path: '/onboarding', keywords: ['new hire', 'joining'] },
        { type: 'page', title: 'Profile', path: '/profile', keywords: ['account', 'user', 'personal'] },

        // Actions
        { type: 'action', title: 'Apply for Leave', path: '/leave', action: 'apply', keywords: ['request leave'] },
        { type: 'action', title: 'Clock In', path: '/attendance', action: 'clockin', keywords: ['start work'] },
        { type: 'action', title: 'Clock Out', path: '/attendance', action: 'clockout', keywords: ['end work'] },
        { type: 'action', title: 'Upload Document', path: '/documents', action: 'upload', keywords: ['add file'] },
    ];

    // Initialize Fuse.js for fuzzy search
    const fuse = new Fuse(searchableItems, {
        keys: ['title', 'keywords'],
        threshold: 0.3,
        includeScore: true,
    });

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

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
            setResults(searchResults.slice(0, 8));
        } else {
            setResults([]);
        }
    }, [query]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (isOpen) {
                    onClose();
                }
            }
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Save search to recent
    const saveRecentSearch = (item) => {
        const updated = [item, ...recentSearches.filter((s) => s.path !== item.path)].slice(0, 5);
        setRecentSearches(updated);
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

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full overflow-hidden animate-fadeIn">
                {/* Search Input */}
                <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search pages, actions, employees..."
                        className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    <kbd className="hidden sm:inline-block ml-3 px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400 rounded">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-96 overflow-y-auto">
                    {query && results.length > 0 && (
                        <div className="p-2">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2">
                                Search Results
                            </div>
                            {results.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(item)}
                                    className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                >
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {item.title}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.type === 'page' ? 'Page' : 'Action'}
                                        </div>
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-gray-400" />
                                </button>
                            ))}
                        </div>
                    )}

                    {!query && recentSearches.length > 0 && (
                        <div className="p-2">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Recent Searches
                            </div>
                            {recentSearches.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSelect(item)}
                                    className="w-full flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                >
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {item.title}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {query && results.length === 0 && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No results found for "{query}"</p>
                        </div>
                    )}

                    {!query && recentSearches.length === 0 && (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Start typing to search...</p>
                            <p className="text-xs mt-2">Try searching for pages, actions, or employees</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
                            Select
                        </span>
                    </div>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Cmd</kbd>
                        <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">K</kbd>
                        to close
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
