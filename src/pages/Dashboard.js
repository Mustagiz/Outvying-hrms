import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Alert } from '../components/UI';
import { Users, Calendar, FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { currentUser, allUsers, attendance, leaves, leaveBalances, currentIP, ipValidation, ipSettings, clockIn, clockOut } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);

  // Intelligent Active Session Detection for Dashboard
  const activeAttendance = useMemo(() => {
    // 1. Try to find an open session (no clockOut) first
    const openSession = attendance.find(a => String(a.employeeId) === String(currentUser.id) && !a.clockOut);
    if (openSession) return openSession;

    // 2. Otherwise, find the record for the current logical business day
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => String(a.employeeId) === String(currentUser.id) && a.date === today);
  }, [attendance, currentUser]);

  const handleClockIn = async () => {
    const result = await clockIn(currentUser?.id);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleClockOut = async () => {
    const result = await clockOut(currentUser?.id);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    if (currentUser.role === 'employee') {
      const myAttendance = attendance.filter(a => String(a.employeeId) === String(currentUser.id));
      const monthAttendance = myAttendance.filter(a => {
        const date = new Date(a.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      const presentDays = monthAttendance.filter(a => a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day').length;
      const myLeaves = leaves.filter(l => String(l.employeeId) === String(currentUser.id));
      const pendingLeaves = myLeaves.filter(l => l.status === 'Pending').length;
      const myBalance = leaveBalances.find(lb => String(lb.employeeId) === String(currentUser.id));
      const totalLeaveBalance = myBalance
        ? (myBalance.paidLeave?.available || 0) + (myBalance.casualLeave?.available || 0)
        : 0;

      return [
        { label: 'Present Days (This Month)', value: presentDays, icon: Calendar, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Pending Leave Requests', value: pendingLeaves, icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'Available Leave Balance', value: totalLeaveBalance, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Total Work Hours (Month)', value: monthAttendance.reduce((sum, a) => sum + parseFloat(a.workHours || 0), 0).toFixed(1), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' }
      ];
    } else {
      // Admin View: Employees "Present Today" should include anyone with an active session OR a clock-in today
      const presentToday = attendance.filter(a => (a.date === today || !a.clockOut) && (a.status === 'Present' || a.status === 'Late' || a.status === 'Pending' || !a.clockOut)).length;
      const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
      const activeEmployees = allUsers.filter(u => u.role === 'employee').length;

      return [
        { label: 'Total Employees', value: activeEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Active/Present', value: presentToday, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Pending Leave Approvals', value: pendingLeaves, icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        { label: 'Departments', value: new Set(allUsers.map(u => u.department)).size, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' }
      ];
    }
  }, [currentUser, attendance, leaves, leaveBalances, allUsers]);

  const recentActivity = useMemo(() => {
    if (currentUser.role === 'employee') {
      const myAttendance = attendance
        .filter(a => a.employeeId === currentUser.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      return myAttendance.map(a => ({
        date: a.date,
        type: 'Attendance',
        status: a.status,
        details: `${a.clockIn || 'N/A'} - ${a.clockOut || 'N/A'}`
      }));
    } else {
      const recentLeaves = leaves
        .filter(l => l.status === 'Pending')
        .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
        .slice(0, 5);

      return recentLeaves.map(l => ({
        date: l.appliedDate,
        type: 'Leave Request',
        status: l.status,
        details: `${l.employeeName} - ${l.leaveType}`
      }));
    }
  }, [currentUser, attendance, leaves]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Dashboard</h1>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* IP Status Banner */}
      <div className={`mb-6 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${ipValidation.allowed
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
        <div>
          <p className={`text-xs sm:text-sm font-medium ${ipValidation.allowed ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
            {ipValidation.allowed ? '✓' : '⚠'} Connected from {currentIP} {ipValidation.allowed ? `(${ipValidation.location})` : '(Unauthorized)'}
          </p>
          {!ipValidation.allowed && (
            <p className="text-[10px] sm:text-xs text-red-700 dark:text-red-300 mt-1">
              {ipSettings.blockMessage || 'Some features may be restricted. Connect from office network or approved VPN.'}
            </p>
          )}
        </div>
      </div>

      {/* Clock In/Out Card - Only for Employees */}
      {currentUser.role === 'employee' && (
        <Card title="Today's Attendance" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="text-primary-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clock In</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {activeAttendance?.clockIn || 'Not clocked in'}
                  </p>
                </div>
              </div>
              <Button onClick={handleClockIn} disabled={activeAttendance?.clockIn}>
                Clock In
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="text-primary-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clock Out</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {activeAttendance?.clockOut || 'Not clocked out'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleClockOut}
                disabled={!activeAttendance?.clockIn || activeAttendance?.clockOut}
                variant="secondary"
              >
                Clock Out
              </Button>
            </div>
          </div>
          {activeAttendance && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Status:</strong> {activeAttendance.status} | <strong>Work Hours:</strong> {activeAttendance.workHours || 0}h
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card title="Recent Activity">
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{activity.type}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{activity.details}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${activity.status === 'Present' ? 'bg-green-100 text-green-800' :
                      activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        activity.status === 'Late' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {activity.status}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-4">
            {currentUser.role === 'employee' ? (
              <>
                <button onClick={() => navigate('/attendance')} className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                  <Calendar className="text-primary-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Mark Attendance</p>
                </button>
                <button onClick={() => navigate('/leave')} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <FileText className="text-green-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Apply Leave</p>
                </button>
                <button onClick={() => navigate('/profile')} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <Users className="text-purple-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-gray-800 dark:text-white">View Profile</p>
                </button>
                <button onClick={() => navigate('/documents')} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                  <CheckCircle className="text-orange-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Upload Documents</p>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/employees')} className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
                  <Users className="text-primary-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Employee Directory</p>
                </button>
                <button onClick={() => navigate('/approvals')} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <CheckCircle className="text-green-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Approve Leaves</p>
                </button>
                <button onClick={() => navigate('/reports')} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                  <TrendingUp className="text-purple-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-gray-800 dark:text-white">View Reports</p>
                </button>
                <button onClick={() => navigate('/onboarding')} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                  <FileText className="text-orange-600 mb-2" size={24} />
                  <p className="text-sm font-medium text-gray-800 dark:text-white">Onboarding</p>
                </button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
