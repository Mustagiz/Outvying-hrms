import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Modal, Input, Select, Alert } from '../components/UI';
import { Calendar, Clock, UserPlus, Trash2 } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const Roster = () => {
    const { currentUser, rosters, allUsers, assignRoster, deleteRoster } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState(null);
    const [formData, setFormData] = useState({
        employeeId: '',
        date: '',
        shiftName: 'Morning Shift',
        startTime: '09:00',
        endTime: '18:00',
        gracePeriod: 15
    });

    const shifts = [
        { name: 'Morning Shift', startTime: '09:00', endTime: '18:00' },
        { name: 'Evening Shift', startTime: '14:00', endTime: '23:00' },
        { name: 'Night Shift', startTime: '22:00', endTime: '07:00' },
        { name: 'Late Shift', startTime: '11:00', endTime: '20:00' }
    ];

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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.employeeId || !formData.date) {
            setAlert({ type: 'error', message: 'Please select employee and date' });
            return;
        }

        const employee = allUsers.find(u => u.id === parseInt(formData.employeeId));
        const result = assignRoster({
            ...formData,
            employeeId: parseInt(formData.employeeId),
            employeeName: employee?.name || 'Unknown'
        });

        setAlert({ type: result.success ? 'success' : 'error', message: result.message });
        if (result.success) {
            setShowModal(false);
            setFormData({
                employeeId: '',
                date: '',
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

    const columns = [
        { header: 'Date', accessor: 'date', render: (row) => formatDate(row.date) },
        ...(currentUser.role !== 'employee' ? [{ header: 'Employee', accessor: 'employeeName' }] : []),
        { header: 'Shift', accessor: 'shiftName' },
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Roster Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage and view employee shift assignments</p>
                </div>
                {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
                    <Button onClick={() => setShowModal(true)}>
                        <UserPlus size={18} className="mr-2" />
                        Assign Shift
                    </Button>
                )}
            </div>

            {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

            <Card title={currentUser.role === 'employee' ? 'My Assigned Shifts' : 'All Roster Assignments'}>
                <Table columns={columns} data={sortedRosters} />
            </Card>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Assign Roster">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Employee"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        options={[
                            { value: '', label: 'Select Employee' },
                            ...allUsers.filter(u => u.role === 'employee').map(u => ({ value: u.id, label: u.name }))
                        ]}
                        required
                    />

                    <Input
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />

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
