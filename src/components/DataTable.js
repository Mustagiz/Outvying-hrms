/**
 * Advanced Data Table Component
 * Features: sorting, filtering, pagination, column resize, row selection
 */

import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Download, Filter } from 'lucide-react';

const DataTable = ({
    data = [],
    columns = [],
    pageSize = 10,
    onRowClick,
    selectable = false,
    onSelectionChange,
    exportable = true,
    filterable = true,
    className = '',
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [filters, setFilters] = useState({});
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [globalFilter, setGlobalFilter] = useState('');

    // Apply filters
    const filteredData = useMemo(() => {
        let filtered = [...data];

        // Global filter
        if (globalFilter) {
            filtered = filtered.filter((row) =>
                columns.some((col) => {
                    const value = row[col.accessor];
                    return String(value).toLowerCase().includes(globalFilter.toLowerCase());
                })
            );
        }

        // Column filters
        Object.keys(filters).forEach((key) => {
            if (filters[key]) {
                filtered = filtered.filter((row) =>
                    String(row[key]).toLowerCase().includes(filters[key].toLowerCase())
                );
            }
        });

        return filtered;
    }, [data, filters, globalFilter, columns]);

    // Apply sorting
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        const sorted = [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal === bVal) return 0;

            const comparison = aVal < bVal ? -1 : 1;
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });

        return sorted;
    }, [filteredData, sortConfig]);

    // Pagination
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    // Handle sort
    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    // Handle row selection
    const handleRowSelect = (rowIndex) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(rowIndex)) {
            newSelected.delete(rowIndex);
        } else {
            newSelected.add(rowIndex);
        }
        setSelectedRows(newSelected);
        onSelectionChange?.(Array.from(newSelected).map((i) => sortedData[i]));
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedRows.size === sortedData.length) {
            setSelectedRows(new Set());
            onSelectionChange?.([]);
        } else {
            const allIndices = new Set(sortedData.map((_, i) => i));
            setSelectedRows(allIndices);
            onSelectionChange?.(sortedData);
        }
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = columns.map((col) => col.header).join(',');
        const rows = sortedData.map((row) =>
            columns.map((col) => {
                const value = row[col.accessor];
                return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
            }).join(',')
        );
        const csv = [headers, ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data-export.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                {/* Global Search */}
                {filterable && (
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={globalFilter}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {selectedRows.size > 0 && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedRows.size} selected
                        </span>
                    )}
                    {exportable && (
                        <button
                            onClick={exportToCSV}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            {selectable && (
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.size === sortedData.length && sortedData.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                            )}
                            {columns.map((column) => (
                                <th
                                    key={column.accessor}
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => column.sortable !== false && handleSort(column.accessor)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{column.header}</span>
                                        {column.sortable !== false && sortConfig.key === column.accessor && (
                                            sortConfig.direction === 'asc' ? (
                                                <ChevronUp className="w-4 h-4" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4" />
                                            )
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (selectable ? 1 : 0)}
                                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                                >
                                    No data available
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => {
                                const actualIndex = (currentPage - 1) * pageSize + rowIndex;
                                return (
                                    <tr
                                        key={actualIndex}
                                        onClick={() => onRowClick?.(row)}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${onRowClick ? 'cursor-pointer' : ''
                                            } ${selectedRows.has(actualIndex) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                    >
                                        {selectable && (
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.has(actualIndex)}
                                                    onChange={() => handleRowSelect(actualIndex)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                        )}
                                        {columns.map((column) => (
                                            <td
                                                key={column.accessor}
                                                className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                                            >
                                                {column.render
                                                    ? column.render(row[column.accessor], row)
                                                    : row[column.accessor]}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {(currentPage - 1) * pageSize + 1} to{' '}
                        {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1 rounded-lg transition-colors ${currentPage === pageNum
                                            ? 'bg-blue-600 text-white'
                                            : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
