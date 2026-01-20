import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Select } from '../components/UI';
import { exportToCSV, getYearOptions } from '../utils/helpers';
import { BarChart3, Download, TrendingUp, Users } from 'lucide-react';

const Reports = () => {
  const { attendance, leaves, allUsers } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const attendanceReport = useMemo(() => {
    const filtered = attendance.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const totalDays = filtered.length;
    const present = filtered.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const absent = filtered.filter(a => a.status === 'Absent').length;
    const late = filtered.filter(a => a.status === 'Late').length;
    const totalHours = filtered.reduce((sum, a) => sum + parseFloat(a.workHours || 0), 0);
    const avgHours = totalDays > 0 ? (totalHours / totalDays).toFixed(2) : 0;

    return { totalDays, present, absent, late, totalHours: totalHours.toFixed(1), avgHours };
  }, [attendance, selectedMonth, selectedYear]);

  const leaveReport = useMemo(() => {
    const filtered = leaves.filter(l => {
      const date = new Date(l.startDate);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });

    const total = filtered.length;
    const approved = filtered.filter(l => l.status === 'Approved').length;
    const pending = filtered.filter(l => l.status === 'Pending').length;
    const rejected = filtered.filter(l => l.status === 'Rejected').length;

    const byType = {};
    filtered.forEach(l => {
      byType[l.leaveType] = (byType[l.leaveType] || 0) + 1;
    });

    return { total, approved, pending, rejected, byType };
  }, [leaves, selectedMonth, selectedYear]);

  const departmentReport = useMemo(() => {
    const employees = allUsers.filter(u => u.role === 'employee');
    const byDepartment = {};

    employees.forEach(emp => {
      if (!byDepartment[emp.department]) {
        byDepartment[emp.department] = { count: 0, present: 0, absent: 0 };
      }
      byDepartment[emp.department].count++;

      const empAttendance = attendance.filter(a => {
        const date = new Date(a.date);
        return a.employeeId === emp.id &&
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear;
      });

      byDepartment[emp.department].present += empAttendance.filter(a =>
        a.status === 'Present' || a.status === 'Late'
      ).length;
      byDepartment[emp.department].absent += empAttendance.filter(a =>
        a.status === 'Absent'
      ).length;
    });

    return byDepartment;
  }, [allUsers, attendance, selectedMonth, selectedYear]);

  const monthOptions = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' }
  ];

  const yearOptions = getYearOptions();

  const exportAttendanceReport = () => {
    const data = attendance.filter(a => {
      const date = new Date(a.date);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
    exportToCSV(data, 'attendance_report');
  };

  const exportLeaveReport = () => {
    const data = leaves.filter(l => {
      const date = new Date(l.startDate);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
    exportToCSV(data, 'leave_report');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Reports & Analytics</h1>

      <div className="flex gap-4 mb-6">
        <Select
          label="Month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          options={monthOptions}
        />
        <Select
          label="Year"
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          options={yearOptions}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Attendance Report">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Present Days</p>
                <p className="text-2xl font-bold text-green-600">{attendanceReport.present}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Absent Days</p>
                <p className="text-2xl font-bold text-red-600">{attendanceReport.absent}</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Late Arrivals</p>
                <p className="text-2xl font-bold text-yellow-600">{attendanceReport.late}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Avg Hours/Day</p>
                <p className="text-2xl font-bold text-blue-600">{attendanceReport.avgHours}h</p>
              </div>
            </div>
            <Button onClick={exportAttendanceReport} variant="secondary" className="w-full">
              <Download size={16} className="inline mr-2" />
              Export Attendance Report
            </Button>
          </div>
        </Card>

        <Card title="Leave Report">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{leaveReport.total}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-600">{leaveReport.approved}</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{leaveReport.pending}</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{leaveReport.rejected}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Leave by Type</p>
              {Object.entries(leaveReport.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-800 dark:text-white">{type}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white">{count}</span>
                </div>
              ))}
            </div>

            <Button onClick={exportLeaveReport} variant="secondary" className="w-full">
              <Download size={16} className="inline mr-2" />
              Export Leave Report
            </Button>
          </div>
        </Card>
      </div>

      <Card title="Department-wise Analytics">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(departmentReport).map(([dept, data]) => (
            <div key={dept} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 dark:text-white">{dept}</h4>
                <Users size={20} className="text-primary-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Employees</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{data.count}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Present</span>
                  <span className="font-semibold text-green-600">{data.present}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Absent</span>
                  <span className="font-semibold text-red-600">{data.absent}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Attendance %</span>
                  <span className="font-semibold text-primary-600">
                    {data.present + data.absent > 0
                      ? ((data.present / (data.present + data.absent)) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Reports;
