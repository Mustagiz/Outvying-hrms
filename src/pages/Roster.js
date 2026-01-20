import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Modal, Input, Select, Alert } from '../components/UI';
import { Calendar as CalendarIcon, Clock, UserPlus, Trash2, ChevronLeft, ChevronRight, List, ChevronDown, User, Edit } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const EmployeeRosterGroup = ({ employeeName, rosters, columns }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                type="button"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                        <User size={16} />
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{employeeName}</h3>
                </div>
                <div className="flex items-center gap-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        {rosters.length} Shifts
                    </span>
                    {isExpanded ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                    <Table columns={columns} data={rosters} />
                </div>
            )}
        </div>
    );
};

const Roster = () => {
    const { currentUser, rosters, allUsers, assignRoster, deleteRoster, updateRoster } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'calendar'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [alert, setAlert] = useState(null);

    // Day Details Modal State
    const [showDayModal, setShowDayModal] = useState(false);
    const [selectedDayRosters, setSelectedDayRosters] = useState([]);
    const [selectedDayDate, setSelectedDayDate] = useState(null);

    // Edit State
    const [editingRosterId, setEditingRosterId] = useState(null);

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
        if (currentUser.role === 'employee') {
            return rosters.filter(r => r.employeeId === currentUser.id);
        }
        return rosters;
    }, [rosters, currentUser]);

    const sortedRosters = useMemo(() => {
        return [...filteredRosters].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [filteredRosters]);

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
        { header: 'Date', accessor: 'date', render: (row) => formatDate(row.date) },
        ...(currentUser.role !== 'employee' ? [{ header: 'Employee', accessor: 'employeeName' }] : []),
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

    const groupedRosters = useMemo(() => {
        if (currentUser.role === 'employee') return {};

        const groups = {};
        sortedRosters.forEach(roster => {
            if (!groups[roster.employeeName]) {
                groups[roster.employeeName] = [];
            }
            groups[roster.employeeName].push(roster);
        });
        return groups;
    }, [sortedRosters, currentUser]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Roster Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage and view employee shift assignments</p>
                </div>
                <div className="flex items-center gap-3">
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
                    {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
                        <Button onClick={() => setShowModal(true)}>
                            <UserPlus size={18} className="mr-2" />
                            Assign Shift
                        </Button>
                    )}
                </div>
            </div>

            {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

            {view === 'list' ? (
                <>
                    {currentUser.role === 'employee' ? (
                        <Card title="My Assigned Shifts">
                            <Table columns={columns} data={sortedRosters} />
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {/* If grouped, we sort keys (names) for consistency */}
                            {Object.keys(groupedRosters).sort().map(employeeName => (
                                <EmployeeRosterGroup
                                    key={employeeName}
                                    employeeName={employeeName}
                                    rosters={groupedRosters[employeeName]}
                                    columns={columns}
                                />
                            ))}
                            {Object.keys(groupedRosters).length === 0 && (
                                <p className="text-center text-gray-500 py-4">No rosters assigned yet.</p>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                                <ChevronLeft size={20} />
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                                Today
                            </button>
                            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600">
                                <ChevronRight size={20} />
                            </button>
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
                                                    <div key={idx} className={`px-1.5 py-1 rounded text-[10px] truncate border-l-2 ${getShiftColor(roster.shiftName)} border-l-current bg-opacity-20`}>
                                                        <span className="font-semibold mr-1">
                                                            {currentUser.role !== 'employee' ? roster.employeeName?.split(' ')[0] : roster.shiftName}
                                                        </span>
                                                        <span className="opacity-75 hidden sm:inline">
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
        </div>
    );
};

export default Roster;
