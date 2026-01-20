import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Modal, Input, Select, Alert, Badge, Pagination } from '../components/UI';
// import { leaveTypes } from '../data/mockData';
import { formatDate, getStatusColor } from '../utils/helpers';
import { User, CheckCircle, XCircle } from 'lucide-react';

const LeaveManagement = () => {
  const { currentUser, leaves, leaveBalances, applyLeave, updateLeaveStatus, allLeaveTypes, attendance } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);

  // Calculate working days to check eligibility (15 days requirement for PL/CL)
  const workingDaysCount = useMemo(() => {
    return attendance.filter(a =>
      (String(a.employeeId) === String(currentUser.id) || String(a.employeeId) === String(currentUser.uid)) &&
      ['Present', 'Late', 'Half Day'].includes(a.status)
    ).length;
  }, [attendance, currentUser]);

  const isEligibleForPaidLeaves = workingDaysCount >= 15;

  // Filter Leave Types + Always Include LWP
  const filteredLeaveTypes = useMemo(() => {
    let types = allLeaveTypes.filter(type => {
      const name = type.name.toLowerCase();
      const isPL = name.includes('paid') || name.includes('pl');
      const isCL = name.includes('casual') || name.includes('cl');
      const isLWP = name.includes('lwp') || name.includes('without pay');

      if (isPL) {
        return isEligibleForPaidLeaves && (myLeaveBalance?.paidLeave?.available > 0);
      }
      if (isCL) {
        return isEligibleForPaidLeaves && (myLeaveBalance?.casualLeave?.available > 0);
      }
      if (isLWP) return true;
      return true; // Other types (like Sick Leave) are generally available
    });

    // Ensure LWP is there even if not in DB
    const hasLWP = types.some(t => t.name.toLowerCase().includes('lwp') || t.name.toLowerCase().includes('without pay'));
    if (!hasLWP) {
      types = [{ id: 'lwp-default', name: 'Leave Without Pay (LWP)' }, ...types];
    }

    return types;
  }, [allLeaveTypes, isEligibleForPaidLeaves, myLeaveBalance]);

  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    days: 1
  });

  // Default leave type when types load or modal opens
  useEffect(() => {
    if (filteredLeaveTypes.length > 0 && (!formData.leaveType || !filteredLeaveTypes.find(t => t.name === formData.leaveType))) {
      setFormData(prev => ({ ...prev, leaveType: filteredLeaveTypes[0].name }));
    }
  }, [filteredLeaveTypes]);

  // Tab State
  const [activeTab, setActiveTab] = useState('myLeaves'); // 'myLeaves' | 'allApplications'
  const [adminSubTab, setAdminSubTab] = useState('pending'); // 'pending' | 'history'

  const myLeaveBalance = leaveBalances.find(lb => lb.employeeId === currentUser.id);

  const myLeaves = useMemo(() => {
    return leaves
      .filter(l => l.employeeId === currentUser.id)
      .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  }, [leaves, currentUser]);

  // Admin: All Applications Logic
  const allApplications = useMemo(() => {
    let filtered = leaves;
    if (adminSubTab === 'pending') {
      filtered = filtered.filter(l => l.status === 'Pending');
    } else {
      filtered = filtered.filter(l => l.status !== 'Pending');
    }
    return filtered.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  }, [leaves, adminSubTab]);

  const [currentPage, setCurrentPage] = useState(1);
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const paginatedLeaves = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return myLeaves.slice(startIndex, startIndex + itemsPerPage);
  }, [myLeaves, currentPage]);

  const paginatedAdminLeaves = useMemo(() => {
    const startIndex = (adminCurrentPage - 1) * itemsPerPage;
    return allApplications.slice(startIndex, startIndex + itemsPerPage);
  }, [allApplications, adminCurrentPage]);

  const totalPages = Math.ceil(myLeaves.length / itemsPerPage);
  const totalAdminPages = Math.ceil(allApplications.length / itemsPerPage);

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
      setFormData({
        leaveType: allLeaveTypes[0]?.name || '',
        startDate: '',
        endDate: '',
        reason: '',
        days: 1
      });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleApproval = (leaveId, status) => {
    const result = updateLeaveStatus(leaveId, status, currentUser.name);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const columns = [
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
    }
  ];

  const adminColumns = [
    {
      header: 'Employee', accessor: 'employeeName', render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
            <User size={14} />
          </div>
          <span className="font-medium">{row.employeeName}</span>
        </div>
      )
    },
    { header: 'Leave Type', accessor: 'leaveType' },
    { header: 'Start Date', accessor: 'startDate', render: (row) => formatDate(row.startDate) },
    { header: 'End Date', accessor: 'endDate', render: (row) => formatDate(row.endDate) },
    { header: 'Days', accessor: 'days' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'Pending' ? (
            <>
              <button
                onClick={() => handleApproval(row.id, 'Approved')}
                className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors"
                title="Approve"
              >
                <CheckCircle size={18} />
              </button>
              <button
                onClick={() => handleApproval(row.id, 'Rejected')}
                className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                title="Reject"
              >
                <XCircle size={18} />
              </button>
            </>
          ) : (
            // Allow modification of history
            <div className="flex gap-2">
              {row.status !== 'Approved' && (
                <button
                  onClick={() => handleApproval(row.id, 'Approved')}
                  className="text-gray-400 hover:text-green-600 transition-colors"
                  title="Change to Approved"
                >
                  <CheckCircle size={18} />
                </button>
              )}
              {row.status !== 'Rejected' && (
                <button
                  onClick={() => handleApproval(row.id, 'Rejected')}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Change to Rejected"
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Leave Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and track leave requests</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Apply Leave</Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Admin Tabs */}
      {currentUser.role !== 'employee' && (
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('myLeaves')}
            className={`pb-2 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'myLeaves'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            My Leaves
          </button>
          <button
            onClick={() => setActiveTab('allApplications')}
            className={`pb-2 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'allApplications'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            All Applications
          </button>
        </div>
      )}

      {/* Leave Balance Cards (Always Visible) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {myLeaveBalance && (
          <>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <div className="text-blue-800">
                <p className="text-sm font-medium opacity-80">Paid Leave (PL)</p>
                <div className="flex justify-between items-end mt-2">
                  <h3 className="text-2xl font-bold">{myLeaveBalance.paidLeave.available}</h3>
                  <span className="text-xs bg-blue-200 px-2 py-1 rounded">
                    Used: {myLeaveBalance.paidLeave.used}
                  </span>
                </div>
                <p className="text-xs mt-1 opacity-70">Accrues 1.5 per 15 days</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <div className="text-green-800">
                <p className="text-sm font-medium opacity-80">Casual Leave (CL)</p>
                <div className="flex justify-between items-end mt-2">
                  <h3 className="text-2xl font-bold">{myLeaveBalance.casualLeave.available}</h3>
                  <span className="text-xs bg-green-200 px-2 py-1 rounded">
                    Used: {myLeaveBalance.casualLeave.used}
                  </span>
                </div>
                <p className="text-xs mt-1 opacity-70">Fixed 6/Year</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <div className="text-orange-800">
                <p className="text-sm font-medium opacity-80">Leave Without Pay (LWP)</p>
                <div className="flex justify-between items-end mt-2">
                  <h3 className="text-2xl font-bold">{myLeaveBalance.lwp.used}</h3>
                  <span className="text-xs bg-orange-200 px-2 py-1 rounded">
                    Total Taken
                  </span>
                </div>
                <p className="text-xs mt-1 opacity-70">Auto-marked if absent</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <div className="text-purple-800">
                <p className="text-sm font-medium opacity-80">Unplanned Leave (UPL)</p>
                <div className="flex justify-between items-end mt-2">
                  <h3 className="text-2xl font-bold">{myLeaveBalance.upl.used}</h3>
                  <span className="text-xs bg-purple-200 px-2 py-1 rounded">
                    Total Taken
                  </span>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {activeTab === 'myLeaves' ? (
        <Card title="My Leave History">
          <Table columns={columns} data={paginatedLeaves} />
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">All Applications (Admin)</h3>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => { setAdminSubTab('pending'); setAdminCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${adminSubTab === 'pending'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Pending
              </button>
              <button
                onClick={() => { setAdminSubTab('history'); setAdminCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${adminSubTab === 'history'
                  ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                History
              </button>
            </div>
          </div>

          <Table columns={adminColumns} data={paginatedAdminLeaves} />

          {totalAdminPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={adminCurrentPage}
                totalPages={totalAdminPages}
                onPageChange={setAdminCurrentPage}
              />
            </div>
          )}
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Leave Type"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleInputChange}
            options={filteredLeaveTypes.map(type => ({ value: type.name, label: type.name }))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
            <Input
              label="End Date"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
            <span className="font-semibold text-gray-800 dark:text-white">{formData.days} Day(s)</span>
          </div>
          <Input
            label="Reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            placeholder="Reason for leave..."
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Apply</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveManagement;
