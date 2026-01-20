import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Modal, Input, Select, Alert, Badge } from '../components/UI';
import { leaveTypes } from '../data/mockData';
import { formatDate, getStatusColor } from '../utils/helpers';

const LeaveManagement = () => {
  const { currentUser, leaves, leaveBalances, applyLeave, updateLeaveStatus, allUsers } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [leaveTypesList, setLeaveTypesList] = useState(() => {
    const saved = localStorage.getItem('leaveTypes');
    return saved ? JSON.parse(saved) : leaveTypes;
  });
  const [formData, setFormData] = useState({
    leaveType: leaveTypes[0]?.name || 'Paid Leave',
    startDate: '',
    endDate: '',
    reason: '',
    days: 1
  });

  const myLeaveBalance = leaveBalances.find(lb => lb.employeeId === currentUser.id);

  const myLeaves = useMemo(() => {
    return leaves
      .filter(l => currentUser.role === 'employee' ? l.employeeId === currentUser.id : true)
      .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  }, [leaves, currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'startDate' || name === 'endDate') {
        if (updated.startDate && updated.endDate) {
          const start = new Date(updated.startDate);
          const end = new Date(updated.endDate);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
          updated.days = days > 0 ? days : 1;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await applyLeave(formData);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    if (result.success) {
      setShowModal(false);
      setFormData({ leaveType: 'Paid Leave', startDate: '', endDate: '', reason: '', days: 1 });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleApproval = (leaveId, status) => {
    const result = updateLeaveStatus(leaveId, status, currentUser.name);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const columns = [
    ...(currentUser.role !== 'employee' ? [{
      header: 'Employee',
      accessor: 'employeeName'
    }] : []),
    { header: 'Leave Type', accessor: 'leaveType' },
    { header: 'Start Date', accessor: 'startDate', render: (row) => formatDate(row.startDate) },
    { header: 'End Date', accessor: 'endDate', render: (row) => formatDate(row.endDate) },
    { header: 'Days', accessor: 'days' },
    { header: 'Applied Date', accessor: 'appliedDate', render: (row) => formatDate(row.appliedDate) },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    ...(currentUser.role !== 'employee' ? [{
      header: 'Actions',
      render: (row) => row.status === 'Pending' ? (
        <div className="flex space-x-2">
          <Button onClick={() => handleApproval(row.id, 'Approved')} variant="success" className="text-xs py-1 px-2">
            Approve
          </Button>
          <Button onClick={() => handleApproval(row.id, 'Rejected')} variant="danger" className="text-xs py-1 px-2">
            Reject
          </Button>
        </div>
      ) : (
        <span className="text-xs text-gray-500">No action</span>
      )
    }] : [])
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Leave Management</h1>
        {currentUser.role === 'employee' && (
          <Button onClick={() => setShowModal(true)}>Apply for Leave</Button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {currentUser.role === 'employee' && myLeaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Paid Leave</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{myLeaveBalance.paidLeave?.available ?? 0}</p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">{myLeaveBalance.paidLeave?.used ?? 0} used</p>
                <p className="text-xs text-gray-500">of {myLeaveBalance.paidLeave?.total ?? 12}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Casual Leave</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{myLeaveBalance.casualLeave?.available ?? 0}</p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">{myLeaveBalance.casualLeave?.used ?? 0} used</p>
                <p className="text-xs text-gray-500">of {myLeaveBalance.casualLeave?.total ?? 6}</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Leave Without Pay (LWP)</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-red-600">{myLeaveBalance.lwp?.used ?? 0}</p>
                <p className="text-xs text-gray-500">Days Taken</p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Unplanned Leave (UPL)</h3>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{myLeaveBalance.upl?.used ?? 0}</p>
                <p className="text-xs text-gray-500">Days Taken</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card title={currentUser.role === 'employee' ? 'My Leave History' : 'Leave Requests'}>
        <Table columns={columns} data={myLeaves} />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit}>
          <Select
            label="Leave Type"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleInputChange}
            options={leaveTypesList.map(lt => ({ value: lt.name, label: lt.name }))}
          />

          <Input
            label="Start Date"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            required
          />

          <Input
            label="End Date"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            required
          />

          <Input
            label="Number of Days"
            type="number"
            name="days"
            value={formData.days}
            readOnly
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit Application</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveManagement;
