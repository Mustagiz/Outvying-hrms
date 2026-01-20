import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Alert, Select } from '../components/UI';
import { Clock, Calendar } from 'lucide-react';
import { formatDate, getStatusColor, exportToCSV, getYearOptions } from '../utils/helpers';

const Attendance = () => {
  const { currentUser, attendance, clockIn, clockOut, allUsers } = useAuth();
  const [alert, setAlert] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser.role === 'employee' ? String(currentUser.id) : 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.find(a =>
    String(a.employeeId) === String(currentUser.id) && a.date === today
  );

  const handleClockIn = async () => {
    console.log("Attendance: handleClockIn clicked. currentUser.id:", currentUser?.id);
    const result = await clockIn(currentUser?.id);
    console.log("Attendance: clockIn result:", result);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleClockOut = async () => {
    console.log("Attendance: handleClockOut clicked. currentUser.id:", currentUser?.id);
    const result = await clockOut(currentUser?.id);
    console.log("Attendance: clockOut result:", result);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const filteredAttendance = useMemo(() => {
    let filtered = attendance.filter(a => {
      const date = new Date(a.date);
      const matchesMonth = date.getMonth() === selectedMonth;
      const matchesYear = date.getFullYear() === selectedYear;
      const matchesEmployee = currentUser.role === 'employee'
        ? String(a.employeeId) === String(currentUser.id)
        : selectedEmployee === 'all' ? true : String(a.employeeId) === String(selectedEmployee);
      const matchesStatus = selectedStatus === 'all' ? true : a.status === selectedStatus;

      return matchesMonth && matchesYear && matchesEmployee && matchesStatus;
    });

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, selectedMonth, selectedYear, selectedEmployee, selectedStatus, currentUser]);

  const attendanceStats = useMemo(() => {
    const present = filteredAttendance.filter(a => (a.status === 'Present' || a.status === 'Late') && parseFloat(a.workHours || 0) >= 8).length;
    const late = filteredAttendance.filter(a => a.status === 'Late').length;
    const halfDay = filteredAttendance.filter(a => a.status === 'Half Day').length;
    const lwp = filteredAttendance.filter(a => a.status === 'LWP').length;
    const totalHours = filteredAttendance.reduce((sum, a) => sum + parseFloat(a.workHours || 0), 0);
    const totalOvertime = filteredAttendance.reduce((sum, a) => sum + parseFloat(a.overtime || 0), 0);
    const workingDays = filteredAttendance.reduce((sum, a) => sum + parseFloat(a.workingDays || 0), 0);

    return { present, late, halfDay, lwp, totalHours: totalHours.toFixed(1), totalOvertime: totalOvertime.toFixed(1), workingDays: workingDays.toFixed(1) };
  }, [filteredAttendance]);

  const columns = [
    { header: 'Date', accessor: 'date', render: (row) => formatDate(row.date) },
    ...(currentUser.role !== 'employee' ? [{
      header: 'Employee',
      accessor: 'employeeId',
      render: (row) => allUsers.find(u => String(u.id) === String(row.employeeId))?.name || 'Unknown'
    }] : []),
    { header: 'Clock In', accessor: 'clockIn', render: (row) => row.clockIn || 'N/A' },
    { header: 'Clock Out', accessor: 'clockOut', render: (row) => row.clockOut || 'N/A' },
    { header: 'Work Hours', accessor: 'workHours', render: (row) => `${row.workHours || 0}h` },
    { header: 'Overtime', accessor: 'overtime', render: (row) => `${row.overtime || 0}h` },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    { header: 'Rule Applied', accessor: 'ruleApplied', render: (row) => row.ruleApplied || 'Standard Office' }
  ];

  const monthOptions = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' }
  ];

  const yearOptions = getYearOptions();

  const employeeOptions = [
    { value: 'all', label: 'All Employees' },
    ...allUsers.filter(u => u.role === 'employee').map(u => ({ value: String(u.id), label: u.name }))
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Present', label: 'Present' },
    { value: 'Late', label: 'Late' },
    { value: 'Half Day', label: 'Half Day' },
    { value: 'LWP', label: 'LWP' }
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Attendance Management</h1>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card title="Today's Attendance">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="text-primary-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clock In</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {todayAttendance?.clockIn || 'Not clocked in'}
                  </p>
                </div>
              </div>
              <Button onClick={handleClockIn} disabled={todayAttendance?.clockIn}>
                Clock In
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="text-primary-600" size={24} />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Clock Out</p>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white">
                    {todayAttendance?.clockOut || 'Not clocked out'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleClockOut}
                disabled={!todayAttendance?.clockIn || todayAttendance?.clockOut}
                variant="secondary"
              >
                Clock Out
              </Button>
            </div>

            {todayAttendance && (
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Today's Status</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(todayAttendance.status)}`}>
                  {todayAttendance.status}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card title="Monthly Statistics">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Present Days</p>
              <p className="text-2xl font-bold text-green-600">{attendanceStats.present}</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Late Days</p>
              <p className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Half Days</p>
              <p className="text-2xl font-bold text-orange-600">{attendanceStats.halfDay}</p>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">LWP Days</p>
              <p className="text-2xl font-bold text-red-600">{attendanceStats.lwp}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalHours}h</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Working Days</p>
              <p className="text-2xl font-bold text-purple-600">{attendanceStats.workingDays}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Attendance History">
        <div className="mb-4">
          <div className="flex flex-wrap gap-4 mb-4">
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
            {currentUser.role !== 'employee' && (
              <>
                <Select
                  label="Employee"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  options={employeeOptions}
                />
                <Select
                  label="Status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  options={statusOptions}
                />
              </>
            )}
          </div>
          <Button
            onClick={() => exportToCSV(filteredAttendance, 'attendance_report')}
            variant="secondary"
          >
            Export to CSV
          </Button>
        </div>

        {currentUser.role !== 'employee' && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Present</p>
                <p className="text-xl font-bold text-green-600">{attendanceStats.present}</p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Late</p>
                <p className="text-xl font-bold text-yellow-600">{attendanceStats.late}</p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Half Day</p>
                <p className="text-xl font-bold text-orange-600">{attendanceStats.halfDay}</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">LWP</p>
                <p className="text-xl font-bold text-red-600">{attendanceStats.lwp}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Total Hours</p>
                <p className="text-xl font-bold text-blue-600">{attendanceStats.totalHours}h</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Working Days</p>
                <p className="text-xl font-bold text-purple-600">{attendanceStats.workingDays}</p>
              </div>
            </div>
          </>
        )}

        <Table columns={columns} data={filteredAttendance} />
      </Card>
    </div>
  );
};

export default Attendance;
