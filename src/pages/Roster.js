import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Modal, Input, Select, Alert } from '../components/UI';
import { Calendar as CalendarIcon, Clock, UserPlus, Trash2, ChevronLeft, ChevronRight, List, ChevronDown, User, Edit, Filter, X } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const DateRosterGroup = ({ date, rosters, columns }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all hover:shadow-lg">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                type="button"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-inner">
                        <CalendarIcon size={24} />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{formatDate(date)}</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest">Daily Shift Assignments</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Employee Count</span>
                        <span className="text-xl font-black text-primary-600 dark:text-primary-400">{rosters.length}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700"></div>
                    {isExpanded ? <ChevronDown size={24} className="text-gray-400" /> : <ChevronRight size={24} className="text-gray-400" />}
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Table
                        columns={columns.filter(col => col.accessor !== 'date')}
                        data={rosters}
                    />
                </div>
            )}
        </div>
    );
};

const Roster = () => {
    const { currentUser, rosters, allUsers, assignRoster, deleteRoster, updateRoster } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [view, setView] = useState('calendar'); // 'calendar' is now the default view for everyone
    const [currentDate, setCurrentDate] = useState(new Date());
    const [alert, setAlert] = useState(null);

    // Day Details Modal State
    const [showDayModal, setShowDayModal] = useState(false);
    const [selectedDayRosters, setSelectedDayRosters] = useState([]);
    const [selectedDayDate, setSelectedDayDate] = useState(null);

    // Edit State
    const [editingRosterId, setEditingRosterId] = useState(null);

    // Bulk Selection State
    const [selectedRosters, setSelectedRosters] = useState([]);
    const [showBulkModifyModal, setShowBulkModifyModal] = useState(false);
    const [bulkModifyData, setBulkModifyData] = useState({
        shiftName: '',
        startTime: '',
        endTime: '',
        gracePeriod: ''
    });

    // Filter State
    const [filters, setFilters] = useState({
        employees: [],
        dateFrom: '',
        dateTo: '',
        shiftType: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [formData, setFormData] = useState({
        selectedEmployees: [],
        startDate: '',
        endDate: '',
        shiftName: 'Morning Shift',
        startTime: '09:00',
        endTime: '18:00',
        gracePeriod: 15
    });

    const shifts = [
        { name: 'Morning Shift', startTime: '09:00', endTime: '18:00', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        { name: 'Evening Shift', startTime: '14:00', endTime: '23:00', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        { name: 'Night Shift', startTime: '22:00', endTime: '07:00', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        { name: 'Late Shift', startTime: '11:00', endTime: '20:00', color: 'bg-orange-100 text-orange-800 border-orange-200' }
    ];

    const getShiftColor = (name) => {
        return shifts.find(s => s.name === name)?.color || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const filteredRosters = useMemo(() => {
        let filtered = rosters;

        // Role-based filtering
        if (currentUser.role === 'employee') {
            filtered = filtered.filter(r => r.employeeId === currentUser.id);
        }

        // Apply admin filters
        if (currentUser.role !== 'employee') {
            // Employee filter (Multi-select)
            if (filters.employees.length > 0) {
                filtered = filtered.filter(r => filters.employees.includes(r.employeeId));
            }

            // Date range filter
            if (filters.dateFrom) {
                filtered = filtered.filter(r => r.date >= filters.dateFrom);
            }
            if (filters.dateTo) {
                filtered = filtered.filter(r => r.date <= filters.dateTo);
            }

            // Shift type filter
            if (filters.shiftType) {
                filtered = filtered.filter(r => r.shiftName === filters.shiftType);
            }
        }

        return filtered;
    }, [rosters, currentUser, filters]);

    const sortedRosters = useMemo(() => {
        return [...filteredRosters].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [filteredRosters]);

    // Pagination calculation
    const paginatedRosters = useMemo(() => {
        const totalPages = Math.ceil(sortedRosters.length / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return {
            data: sortedRosters.slice(startIndex, endIndex),
            totalPages,
            totalItems: sortedRosters.length
        };
    }, [sortedRosters, currentPage, itemsPerPage]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handleShiftChange = (e) => {
        const shift = shifts.find(s => s.name === e.target.value);
        if (shift) {
            setFormData({
                ...formData,
                shiftName: shift.name,
                startTime: shift.startTime,
                endTime: shift.endTime
            });
        }
    };

    const handleEmployeeToggle = (employeeId) => {
        setFormData(prev => {
            const currentSelected = prev.selectedEmployees;
            if (currentSelected.includes(employeeId)) {
                return { ...prev, selectedEmployees: currentSelected.filter(id => id !== employeeId) };
            } else {
                return { ...prev, selectedEmployees: [...currentSelected, employeeId] };
            }
        });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allEmployeeIds = allUsers.filter(u => u.role === 'employee').map(u => u.id);
            setFormData(prev => ({ ...prev, selectedEmployees: allEmployeeIds }));
        } else {
            setFormData(prev => ({ ...prev, selectedEmployees: [] }));
        }
    };

    const handleEdit = (roster) => {
        setEditingRosterId(roster.id);
        setFormData({
            selectedEmployees: [roster.employeeId], // Kept for consistency, though hidden
            startDate: roster.date,
            endDate: roster.date,
            shiftName: roster.shiftName,
            startTime: roster.startTime,
            endTime: roster.endTime,
            gracePeriod: roster.gracePeriod
        });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingRosterId(null);
        setFormData({
            selectedEmployees: [],
            startDate: '',
            endDate: '',
            shiftName: 'Morning Shift',
            startTime: '09:00',
            endTime: '18:00',
            gracePeriod: 15
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingRosterId) {
                const result = await updateRoster(editingRosterId, {
                    shiftName: formData.shiftName,
                    startTime: formData.startTime,
                    endTime: formData.endTime,
                    gracePeriod: formData.gracePeriod,
                });
                setAlert({ type: result.success ? 'success' : 'error', message: result.message });
                if (result.success) {
                    handleCloseModal();
                }
            } else {
                if (formData.selectedEmployees.length === 0 || !formData.startDate) {
                    setAlert({ type: 'error', message: 'Please select at least one employee and start date' });
                    return;
                }

                const result = await assignRoster({
                    ...formData,
                    employeeIds: formData.selectedEmployees
                });

                setAlert({ type: result.success ? 'success' : 'error', message: result.message });
                if (result.success) {
                    handleCloseModal();
                }
            }
        } catch (error) {
            console.error("Roster Action Error:", error);
            setAlert({ type: 'error', message: 'An unexpected error occurred' });
        }
        setTimeout(() => setAlert(null), 3000);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this roster assignment?')) {
            const result = await deleteRoster(id);
            setAlert({ type: result.success ? 'success' : 'error', message: result.message });
            setTimeout(() => setAlert(null), 3000);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRosters.length === 0) {
            setAlert({ type: 'error', message: 'Please select at least one roster to delete' });
            setTimeout(() => setAlert(null), 3000);
            return;
        }
        if (window.confirm(`Are you sure you want to delete ${selectedRosters.length} roster assignment(s)?`)) {
            let successCount = 0;
            for (const id of selectedRosters) {
                const result = await deleteRoster(id);
                if (result.success) successCount++;
            }
            setAlert({ type: 'success', message: `${successCount} roster(s) deleted successfully` });
            setSelectedRosters([]);
            setTimeout(() => setAlert(null), 3000);
        }
    };

    const handleDeleteFiltered = async () => {
        if (sortedRosters.length === 0) {
            setAlert({ type: 'error', message: 'No rosters found to delete' });
            setTimeout(() => setAlert(null), 3000);
            return;
        }

        const count = sortedRosters.length;
        if (window.confirm(`CRITICAL ACTION: Are you sure you want to delete ALL ${count} filtered roster assignments? This cannot be undone.`)) {
            const idsToDelete = sortedRosters.map(r => r.id);
            let successCount = 0;

            for (const id of idsToDelete) {
                const result = await deleteRoster(id);
                if (result.success) successCount++;
            }

            setAlert({ type: 'success', message: `Successfully deleted ${successCount} filtered rosters.` });
            setSelectedRosters([]);
            setTimeout(() => setAlert(null), 3000);
        }
    };

    const handleBulkModify = async () => {
        if (selectedRosters.length === 0) {
            setAlert({ type: 'error', message: 'Please select at least one roster to modify' });
            setTimeout(() => setAlert(null), 3000);
            return;
        }
        setShowBulkModifyModal(true);
    };

    const handleBulkModifySubmit = async () => {
        const updates = {};
        if (bulkModifyData.shiftName) updates.shiftName = bulkModifyData.shiftName;
        if (bulkModifyData.startTime) updates.startTime = bulkModifyData.startTime;
        if (bulkModifyData.endTime) updates.endTime = bulkModifyData.endTime;
        if (bulkModifyData.gracePeriod) updates.gracePeriod = parseInt(bulkModifyData.gracePeriod);

        if (Object.keys(updates).length === 0) {
            setAlert({ type: 'error', message: 'Please fill at least one field to update' });
            setTimeout(() => setAlert(null), 3000);
            return;
        }

        let successCount = 0;
        for (const id of selectedRosters) {
            const result = await updateRoster(id, updates);
            if (result.success) successCount++;
        }
        setAlert({ type: 'success', message: `${successCount} roster(s) updated successfully` });
        setSelectedRosters([]);
        setShowBulkModifyModal(false);
        setBulkModifyData({ shiftName: '', startTime: '', endTime: '', gracePeriod: '' });
        setTimeout(() => setAlert(null), 3000);
    };

    const toggleSelectRoster = (id) => {
        setSelectedRosters(prev =>
            prev.includes(id) ? prev.filter(rosterId => rosterId !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const currentPageIds = paginatedRosters.data.map(r => r.id);
        const allCurrentPageSelected = currentPageIds.every(id => selectedRosters.includes(id));

        if (allCurrentPageSelected) {
            // Deselect all from current page
            setSelectedRosters(prev => prev.filter(id => !currentPageIds.includes(id)));
        } else {
            // Select all from current page
            setSelectedRosters(prev => [...new Set([...prev, ...currentPageIds])]);
        }
    };

    const resetFilters = () => {
        setFilters({
            employees: [],
            dateFrom: '',
            dateTo: '',
            shiftType: ''
        });
    };

    // Calendar Logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return {
            daysInMonth: lastDay.getDate(),
            startingDayOfWeek: firstDay.getDay(),
            year,
            month
        };
    };

    const navigateMonth = (direction) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const calendarData = useMemo(() => {
        const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
        const days = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            // Filter ALL rosters for this date, not just find the first one
            const dayRosters = filteredRosters.filter(r => r.date === dateStr);
            days.push({ day: d, rosters: dayRosters, dateStr });
        }

        return days;
    }, [currentDate, filteredRosters]);

    const handleDayClick = (dayData) => {
        if (dayData && dayData.rosters && dayData.rosters.length > 0) {
            setSelectedDayRosters(dayData.rosters);
            const dateObj = new Date(dayData.dateStr);
            setSelectedDayDate(dateObj.toDateString());
            setShowDayModal(true);
        }
    };

    const columns = [
        ...(currentUser.role !== 'employee' ? [{
            header: () => (
                <input
                    type="checkbox"
                    checked={paginatedRosters.data.length > 0 && paginatedRosters.data.every(r => selectedRosters.includes(r.id))}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                />
            ),
            render: (row) => (
                <input
                    type="checkbox"
                    checked={selectedRosters.includes(row.id)}
                    onChange={() => toggleSelectRoster(row.id)}
                    className="rounded border-gray-300"
                />
            )
        }] : []),
        { header: 'Date', accessor: 'date', render: (row) => formatDate(row.date) },
        ...(currentUser.role !== 'employee' ? [{
            header: 'Employee',
            accessor: 'employeeName',
            render: (row) => (
                <span className={`font-semibold ${filters.employees.includes(row.employeeId) ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40 px-2 py-1 rounded-md' : ''}`}>
                    {row.employeeName}
                </span>
            )
        }] : []),
        {
            header: 'Shift', accessor: 'shiftName', render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getShiftColor(row.shiftName)}`}>
                    {row.shiftName}
                </span>
            )
        },
        { header: 'Start Time', accessor: 'startTime' },
        { header: 'End Time', accessor: 'endTime' },
        { header: 'Grace Period', accessor: 'gracePeriod', render: (row) => `${row.gracePeriod} mins` },
        ...(currentUser.role !== 'employee' ? [{
            header: 'Actions',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-900" title="Edit Roster">
                        <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-900" title="Delete Roster">
                        <Trash2 size={18} />
                    </button>
                </div>
            )
        }] : [])
    ];

    const groupedByDate = useMemo(() => {
        if (currentUser.role === 'employee') return {};

        const groups = {};
        paginatedRosters.data.forEach(roster => {
            if (!groups[roster.date]) {
                groups[roster.date] = [];
            }
            groups[roster.date].push(roster);
        });
        return groups;
    }, [paginatedRosters.data, currentUser]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Roster Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage and view employee shift assignments</p>
                </div>
                <div className="flex items-center gap-3">
                    {currentUser.role === 'employee' && (
                        <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setView('list')}
                                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${view === 'list'
                                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <List size={16} /> List
                            </button>
                            <button
                                onClick={() => setView('calendar')}
                                className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${view === 'calendar'
                                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <CalendarIcon size={16} /> Calendar
                            </button>
                        </div>
                    )}
                    {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-500 dark:to-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-primary-500/25 dark:shadow-none hover:scale-105 hover:shadow-xl active:scale-95 transition-all duration-300 border border-white/10 group"
                        >
                            <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
                            <span className="uppercase tracking-wider text-sm">Assign Shift</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Panel - Only for Admin/HR */}
            {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        type="button"
                    >
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-primary-600 dark:text-primary-400" />
                            <h3 className="font-semibold text-gray-800 dark:text-white">Filters</h3>
                            {(filters.employees.length > 0 || filters.dateFrom || filters.dateTo || filters.shiftType) && (
                                <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                                    Active
                                </span>
                            )}
                        </div>
                        <ChevronDown
                            size={20}
                            className={`text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {showFilters && (
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Employee Filter (Bulk Selection) */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Select Employees
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const allEmpIds = allUsers.filter(u => u.role === 'employee').map(u => u.id);
                                                setFilters(prev => ({
                                                    ...prev,
                                                    employees: prev.employees.length === allEmpIds.length ? [] : allEmpIds
                                                }));
                                            }}
                                            className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                                        >
                                            {filters.employees.length === allUsers.filter(u => u.role === 'employee').length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-40 overflow-y-auto p-2 bg-white dark:bg-gray-700 custom-scrollbar">
                                        {allUsers.filter(u => u.role === 'employee')
                                            .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                                            .map(u => (
                                                <label
                                                    key={u.id}
                                                    className={`flex items-center space-x-3 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer transition-all border-b border-gray-100 dark:border-gray-600 last:border-0 ${filters.employees.includes(u.id)
                                                        ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800'
                                                        : ''
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                        checked={filters.employees.includes(u.id)}
                                                        onChange={() => {
                                                            setFilters(prev => ({
                                                                ...prev,
                                                                employees: prev.employees.includes(u.id)
                                                                    ? prev.employees.filter(id => id !== u.id)
                                                                    : [...prev.employees, u.id]
                                                            }));
                                                        }}
                                                    />
                                                    <span className={`text-sm truncate font-medium ${filters.employees.includes(u.id)
                                                        ? 'text-primary-700 dark:text-primary-300'
                                                        : 'text-gray-700 dark:text-gray-200'
                                                        }`}>
                                                        {u.name} <span className="text-[10px] opacity-60">({u.employeeId})</span>
                                                    </span>
                                                </label>
                                            ))}
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 px-1">
                                        {filters.employees.length} selected
                                    </p>
                                </div>

                                {/* Date From Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Date From
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Date To Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Date To
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                {/* Shift Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Shift Type
                                    </label>
                                    <select
                                        value={filters.shiftType}
                                        onChange={(e) => setFilters({ ...filters, shiftType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    >
                                        <option value="">All Shifts</option>
                                        {shifts.map(s => (
                                            <option key={s.name} value={s.name}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Filter Actions */}
                            <div className="flex flex-wrap items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="mr-auto text-sm text-gray-600 dark:text-gray-400">
                                    Showing {sortedRosters.length} roster{sortedRosters.length !== 1 ? 's' : ''}
                                </div>
                                <button
                                    onClick={resetFilters}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                                >
                                    <X size={16} />
                                    Reset Filters
                                </button>
                                {(filters.employees.length > 0 || filters.dateFrom || filters.dateTo || filters.shiftType) && sortedRosters.length > 0 && (
                                    <button
                                        onClick={handleDeleteFiltered}
                                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Delete All Filtered ({sortedRosters.length})
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Bulk Actions Bar - Only for Admin/HR when rosters are selected */}
            {(currentUser.role === 'admin' || currentUser.role === 'hr') && selectedRosters.length > 0 && (
                <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-sm">
                                {selectedRosters.length}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {selectedRosters.length} roster{selectedRosters.length !== 1 ? 's' : ''} selected
                            </span>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                onClick={handleBulkModify}
                                variant="secondary"
                                className="flex-1 sm:flex-none"
                            >
                                <Edit size={18} className="mr-2" />
                                Bulk Modify
                            </Button>
                            <Button
                                onClick={handleBulkDelete}
                                variant="danger"
                                className="flex-1 sm:flex-none"
                            >
                                <Trash2 size={18} className="mr-2" />
                                Bulk Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

            {view === 'list' ? (
                <>
                    {currentUser.role === 'employee' ? (
                        <Card title="My Assigned Shifts">
                            <Table columns={columns} data={paginatedRosters.data} />
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {/* Grouped by Date for logistical clarity */}
                            {Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a)).map(date => (
                                <DateRosterGroup
                                    key={date}
                                    date={date}
                                    rosters={groupedByDate[date]}
                                    columns={columns}
                                />
                            ))}
                            {Object.keys(groupedByDate).length === 0 && (
                                <p className="text-center text-gray-500 py-4">No rosters assigned yet.</p>
                            )}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {paginatedRosters.totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mt-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Showing <span className="font-semibold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, paginatedRosters.totalItems)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{paginatedRosters.totalItems}</span> entries
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <div className="flex items-center gap-1 flex-wrap justify-center">
                                    {(() => {
                                        const total = paginatedRosters.totalPages;
                                        const current = currentPage;
                                        const pages = [];

                                        if (total <= 5) {
                                            for (let i = 1; i <= total; i++) pages.push(i);
                                        } else {
                                            pages.push(1);
                                            if (current > 3) pages.push('...');

                                            let start = Math.max(2, current - 1);
                                            let end = Math.min(total - 1, current + 1);

                                            if (current <= 3) end = 4;
                                            if (current >= total - 2) start = total - 3;

                                            for (let i = Math.max(2, start); i <= Math.min(total - 1, end); i++) {
                                                if (!pages.includes(i)) pages.push(i);
                                            }

                                            if (current < total - 2) pages.push('...');
                                            if (total > 1 && !pages.includes(total)) pages.push(total);
                                        }

                                        return pages.map((page, i) => (
                                            page === '...' ? (
                                                <span key={`dots-${i}`} className="px-2 text-gray-400 font-bold">...</span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors shadow-sm ${currentPage === page
                                                        ? 'bg-primary-600 text-white shadow-primary-200 dark:shadow-none'
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        ));
                                    })()}
                                </div>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, paginatedRosters.totalPages))}
                                    disabled={currentPage === paginatedRosters.totalPages}
                                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </h2>
                            <div className="flex gap-1">
                                <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                                    <ChevronLeft size={18} />
                                </button>
                                <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                                    Today
                                </button>
                                <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Shift Legend */}
                        <div className="flex flex-wrap justify-center gap-3 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                            {shifts.map(shift => (
                                <div key={shift.name} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${shift.color.split(' ')[0]} border ${shift.color.split(' ')[2]}`}></div>
                                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tighter">{shift.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-3 text-center text-sm font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {calendarData.map((item, index) => (
                                <div
                                    key={index}
                                    className={`min-h-[120px] p-1 border-r border-b border-gray-100 dark:border-gray-700 last:border-r-0 transition-colors ${!item ? 'bg-gray-50/30 dark:bg-gray-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer'}`}
                                    onClick={() => handleDayClick(item)}
                                >
                                    {item && (
                                        <div className="h-full flex flex-col">
                                            <span className={`text-sm font-bold self-end mr-1 ${new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day).toDateString() === new Date().toDateString()
                                                ? 'bg-primary-600 text-white w-7 h-7 flex items-center justify-center rounded-full mb-1'
                                                : 'text-gray-700 dark:text-gray-300 mb-1'
                                                }`}>
                                                {item.day}
                                            </span>

                                            <div className="flex flex-col gap-1 mt-1">
                                                {item.rosters.slice(0, 3).map((roster, idx) => (
                                                    <div key={idx} className={`px-2 py-1 rounded text-[10px] truncate border-l-4 ${getShiftColor(roster.shiftName)} border-l-current shadow-sm ${filters.employees.includes(roster.employeeId) ? 'ring-2 ring-primary-400 dark:ring-primary-600 transform scale-[1.02] z-10' : ''}`}>
                                                        <span className="font-bold mr-1">
                                                            {currentUser.role !== 'employee' ? roster.employeeName?.split(' ')[0] : roster.shiftName}
                                                        </span>
                                                        <span className="opacity-80 hidden sm:inline font-medium">
                                                            {roster.startTime}
                                                        </span>
                                                    </div>
                                                ))}
                                                {item.rosters.length > 3 && (
                                                    <div className="text-[10px] text-center text-gray-500 font-medium bg-gray-100 dark:bg-gray-700 rounded py-0.5">
                                                        +{item.rosters.length - 3} More
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Modal isOpen={showModal} onClose={handleCloseModal} title={editingRosterId ? "Edit Roster" : "Assign Roster"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingRosterId && (
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Select Employees
                                </label>
                                <label className="flex items-center space-x-2 text-sm text-primary-600 cursor-pointer hover:text-primary-700">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        onChange={handleSelectAll}
                                        checked={allUsers.filter(u => u.role === 'employee').length > 0 && formData.selectedEmployees.length === allUsers.filter(u => u.role === 'employee').length}
                                    />
                                    <span>Select All</span>
                                </label>
                            </div>
                            <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto p-2 bg-white dark:bg-gray-700">
                                {allUsers.filter(u => u.role === 'employee').map(u => (
                                    <label key={u.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-600 last:border-0">
                                        <input
                                            type="checkbox"
                                            checked={formData.selectedEmployees.includes(u.id)}
                                            onChange={() => handleEmployeeToggle(u.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">{u.name} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">({u.employeeId})</span></span>
                                    </label>
                                ))}
                                {allUsers.filter(u => u.role === 'employee').length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-2">No employees found</p>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                                {formData.selectedEmployees.length} selected
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                            disabled={!!editingRosterId} // Disable date editing for now
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            required
                            placeholder="Keep same for single day"
                            disabled={!!editingRosterId}
                        />
                    </div>

                    <Select
                        label="Shift Template"
                        value={formData.shiftName}
                        onChange={handleShiftChange}
                        options={shifts.map(s => ({ value: s.name, label: s.name }))}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Time"
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            required
                        />
                        <Input
                            label="End Time"
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        label="Grace Period (minutes)"
                        type="number"
                        value={formData.gracePeriod}
                        onChange={(e) => setFormData({ ...formData, gracePeriod: parseInt(e.target.value) })}
                        required
                    />

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit">{editingRosterId ? "Update Roster" : "Assign Roster"}</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal for viewing details of a specific day */}
            <Modal isOpen={showDayModal} onClose={() => setShowDayModal(false)} title={`Roster for ${selectedDayDate}`}>
                <div className="space-y-4">
                    <div className="max-h-[60vh] overflow-y-auto">
                        {selectedDayRosters.length > 0 ? (
                            <Table columns={columns} data={selectedDayRosters} />
                        ) : (
                            <p className="text-center text-gray-500 py-6">No shifts scheduled for this day.</p>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <Button variant="secondary" onClick={() => setShowDayModal(false)}>Close</Button>
                    </div>
                </div>
            </Modal>

            {/* Bulk Modify Modal */}
            <Modal isOpen={showBulkModifyModal} onClose={() => setShowBulkModifyModal(false)} title="Bulk Modify Rosters">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Modifying {selectedRosters.length} roster assignment(s). Leave fields empty to keep current values.
                    </p>
                    <Select
                        label="Shift Name (optional)"
                        value={bulkModifyData.shiftName}
                        onChange={(e) => setBulkModifyData({ ...bulkModifyData, shiftName: e.target.value })}
                        options={[
                            { value: '', label: 'Keep Current' },
                            ...shifts.map(s => ({ value: s.name, label: s.name }))
                        ]}
                    />
                    <Input
                        label="Start Time (optional)"
                        type="time"
                        value={bulkModifyData.startTime}
                        onChange={(e) => setBulkModifyData({ ...bulkModifyData, startTime: e.target.value })}
                    />
                    <Input
                        label="End Time (optional)"
                        type="time"
                        value={bulkModifyData.endTime}
                        onChange={(e) => setBulkModifyData({ ...bulkModifyData, endTime: e.target.value })}
                    />
                    <Input
                        label="Grace Period (minutes, optional)"
                        type="number"
                        value={bulkModifyData.gracePeriod}
                        onChange={(e) => setBulkModifyData({ ...bulkModifyData, gracePeriod: e.target.value })}
                    />
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="secondary" onClick={() => setShowBulkModifyModal(false)}>Cancel</Button>
                        <Button onClick={handleBulkModifySubmit}>
                            <Edit size={18} className="inline mr-2" />
                            Update {selectedRosters.length} Roster(s)
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Roster;
