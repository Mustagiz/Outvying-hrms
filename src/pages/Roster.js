import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Modal, Input, Select, Alert } from '../components/UI';
import { Calendar as CalendarIcon, Clock, UserPlus, Trash2, ChevronLeft, ChevronRight, List } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const Roster = () => {
    const { currentUser, rosters, allUsers, assignRoster, deleteRoster } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [view, setView] = useState('list'); // 'list' or 'calendar'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [alert, setAlert] = useState(null);
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

    const handleEmployeeToggle = (e) => {
        const options = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData({ ...formData, selectedEmployees: options });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.selectedEmployees.length === 0 || !formData.startDate) {
            setAlert({ type: 'error', message: 'Please select at least one employee and start date' });
            return;
        }

        const result = assignRoster({
            ...formData,
            employeeIds: formData.selectedEmployees
        });

        setAlert({ type: result.success ? 'success' : 'error', message: result.message });
        if (result.success) {
            setShowModal(false);
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
        setTimeout(() => setAlert(null), 3000);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this roster assignment?')) {
            const result = deleteRoster(id);
            setAlert({ type: 'success', message: result.message });
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
            const roster = filteredRosters.find(r => r.date === dateStr);
            days.push({ day: d, roster });
        }

        return days;
    }, [currentDate, filteredRosters]);

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
                <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={18} />
                </button>
            )
        }] : [])
    ];

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
                <Card title={currentUser.role === 'employee' ? 'My Assigned Shifts' : 'All Roster Assignments'}>
                    <Table columns={columns} data={sortedRosters} />
                </Card>
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
                                <div key={index} className={`min-h-[120px] p-2 border-r border-b border-gray-100 dark:border-gray-700 last:border-r-0 ${!item ? 'bg-gray-50/30 dark:bg-gray-900/10' : ''}`}>
                                    {item && (
                                        <div className="h-full flex flex-col">
                                            <span className={`text-sm font-bold ${new Date(currentDate.getFullYear(), currentDate.getMonth(), item.day).toDateString() === new Date().toDateString()
                                                ? 'bg-primary-600 text-white w-7 h-7 flex items-center justify-center rounded-full mb-1'
                                                : 'text-gray-700 dark:text-gray-300 mb-1'
                                                }`}>
                                                {item.day}
                                            </span>
                                            {item.roster && (
                                                <div className={`p-1.5 rounded-lg border text-[10px] leading-tight flex flex-col gap-1 shadow-sm ${getShiftColor(item.roster.shiftName)}`}>
                                                    <p className="font-bold truncate">{item.roster.shiftName}</p>
                                                    <div className="flex items-center gap-1 opacity-90">
                                                        <Clock size={10} />
                                                        <span>{item.roster.startTime} - {item.roster.endTime}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 w-full mb-1">Shift Legend:</p>
                        {shifts.map(s => (
                            <div key={s.name} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${s.color.split(' ')[0]}`}></div>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Assign Roster">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Select Employees (Hold Ctrl to select multiple)
                        </label>
                        <select
                            multiple
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                            value={formData.selectedEmployees}
                            onChange={handleEmployeeToggle}
                            size="5"
                            required
                        >
                            {allUsers.filter(u => u.role === 'employee').map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.employeeId})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Start Date"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            required
                            placeholder="Keep same for single day"
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
                        <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Assign Roster</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Roster;
