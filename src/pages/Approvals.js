import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Table, Button, Badge, Pagination, Modal } from '../components/UI';
import { formatDate, getStatusColor } from '../utils/helpers';
import { CheckCircle, XCircle, Users, AlertTriangle } from 'lucide-react';
import LeaveCalendar from '../components/LeaveCalendar';

const Approvals = () => {
  const { leaves, updateLeaveStatus, currentUser, allUsers } = useAuth();
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const itemsPerPage = 10;

  const displayedApprovals = useMemo(() => {
    let filtered = leaves;

    // Employee View: Show only their own leaves
    if (currentUser.role === 'Employee' || currentUser.role === 'employee') {
      filtered = leaves.filter(l => l.employeeId === currentUser.id);
      // For employees, maybe we just show everything mixed or filter by status too? 
      // Usually employees want to see everything. Keeping existing logic derived from original code:
      // Original code filtered by user ID for Employee, and by 'Pending' for Admin. 
      // We will respect tabs for Admin, but maybe just show all for Employee? 
      // Let's implement tabs for everyone for consistency, or just Admin.
      // Request was "in admin Pending Approvals...".
      // Let's stick to Admin having tabs.
    } else {
      // Admin/HR View
      if (activeTab === 'pending') {
        filtered = leaves.filter(l => l.status === 'Pending');
      } else {
        filtered = leaves.filter(l => l.status !== 'Pending');
      }
    }

    return filtered.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
  }, [leaves, currentUser, activeTab]);

  const paginatedApprovals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return displayedApprovals.slice(startIndex, startIndex + itemsPerPage);
  }, [displayedApprovals, currentPage]);

  const totalPages = Math.ceil(displayedApprovals.length / itemsPerPage);

  const calculateLeaveImpact = (leave) => {
    if (!leave) return null;
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);
    const dateRange = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d).toISOString().split('T')[0]);
    }
    const employee = allUsers.find(u => u.id === leave.employeeId);
    const teamMembers = allUsers.filter(u => u.department === employee?.department);
    const totalTeam = teamMembers.length;
    const impactByDate = dateRange.map(date => {
      const onLeave = leaves.filter(l => {
        if (l.status !== 'Approved' && l.id !== leave.id) return false;
        const lStart = new Date(l.startDate);
        const lEnd = new Date(l.endDate);
        const checkDate = new Date(date);
        return checkDate >= lStart && checkDate <= lEnd && teamMembers.some(tm => tm.id === l.employeeId);
      });
      const leaveCount = onLeave.length + 1;
      const percentage = ((leaveCount / totalTeam) * 100).toFixed(1);
      const status = percentage >= 20 ? 'critical' : percentage >= 10 ? 'warning' : 'normal';
      return { date, leaveCount, percentage, status, employees: [...onLeave.map(l => l.employeeName), leave.employeeName] };
    });
    const maxImpact = Math.max(...impactByDate.map(d => parseFloat(d.percentage)));
    const avgImpact = (impactByDate.reduce((sum, d) => sum + parseFloat(d.percentage), 0) / impactByDate.length).toFixed(1);
    return { totalTeam, dateRange: impactByDate, maxImpact, avgImpact, department: employee?.department };
  };

  const showImpactAnalysis = (leave) => {
    setSelectedLeave(leave);
    setShowImpactModal(true);
  };

  const handleApproval = (leaveId, status) => {
    updateLeaveStatus(leaveId, status, currentUser.name);
    setShowImpactModal(false);
  };

  const handleBulkApproval = (status) => {
    selectedItems.forEach(id => {
      updateLeaveStatus(id, status, currentUser.name);
    });
    setSelectedItems([]);
  };

  const toggleSelection = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          checked={selectedItems.length === paginatedApprovals.length && paginatedApprovals.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedItems(paginatedApprovals.map(l => l.id));
            } else {
              setSelectedItems([]);
            }
          }}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedItems.includes(row.id)}
          onChange={() => toggleSelection(row.id)}
        />
      )
    },
    { header: 'Employee', accessor: 'employeeName' },
    { header: 'Leave Type', accessor: 'leaveType' },
    { header: 'Start Date', accessor: 'startDate', render: (row) => formatDate(row.startDate) },
    { header: 'End Date', accessor: 'endDate', render: (row) => formatDate(row.endDate) },
    { header: 'Days', accessor: 'days' },
    { header: 'Applied Date', accessor: 'appliedDate', render: (row) => formatDate(row.appliedDate) },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button onClick={() => showImpactAnalysis(row)} variant="secondary" className="text-xs py-1 px-2">
            <Users size={14} className="inline mr-1" />Analyze
          </Button>
          {(activeTab === 'pending' || activeTab === 'history') && (
            <>
              {row.status !== 'Approved' && (
                <Button onClick={() => handleApproval(row.id, 'Approved')} variant="success" className="text-xs py-1 px-2">
                  <CheckCircle size={14} className="inline mr-1" />Approve
                </Button>
              )}
              {row.status !== 'Rejected' && (
                <Button onClick={() => handleApproval(row.id, 'Rejected')} variant="danger" className="text-xs py-1 px-2">
                  <XCircle size={14} className="inline mr-1" />Reject
                </Button>
              )}
            </>
          )}
        </div>
      )
    }
  ];

  // Add Status column if in history view
  if (activeTab === 'history' || currentUser.role === 'Employee') {
    columns.splice(2, 0, {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    });
  }

  const approvalStats = useMemo(() => {
    const filtered = currentUser.role === 'Employee'
      ? leaves.filter(l => l.employeeId === currentUser.id)
      : leaves;
    const total = filtered.length;
    const pending = filtered.filter(l => l.status === 'Pending').length;
    const approved = filtered.filter(l => l.status === 'Approved').length;
    const rejected = filtered.filter(l => l.status === 'Rejected').length;
    return { total, pending, approved, rejected };
  }, [leaves, currentUser]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Approval Workflows</h1>

      {(currentUser.role === 'Admin' || currentUser.role === 'admin' || currentUser.role === 'hr') && <LeaveCalendar />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Requests</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{approvalStats.total}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending</h3>
          <p className="text-3xl font-bold text-yellow-600">{approvalStats.pending}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Approved</h3>
          <p className="text-3xl font-bold text-green-600">{approvalStats.approved}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Rejected</h3>
          <p className="text-3xl font-bold text-red-600">{approvalStats.rejected}</p>
        </Card>
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'pending'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
        >
          Pending Approvals
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'history'
              ? 'bg-primary-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          onClick={() => { setActiveTab('history'); setCurrentPage(1); }}
        >
          Approval History
        </button>
      </div>

      <Card title={activeTab === 'pending' ? 'Pending Requests' : 'Processed Requests'}>
        {selectedItems.length > 0 && (
          <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex justify-between items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {selectedItems.length} item(s) selected
            </span>
            <div className="flex space-x-2">
              <Button onClick={() => handleBulkApproval('Approved')} variant="success" className="text-sm">
                Approve Selected
              </Button>
              <Button onClick={() => handleBulkApproval('Rejected')} variant="danger" className="text-sm">
                Reject Selected
              </Button>
            </div>
          </div>
        )}

        <Table columns={columns} data={paginatedApprovals} />
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      <Modal isOpen={showImpactModal} onClose={() => setShowImpactModal(false)} title="Leave Impact Analysis" size="lg">
        {selectedLeave && (() => {
          const impact = calculateLeaveImpact(selectedLeave);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-600 dark:text-gray-400">Employee</p><p className="font-semibold text-gray-800 dark:text-white">{selectedLeave.employeeName}</p></div>
                <div><p className="text-sm text-gray-600 dark:text-gray-400">Leave Type</p><p className="font-semibold text-gray-800 dark:text-white">{selectedLeave.leaveType}</p></div>
                <div><p className="text-sm text-gray-600 dark:text-gray-400">Duration</p><p className="font-semibold text-gray-800 dark:text-white">{selectedLeave.days} days</p></div>
                <div><p className="text-sm text-gray-600 dark:text-gray-400">Department</p><p className="font-semibold text-gray-800 dark:text-white">{impact.department}</p></div>
              </div>
              <div className="border-t pt-4"><h3 className="font-semibold text-gray-800 dark:text-white mb-3">Team Availability Impact</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><p className="text-xs text-gray-600 dark:text-gray-400">Total Team</p><p className="text-2xl font-bold text-blue-600">{impact.totalTeam}</p></div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"><p className="text-xs text-gray-600 dark:text-gray-400">Avg Impact</p><p className="text-2xl font-bold text-yellow-600">{impact.avgImpact}%</p></div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"><p className="text-xs text-gray-600 dark:text-gray-400">Max Impact</p><p className="text-2xl font-bold text-red-600">{impact.maxImpact}%</p></div>
                </div>
                <div className="space-y-2"><h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Daily Impact</h4>
                  {impact.dateRange.map(day => (
                    <div key={day.date} className={`p-3 rounded-lg ${day.status === 'critical' ? 'bg-red-50 dark:bg-red-900/20' : day.status === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
                      <div className="flex justify-between items-center"><div><p className="text-sm font-medium text-gray-800 dark:text-white">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p><p className="text-xs text-gray-600 dark:text-gray-400">{day.employees.join(', ')}</p></div>
                        <div className="text-right"><p className={`text-lg font-bold ${day.status === 'critical' ? 'text-red-600' : day.status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>{day.percentage}%</p><p className="text-xs text-gray-600 dark:text-gray-400">{day.leaveCount} on leave</p></div>
                      </div>
                    </div>
                  ))}
                </div>
                {impact.maxImpact >= 20 && (<div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-2"><AlertTriangle className="text-red-600 mt-0.5" size={18} /><div><p className="text-sm font-semibold text-red-800 dark:text-red-200">Critical Impact Warning</p><p className="text-xs text-red-700 dark:text-red-300">Team availability drops below 80%. Consider workload distribution.</p></div></div>)}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t"><Button onClick={() => setShowImpactModal(false)} variant="secondary">Cancel</Button><Button onClick={() => handleApproval(selectedLeave.id, 'Rejected')} variant="danger">Reject</Button><Button onClick={() => handleApproval(selectedLeave.id, 'Approved')} variant="success">Approve</Button></div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Approvals;
