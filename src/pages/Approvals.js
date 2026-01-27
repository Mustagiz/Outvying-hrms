import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Table, Button, Badge, Pagination, Modal } from '../components/UI';
import { formatDate, getStatusColor } from '../utils/helpers';
import { CheckCircle, XCircle, Users, AlertTriangle, Clock, Calendar, Search, Filter, ArrowUpRight, CheckSquare, XSquare, Activity, BarChart3, TrendingUp, ShieldAlert, Check } from 'lucide-react';
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
    if (window.confirm(`Are you sure you want to ${status} ${selectedItems.length} requests?`)) {
      selectedItems.forEach(id => {
        updateLeaveStatus(id, status, currentUser.name);
      });
      setSelectedItems([]);
    }
  };

  const toggleSelection = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const columns = [
    {
      header: (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 transition-all"
            checked={selectedItems.length === paginatedApprovals.length && paginatedApprovals.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedItems(paginatedApprovals.map(l => l.id));
              } else {
                setSelectedItems([]);
              }
            }}
          />
        </div>
      ),
      render: (row) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500 transition-all"
            checked={selectedItems.includes(row.id)}
            onChange={() => toggleSelection(row.id)}
          />
        </div>
      )
    },
    {
      header: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            {row.employeeName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white leading-tight">{row.employeeName}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">ID: {row.employeeId || 'N/A'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Leave Details',
      render: (row) => (
        <div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 mb-1">
            {row.leaveType}
          </span>
          <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <Calendar size={10} />
            {formatDate(row.startDate)} <span className="text-gray-300">|</span> {row.days} Day(s)
          </div>
        </div>
      )
    },
    { header: 'Reason', accessor: 'reason', render: (row) => <p className="text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={row.reason}>{row.reason}</p> },
    {
      header: 'Status', render: (row) => (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${row.status === 'Approved' ? 'bg-green-50 text-green-700 border border-green-200' :
            row.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${row.status === 'Approved' ? 'bg-green-500' :
              row.status === 'Rejected' ? 'bg-red-500' :
                'bg-yellow-500'
            }`} />
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => showImpactAnalysis(row)}
            className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 transition-colors"
            title="Analyze Impact"
          >
            <Activity size={16} />
          </button>

          {(activeTab === 'pending' || activeTab === 'history') && (
            <>
              {row.status !== 'Approved' && (
                <button
                  onClick={() => handleApproval(row.id, 'Approved')}
                  className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 transition-colors"
                  title="Approve"
                >
                  <Check size={16} strokeWidth={3} />
                </button>
              )}
              {row.status !== 'Rejected' && (
                <button
                  onClick={() => handleApproval(row.id, 'Rejected')}
                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors"
                  title="Reject"
                >
                  <XSquare size={16} />
                </button>
              )}
            </>
          )}
        </div>
      )
    }
  ];

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

  const StatCard = ({ title, value, color, icon: Icon, gradient }) => (
    <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 group hover:shadow-lg transition-all duration-300">
      <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-500`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className={`text-4xl font-black ${color} tracking-tight`}>{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          Approval <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Center</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Streamline your team's requests with intelligent impact analysis.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Requests"
          value={approvalStats.total}
          color="text-gray-900 dark:text-white"
          icon={BarChart3}
          gradient="bg-gradient-to-br from-gray-700 to-gray-900"
        />
        <StatCard
          title="Pending Review"
          value={approvalStats.pending}
          color="text-yellow-600"
          icon={Clock}
          gradient="bg-gradient-to-br from-yellow-400 to-yellow-600"
        />
        <StatCard
          title="Approved"
          value={approvalStats.approved}
          color="text-green-600"
          icon={CheckCircle}
          gradient="bg-gradient-to-br from-green-400 to-green-600"
        />
        <StatCard
          title="Rejected"
          value={approvalStats.rejected}
          color="text-red-600"
          icon={XCircle}
          gradient="bg-gradient-to-br from-red-400 to-red-600"
        />
      </div>

      {(currentUser.role === 'Admin' || currentUser.role === 'admin' || currentUser.role === 'hr') && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="text-indigo-600" size={20} />
            Team Availability Calendar
          </h3>
          <LeaveCalendar />
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800/50 rounded-2xl w-fit">
        {['pending', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm scale-100'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
          >
            {tab === 'pending' ? 'Pending Queue' : 'History Log'}
          </button>
        ))}
      </div>

      {/* Content */}
      <Card className="border-none shadow-xl shadow-gray-200/50 dark:shadow-none rounded-[2rem] overflow-hidden">
        {/* Bulk Action Bar */}
        {selectedItems.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 border-b border-indigo-100 dark:border-indigo-800/30 flex justify-between items-center animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm">
                {selectedItems.length}
              </span>
              <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Requests Selected</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleBulkApproval('Approved')} variant="success" className="shadow-lg shadow-green-500/20">
                <CheckCircle size={16} className="mr-2" /> Approve All
              </Button>
              <Button onClick={() => handleBulkApproval('Rejected')} variant="danger" className="shadow-lg shadow-red-500/20">
                <XCircle size={16} className="mr-2" /> Reject All
              </Button>
            </div>
          </div>
        )}

        {paginatedApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <CheckSquare size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Caught Up!</h3>
            <p className="text-gray-500 mt-2 max-w-sm">There are no pending requests matching your criteria at the moment.</p>
          </div>
        ) : (
          <>
            <Table columns={columns} data={paginatedApprovals} />
            <div className="p-4 border-t border-gray-50 dark:border-gray-800">
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          </>
        )}
      </Card>

      {/* Analysis Modal */}
      <Modal isOpen={showImpactModal} onClose={() => setShowImpactModal(false)} title="Impact Analysis" size="lg">
        {selectedLeave && (() => {
          const impact = calculateLeaveImpact(selectedLeave);
          return (
            <div className="space-y-6">
              {/* Employee Snapshot */}
              <div className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-2xl">
                    {selectedLeave.employeeName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">{selectedLeave.employeeName}</h3>
                    <p className="text-sm font-medium text-gray-500 mb-2">{selectedLeave.leaveType} Request</p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-600 shadow-sm">
                        {impact.department}
                      </span>
                      <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-600 shadow-sm flex items-center gap-1">
                        <Calendar size={12} /> {selectedLeave.days} Day(s)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Metrics */}
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Risk Assessment</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                    <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Total Team</p>
                    <p className="text-3xl font-black text-blue-700 dark:text-blue-300">{impact.totalTeam}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-100 dark:border-yellow-800/30">
                    <p className="text-[10px] font-bold text-yellow-600 uppercase mb-1">Avg Absence</p>
                    <p className="text-3xl font-black text-yellow-700 dark:text-yellow-300">{impact.avgImpact}%</p>
                  </div>
                  <div className={`p-4 rounded-2xl border ${impact.maxImpact >= 20
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30'
                      : 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30'
                    }`}>
                    <p className={`text-[10px] font-bold uppercase mb-1 ${impact.maxImpact >= 20 ? 'text-red-600' : 'text-green-600'}`}>Peak Impact</p>
                    <p className={`text-3xl font-black ${impact.maxImpact >= 20 ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>{impact.maxImpact}%</p>
                  </div>
                </div>
              </div>

              {/* Day-wise Breakdown */}
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Daily Forecast</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {impact.dateRange.map(day => (
                    <div key={day.date} className={`flex items-center justify-between p-3 rounded-xl border ${day.status === 'critical' ? 'bg-red-50/50 border-red-100 text-red-900' :
                        day.status === 'warning' ? 'bg-yellow-50/50 border-yellow-100 text-yellow-900' :
                          'bg-green-50/50 border-green-100 text-green-900'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-10 rounded-full ${day.status === 'critical' ? 'bg-red-500' :
                            day.status === 'warning' ? 'bg-yellow-500' :
                              'bg-green-500'
                          }`} />
                        <div>
                          <p className="text-sm font-bold">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                          <p className="text-xs opacity-80">{day.leaveCount} Out: {day.employees.join(', ')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black">{day.percentage}%</p>
                        <p className="text-[10px] font-bold uppercase opacity-70">Depleted</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {impact.maxImpact >= 20 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl">
                  <ShieldAlert className="text-red-600 shrink-0" size={20} />
                  <div>
                    <h5 className="text-sm font-bold text-red-900 dark:text-red-300">Critical Staff Shortage Detected</h5>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">Approval will cause >20% department absence on peak days. Re-scheduling recommended.</p>
                  </div>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                <Button onClick={() => setShowImpactModal(false)} variant="secondary" className="flex-1 py-3 font-bold">Cancel</Button>
                <Button onClick={() => handleApproval(selectedLeave.id, 'Rejected')} variant="danger" className="flex-1 py-3 font-bold shadow-lg shadow-red-500/20">Reject Request</Button>
                <Button onClick={() => handleApproval(selectedLeave.id, 'Approved')} variant="success" className="flex-1 py-3 font-bold shadow-lg shadow-green-500/20">Approve Request</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default Approvals;
