import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Alert } from '../components/UI';
import { Users, Calendar, FileText, CheckCircle, Clock, TrendingUp, MapPin, ShieldCheck, ShieldAlert, Zap, ArrowRight, User } from 'lucide-react';
import { getTodayLocal } from '../utils/helpers';

const Dashboard = () => {
  const { currentUser, allUsers, attendance, leaves, leaveBalances, currentIP, ipValidation, ipSettings, clockIn, clockOut } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);

  // Time-based greeting logic
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const activeAttendance = useMemo(() => {
    const today = getTodayLocal();
    // 1. Prefer today's open session
    const todayOpen = attendance.find(a => String(a.employeeId) === String(currentUser.id) && !a.clockOut && a.date === today);
    if (todayOpen) return todayOpen;

    // 2. Otherwise look for ANY open session (e.g. from yesterday)
    const anyOpen = attendance.find(a => String(a.employeeId) === String(currentUser.id) && !a.clockOut);
    if (anyOpen) return anyOpen;

    // 3. Fallback to today's completed record
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
    const today = getTodayLocal();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

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
        { label: 'Present Days', value: presentDays, icon: Calendar, color: 'text-green-600', bg: 'bg-green-100', gradient: 'from-green-500/20 to-transparent' },
        { label: 'Pending Leaves', value: pendingLeaves, icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-100', gradient: 'from-yellow-500/20 to-transparent' },
        { label: 'Leave Balance', value: totalLeaveBalance, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-500/20 to-transparent' },
        { label: 'Work Hours', value: monthAttendance.reduce((sum, a) => sum + parseFloat(a.workHours || 0), 0).toFixed(1), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100', gradient: 'from-purple-500/20 to-transparent' }
      ];
    } else {
      // Admin View: Sync "Active Today" logic
      // Must be from today OR from yesterday but still clocked in
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterdayStr = yesterdayDate.getFullYear() + '-' + String(yesterdayDate.getMonth() + 1).padStart(2, '0') + '-' + String(yesterdayDate.getDate()).padStart(2, '0');

      const presentToday = attendance.filter(a => {
        const isToday = a.date === today;
        const isActiveYesterday = a.date === yesterdayStr && !a.clockOut;
        const hasActiveStatus = a.status === 'Present' || a.status === 'Late' || a.status === 'Pending' || !a.clockOut;
        return (isToday || isActiveYesterday) && hasActiveStatus;
      }).length;

      const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
      const activeEmployees = allUsers.filter(u => u.role === 'employee').length;

      return [
        { label: 'Total Workforce', value: activeEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', gradient: 'from-blue-500/20 to-transparent' },
        { label: 'Active Today', value: presentToday, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', gradient: 'from-green-500/20 to-transparent' },
        { label: 'Leave Requests', value: pendingLeaves, icon: FileText, color: 'text-yellow-600', bg: 'bg-yellow-100', gradient: 'from-yellow-500/20 to-transparent' },
        { label: 'Total Departments', value: new Set(allUsers.map(u => u.department)).size, icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100', gradient: 'from-purple-500/20 to-transparent' }
      ];
    }
  }, [currentUser, attendance, leaves, leaveBalances, allUsers]);

  const recentActivity = useMemo(() => {
    if (currentUser.role === 'employee') {
      return attendance
        .filter(a => a.employeeId === currentUser.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .map(a => ({
          date: a.date,
          type: 'Attendance',
          status: a.status,
          details: `${a.clockIn || 'N/A'} - ${a.clockOut || 'N/A'}`,
          icon: Clock
        }));
    } else {
      return leaves
        .filter(l => l.status === 'Pending')
        .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
        .slice(0, 5)
        .map(l => ({
          date: l.appliedDate,
          type: 'Leave Request',
          status: l.status,
          details: `${l.employeeName} - ${l.leaveType}`,
          icon: FileText
        }));
    }
  }, [currentUser, attendance, leaves]);

  const quickActions = useMemo(() => {
    if (currentUser.role === 'employee') {
      return [
        { label: 'Attendance', path: '/attendance', icon: Calendar, color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' },
        { label: 'Apply Leave', path: '/leave', icon: FileText, color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
        { label: 'My Profile', path: '/profile', icon: User, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
        { label: 'Documents', path: '/documents', icon: ShieldCheck, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' }
      ];
    } else {
      return [
        { label: 'Employees', path: '/employees', icon: Users, color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' },
        { label: 'Approvals', path: '/approvals', icon: CheckCircle, color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
        { label: 'Analytics', path: '/reports', icon: TrendingUp, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
        { label: 'Onboarding', path: '/onboarding', icon: Zap, color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' }
      ];
    }
  }, [currentUser]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Personalized Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            {greeting}, <span className="text-primary-600">{currentUser.name.split(' ')[0]}!</span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium mt-1">
            Let's see what's happening at Outvying today.
          </p>
        </div>

        {/* Improved IP Status Pill */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border backdrop-blur-md transition-all ${ipValidation.allowed
          ? 'bg-green-500/10 border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400'
          : 'bg-red-500/10 border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400'
          }`}>
          {ipValidation.allowed ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-widest leading-none mb-1 opacity-70">Security Status</span>
            <span className="text-xs font-bold leading-none">
              {ipValidation.allowed ? `Verified Office IP: ${currentIP}` : `Unverified Session: ${currentIP}`}
            </span>
          </div>
          {ipValidation.allowed && (
            <div className="ml-2 flex items-center gap-1 text-[10px] bg-green-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm">
              <MapPin size={10} /> {ipValidation.location}
            </div>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Main Grid: Clock/Featured + Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Clock Section - Priority for Employees */}
        {currentUser.role === 'employee' && (
          <div className="xl:col-span-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="relative overflow-hidden border-primary-500/20 dark:border-primary-500/10 shadow-2xl shadow-primary-500/5 group">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <Clock size={120} />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-2">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary-500/10 rounded-2xl text-primary-600 animate-pulse-slow">
                      <Clock size={32} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-1">Current Session</p>
                      <h3 className="text-3xl font-black text-gray-900 dark:text-white leading-none">
                        {activeAttendance?.clockIn || '00:00 AM'}
                      </h3>
                      <p className="text-xs text-gray-500 font-bold mt-2 flex items-center gap-1">
                        <MapPin size={12} /> Office Headquarters
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      onClick={handleClockIn}
                      disabled={activeAttendance?.clockIn}
                      className="flex-1 sm:flex-none py-3 px-8 text-sm font-bold shadow-lg shadow-primary-500/30"
                    >
                      Clock In
                    </Button>
                    <Button
                      onClick={handleClockOut}
                      disabled={!activeAttendance?.clockIn || activeAttendance?.clockOut}
                      variant="secondary"
                      className="flex-1 sm:flex-none py-3 px-8 text-sm font-bold border-gray-200 dark:border-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      Clock Out
                    </Button>
                  </div>
                </div>
                {activeAttendance && (
                  <div className="mt-6 flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/30 rounded-2xl transition-all hover:bg-gray-100/50">
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full animate-pulse ${activeAttendance.clockOut ? 'bg-red-500' : 'bg-green-500'}`} />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        Status: <span className="text-primary-600 uppercase italic">{activeAttendance.status}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block mb-1">Time on Deck</span>
                      <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums">
                        {activeAttendance.workHours || '0.0'} HRS
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Quick Actions Integration for Employee Row */}
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className={`flex flex-col items-center justify-center p-6 rounded-3xl border border-transparent transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${action.color} group relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-16 h-16 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                    <action.icon size={28} className="mb-3 group-hover:scale-125 transition-transform duration-300" />
                    <span className="text-xs font-black uppercase tracking-wider text-center">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Improved Stats Grid */}
        <div className={`xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`}>
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="relative group p-6 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50 shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-500 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity blur-2xl`} />
              <div className="relative z-10 flex flex-col gap-4">
                <div className={`p-3.5 rounded-2xl w-fit ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                    <TrendingUp size={16} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dashboard Bottom Section */}
        <div className="xl:col-span-8">
          <Card title="Recent Activity Feed" className="border-gray-100 dark:border-gray-800/50 shadow-sm h-full rounded-[2.5rem]">
            <div className="space-y-4 px-2">
              {recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-full text-gray-300 mb-4">
                    <FileText size={40} />
                  </div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No recent updates</p>
                </div>
              ) : (
                recentActivity.map((activity, idx) => (
                  <div key={idx} className="group relative flex items-start gap-4 p-4 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-all duration-300 border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                    <div className={`mt-1 p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors group-hover:bg-primary-500 group-hover:text-white`}>
                      <activity.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{activity.type}</h4>
                        <span className="text-[10px] font-black text-gray-400 tabular-nums">{activity.date}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate mb-2">{activity.details}</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm ${activity.status === 'Present' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          activity.status === 'Late' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                        <div className={`w-1 h-1 rounded-full ${activity.status === 'Present' ? 'bg-green-500' :
                          activity.status === 'Pending' ? 'bg-yellow-500' :
                            activity.status === 'Late' ? 'bg-orange-500' : 'bg-blue-500'
                          }`} />
                        {activity.status}
                      </span>
                    </div>
                    <div className="self-center opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary-600">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                ))
              )}
            </div>
            {recentActivity.length > 0 && (
              <button className="w-full mt-6 py-4 text-xs font-black text-gray-500 uppercase tracking-[0.2em] border-t border-gray-100 dark:border-gray-800/50 hover:text-primary-600 transition-colors">
                View All Activity
              </button>
            )}
          </Card>
        </div>

        {/* Global Quick Actions Section - Column style for balance */}
        <div className="xl:col-span-4 space-y-6">
          {currentUser.role !== 'employee' && (
            <Card title="Management Tools" className="border-primary-500/10 dark:border-primary-500/5 shadow-xl shadow-primary-500/5 rounded-[2.5rem]">
              <div className="grid grid-cols-1 gap-3">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className="group flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-primary-500 transition-all hover:bg-white dark:hover:bg-gray-800 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${action.color} transition-transform group-hover:scale-110`}>
                        <action.icon size={20} />
                      </div>
                      <span className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight">{action.label}</span>
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card title="Company Bulletin" className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-transparent shadow-xl shadow-indigo-500/20 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
              <Zap size={100} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">New Update</p>
              <h4 className="text-lg font-black mb-3 leading-tight tracking-tight text-white">Join our upcoming "Tech Sync" this Friday!</h4>
              <p className="text-xs text-indigo-100/80 font-medium mb-6 leading-relaxed">
                We'll be discussing the new HRMS features and data security protocols for Q1. Don't miss out!
              </p>
              <Button variant="secondary" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white font-black uppercase text-[10px] tracking-widest py-3">
                RSVP Now
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
