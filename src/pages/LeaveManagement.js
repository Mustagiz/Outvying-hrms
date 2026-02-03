import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Modal, Input, Select, Alert, Badge, Pagination } from '../components/UI';
// import { leaveTypes } from '../data/mockData';
import { User, CheckCircle, XCircle, Search, TrendingUp, BarChart3, Download } from 'lucide-react';
import { formatDate, getStatusColor, exportToCSV } from '../utils/helpers';
import LeavePolicy from './LeavePolicy';

import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);


// Helper: Calculate business days (excluding Sat/Sun)
const calculateBusinessDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return 0;
  }

  let count = 0;
  const curDate = new Date(start);
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // Exclude Sun(0) and Sat(6)
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

const LeaveManagement = () => {
  const { currentUser, leaves, leaveBalances, applyLeave, updateLeaveStatus, allLeaveTypes, attendance, allocateLeave, allUsers, createNotification } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocationData, setAllocationData] = useState({
    employeeId: '',
    type: 'Paid Leave',
    amount: '',
    reason: ''
  });
  const [alert, setAlert] = useState(null);

  // Define myLeaveBalance early to avoid ReferenceError
  const myLeaveBalance = useMemo(() => {
    return leaveBalances.find(lb =>
      String(lb.employeeId) === String(currentUser.id) ||
      String(lb.employeeId) === String(currentUser.uid)
    );
  }, [leaveBalances, currentUser]);

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
  const [activeTab, setActiveTab] = useState('myLeaves'); // 'myLeaves' | 'allApplications' | 'manageBalances' | 'policy'
  const [adminSubTab, setAdminSubTab] = useState('pending'); // 'pending' | 'history'



  const myLeaves = useMemo(() => {
    return leaves
      .filter(l => String(l.employeeId) === String(currentUser.id) || String(l.employeeId) === String(currentUser.uid))
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

    // Manager Filter: Only show leaves from direct reports
    if (currentUser.role === 'manager') {
      const myTeamIds = allUsers.filter(u => u.reportingTo === currentUser.name && !u.isDeleted).map(u => u.id); // Assuming ID match
      // Fallback to name match if IDs don't align, but safe to assume we filter by employeeId if we had it.
      // Since leaves store employeeId, let's match that.
      const team = allUsers.filter(u => u.reportingTo === currentUser.name && !u.isDeleted);
      const teamIds = new Set(team.map(t => String(t.id)).concat(team.map(t => String(t.uid))));

      filtered = filtered.filter(l => teamIds.has(String(l.employeeId)));
    }

    return filtered.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  }, [leaves, adminSubTab]);

  const [currentPage, setCurrentPage] = useState(1);
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const [balanceCurrentPage, setBalanceCurrentPage] = useState(1);
  const [balanceSearchTerm, setBalanceSearchTerm] = useState('');
  const itemsPerPage = 10;

  const paginatedLeaves = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return myLeaves.slice(startIndex, startIndex + itemsPerPage);
  }, [myLeaves, currentPage]);

  const paginatedAdminLeaves = useMemo(() => {
    const startIndex = (adminCurrentPage - 1) * itemsPerPage;
    return allApplications.slice(startIndex, startIndex + itemsPerPage);
  }, [allApplications, adminCurrentPage]);

  // Admin: Filtered and Sorted Balances
  const filteredBalances = useMemo(() => {
    let filtered = [...leaveBalances];

    if (balanceSearchTerm) {
      const term = balanceSearchTerm.toLowerCase();
      filtered = filtered.filter(lb => {
        const emp = allUsers.find(u => String(u.id) === String(lb.employeeId) || String(u.uid) === String(lb.employeeId));
        return (
          emp?.name?.toLowerCase().includes(term) ||
          emp?.employeeId?.toLowerCase().includes(term)
        );
      });
    }

    return filtered.sort((a, b) => {
      const userA = allUsers.find(u => String(u.id) === String(a.employeeId) || String(u.uid) === String(a.employeeId));
      const userB = allUsers.find(u => String(u.id) === String(b.employeeId) || String(u.uid) === String(b.employeeId));
      const nameA = userA?.name?.toLowerCase() || '';
      const nameB = userB?.name?.toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });
  }, [leaveBalances, allUsers, balanceSearchTerm]);

  const leaveHistoryTrendData = useMemo(() => {
    // Generate trend for the last 6 months
    const months = [];
    const labels = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${d.getMonth()}`);
      labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
    }

    const datasets = [
      {
        label: 'Leaves Taken',
        data: months.map(m => {
          return myLeaves.filter(l => {
            const lDate = new Date(l.startDate);
            return `${lDate.getFullYear()}-${lDate.getMonth()}` === m && l.status === 'Approved';
          }).reduce((sum, l) => sum + parseFloat(l.days), 0);
        }),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        tension: 0.4
      }
    ];

    return { labels, datasets };
  }, [myLeaves]);

  const paginatedBalances = useMemo(() => {

    const startIndex = (balanceCurrentPage - 1) * itemsPerPage;
    return filteredBalances.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBalances, balanceCurrentPage]);

  const totalPages = Math.ceil(myLeaves.length / itemsPerPage);
  const totalAdminPages = Math.ceil(allApplications.length / itemsPerPage);
  const totalBalancePages = Math.ceil(filteredBalances.length / itemsPerPage);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'startDate' || name === 'endDate') {
        if (updated.startDate && updated.endDate) {
          // Use the new business day calculator
          updated.days = calculateBusinessDays(updated.startDate, updated.endDate);
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
      // Create notification for admin/manager
      const manager = allUsers.find(u => u.role === 'admin' || u.role === 'hr');
      if (manager) {
        await createNotification({
          userId: manager.id,
          type: 'leave_request',
          title: 'New Leave Request',
          message: `${currentUser.name} requested ${formData.leaveType} from ${formData.startDate} to ${formData.endDate} (${formData.days} days)`,
          relatedId: result.leaveId,
          actionUrl: '/leave'
        });
      }

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

  const handleApproval = async (leaveId, status) => {
    const result = await updateLeaveStatus(leaveId, status, currentUser.name);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleAllocateLeave = async (e) => {
    e.preventDefault();
    if (!allocationData.employeeId || !allocationData.amount) {
      setAlert({ type: 'error', message: 'Please select an employee and enter an amount' });
      return;
    }
    const result = await allocateLeave(
      allocationData.employeeId,
      allocationData.type,
      allocationData.amount,
      allocationData.reason
    );
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    if (result.success) {
      setShowAllocateModal(false);
      setAllocationData({ employeeId: '', type: 'Paid Leave', amount: '', reason: '' });
    }
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

  const balanceColumns = [
    {
      header: 'Employee', render: (row) => {
        const emp = allUsers.find(u => String(u.id) === String(row.employeeId) || String(u.uid) === String(row.employeeId));
        return emp?.name || 'Unknown';
      }
    },
    { header: 'Paid Leave Available', render: (row) => row.paidLeave.available },
    { header: 'Casual Leave Available', render: (row) => row.casualLeave.available },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          onClick={() => {
            setAllocationData(prev => ({ ...prev, employeeId: row.employeeId }));
            setShowAllocateModal(true);
          }}
          className="text-xs py-1 px-2"
        >
          Allocate
        </Button>
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
          <button
            onClick={() => setActiveTab('manageBalances')}
            className={`pb-2 px-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'manageBalances'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Manage Balances
          </button>
        </div>
      )}

      {/* Leave Balance Cards (Always Visible) */}
      <LeaveBalanceSection balance={myLeaveBalance} />

      {activeTab === 'manageBalances' ? (
        <Card title="Manage Employee Leave Balances">
          <div className="mb-4 relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search employee by name or ID..."
              value={balanceSearchTerm}
              onChange={(e) => {
                setBalanceSearchTerm(e.target.value);
                setBalanceCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            />
          </div>
          <Table columns={balanceColumns} data={paginatedBalances} />
          {totalBalancePages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                currentPage={balanceCurrentPage}
                totalPages={totalBalancePages}
                onPageChange={setBalanceCurrentPage}
              />
            </div>
          )}
        </Card>
      ) : activeTab === 'policy' ? (
        <LeavePolicy />
      ) : activeTab === 'myLeaves' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2" title="Leave Usage Trend (6 Months)">
              <div className="h-[250px]">
                <Line
                  data={leaveHistoryTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                  }}
                />
              </div>
            </Card>
            <Card title="Quick Summary">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Leaves (Yearly)</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">
                    {myLeaves.filter(l => l.status === 'Approved' && new Date(l.startDate).getFullYear() === new Date().getFullYear()).reduce((sum, l) => sum + parseFloat(l.days), 0)} Days
                  </p>
                </div>
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                  <p className="text-xs font-bold text-primary-600 uppercase mb-1">Most Used Type</p>
                  <p className="text-xl font-black text-primary-900 dark:text-white">
                    {myLeaves.length > 0 ? [...new Set(myLeaves.map(l => l.leaveType))].sort((a, b) => myLeaves.filter(l => l.leaveType === b).length - myLeaves.filter(l => l.leaveType === a).length)[0] : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>
          </div>
          <Card title="My Leave History">
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => {
                  const csvData = myLeaves.map(l => ({
                    'Leave Type': l.leaveType,
                    'Start Date': formatDate(l.startDate),
                    'End Date': formatDate(l.endDate),
                    'Days': l.days,
                    'Applied Date': formatDate(l.appliedDate),
                    'Status': l.status,
                    'Reason': l.reason
                  }));
                  exportToCSV(csvData, 'my_leave_history');
                }}
                variant="secondary"
                className="flex items-center gap-2 text-xs"
              >
                <Download size={14} /> Export CSV
              </Button>
            </div>
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
        </div>
      ) : (

        <Card>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">All Applications (Admin)</h3>
              <Button
                onClick={() => {
                  const csvData = allApplications.map(l => ({
                    'Employee': l.employeeName,
                    'Leave Type': l.leaveType,
                    'Start Date': formatDate(l.startDate),
                    'End Date': formatDate(l.endDate),
                    'Days': l.days,
                    'Applied Date': formatDate(l.appliedDate),
                    'Status': l.status,
                    'Reason': l.reason
                  }));
                  exportToCSV(csvData, 'leave_applications_report');
                }}
                variant="secondary"
                className="flex items-center gap-2 text-xs py-1 h-8"
              >
                <Download size={14} /> Export CSV
              </Button>
            </div>

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

      <Modal isOpen={showAllocateModal} onClose={() => setShowAllocateModal(false)} title="Allocate Leave Manually">
        <form onSubmit={handleAllocateLeave} className="space-y-4">
          <Select
            label="Employee"
            value={allocationData.employeeId}
            onChange={(e) => setAllocationData(prev => ({ ...prev, employeeId: e.target.value }))}
            options={[...allUsers].filter(u => !u.isDeleted).sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(u => ({ value: String(u.uid || u.id), label: `${u.name} (${u.employeeId})` }))}
            required
          />
          <Select
            label="Leave Type"
            value={allocationData.type}
            onChange={(e) => setAllocationData(prev => ({ ...prev, type: e.target.value }))}
            options={[
              { value: 'Paid Leave', label: 'Paid Leave' },
              { value: 'Casual Leave', label: 'Casual Leave' }
            ]}
            required
          />
          <Input
            label="Amount (Days)"
            type="number"
            step="0.5"
            value={allocationData.amount}
            onChange={(e) => setAllocationData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="e.g. 1.0 or -1.0 to deduct"
            required
          />
          <Input
            label="Reason/Note"
            value={allocationData.reason}
            onChange={(e) => setAllocationData(prev => ({ ...prev, reason: e.target.value }))}
            placeholder="Reason for manual adjustment..."
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAllocateModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Allocate</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Sub-component for cleaner main render
const LeaveBalanceSection = ({ balance }) => {
  if (!balance) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="text-blue-800">
          <p className="text-sm font-medium opacity-80">Paid Leave (PL)</p>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-2xl font-bold">{balance.paidLeave.available}</h3>
            <span className="text-xs bg-blue-200 px-2 py-1 rounded">
              Used: {balance.paidLeave.used}
            </span>
          </div>
          <p className="text-xs mt-1 opacity-70">Accrues 1.0 per 15 days</p>
        </div>
      </Card>
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="text-green-800">
          <p className="text-sm font-medium opacity-80">Casual Leave (CL)</p>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-2xl font-bold">{balance.casualLeave.available}</h3>
            <span className="text-xs bg-green-200 px-2 py-1 rounded">
              Used: {balance.casualLeave.used}
            </span>
          </div>
          <p className="text-xs mt-1 opacity-70">Accrues 0.5 per 15 days</p>
        </div>
      </Card>
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <div className="text-orange-800">
          <p className="text-sm font-medium opacity-80">Leave Without Pay (LWP)</p>
          <div className="flex justify-between items-end mt-2">
            <h3 className="text-2xl font-bold">{balance.lwp.used}</h3>
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
            <h3 className="text-2xl font-bold">{balance.upl.used}</h3>
            <span className="text-xs bg-purple-200 px-2 py-1 rounded">
              Total Taken
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LeaveManagement;
