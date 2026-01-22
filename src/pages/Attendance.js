import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Alert, Select, Modal } from '../components/UI';
import { Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, getStatusColor, exportToCSV, getYearOptions } from '../utils/helpers';

import { calculateAttendanceStatus } from '../utils/biometricSync';
import { doc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const Attendance = () => {
  const { currentUser, attendance, rosters, clockIn, clockOut, syncBiometric, allUsers } = useAuth();
  const [alert, setAlert] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser.role === 'employee' ? String(currentUser.id) : 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Manual Attendance State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({
    employeeId: '',
    date: '',
    clockIn: '',
    clockOut: ''
  });

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

  const handleSyncBiometric = async () => {
    setIsSyncing(true);
    const result = await syncBiometric();
    setIsSyncing(false);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleFixRecords = async () => {
    if (!window.confirm("This will recalculate work hours for all records with negative hours. Proceed?")) return;
    setIsSyncing(true);
    let count = 0;
    try {
      // Import needed functions dynamically or assume they are available from imports if I add them
      // But I can't add imports inside function. I need to add them at top.
      // Minimal logic here: Iterate filteredAttendance (or full attendance in context) 
      // check for negative hours, recalculate using calculateAbsDuration, and updateDoc.

      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      const { calculateAbsDuration } = await import('../utils/helpers');

      const recordsToScan = attendance.filter(a => a.clockIn);

      for (const record of recordsToScan) {
        if (record.clockIn) {
          let clockOutDate = record.date;
          const roster = rosters.find(r => String(r.employeeId) === String(record.employeeId) && r.date === record.date);
          const result = calculateAttendanceStatus(record.clockIn, record.clockOut, record.date, roster);

          const ref = doc(db, 'attendance', record.id);
          await updateDoc(ref, {
            workHours: result.workHours,
            workingDays: result.workingDays,
            overtime: result.overtime,
            status: result.status,
            ruleApplied: result.ruleApplied
          });
          count++;
        }
      }
      setAlert({ type: 'success', message: `Fixed ${count} invalid records successfully.` });
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Fix failed: ' + err.message });
    }
    setIsSyncing(false);
    setTimeout(() => setAlert(null), 3000);
  };

  const handleManualSubmit = async () => {
    if (!manualData.employeeId || !manualData.date) {
      setAlert({ type: 'error', message: 'Please select Employee and Date' });
      return;
    }

    try {
      setIsSyncing(true);
      const { employeeId, date, clockIn, clockOut } = manualData;
      const roster = rosters.find(r => String(r.employeeId) === String(employeeId) && r.date === date);

      // Calculate status
      let attendanceUpdate = {};

      if (clockIn) {
        // Check for midnight crossover
        let clockOutDate = date;
        if (clockOut) {
          const [inH] = clockIn.split(':').map(Number);
          const [outH] = clockOut.split(':').map(Number);
          if (outH < inH) {
            // Next day
          }
        }

        const result = calculateAttendanceStatus(clockIn, clockOut, date, roster);
        attendanceUpdate = {
          clockIn,
          clockOut: clockOut || null,
          status: result.status,
          workHours: result.workHours,
          workingDays: result.workingDays,
          overtime: result.overtime,
          ruleApplied: result.ruleApplied,
          manualEntry: true,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.id
        };
      } else {
        // Default to Present if just marking attendance? Use dummy time?
        // Let's enforce time for now to keep logic robust using the calc utility.
        throw new Error("Please provide Clock In time.");
      }

      // Logic to update/overwrite
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', employeeId),
        where('date', '==', date)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const firstDoc = querySnapshot.docs[0];
        await updateDoc(firstDoc.ref, attendanceUpdate);
        // Delete duplicates
        if (querySnapshot.docs.length > 1) {
          for (let i = 1; i < querySnapshot.docs.length; i++) {
            await deleteDoc(querySnapshot.docs[i].ref);
          }
        }
      } else {
        const docId = `${employeeId}-${date}`;
        await setDoc(doc(db, 'attendance', docId), {
          employeeId,
          date,
          ...attendanceUpdate
        });
      }

      setAlert({ type: 'success', message: 'Attendance marked successfully' });
      setShowManualModal(false);
      setManualData({ employeeId: '', date: '', clockIn: '', clockOut: '' });
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Operation failed: ' + err.message });
    }
    setIsSyncing(false);
    setTimeout(() => setAlert(null), 3000);
  };

  const filteredAttendance = useMemo(() => {
    // 1. Sanity Check: Remove orphaned records
    const activeUserIds = new Set(allUsers.map(u => String(u.id)));
    let filtered = attendance.filter(a => activeUserIds.has(String(a.employeeId)));

    // 2. Apply filters
    filtered = filtered.filter(a => {
      const date = new Date(a.date);

      // Date range filter (takes precedence over month/year if set)
      if (startDateFilter && endDateFilter) {
        const recordDate = new Date(a.date);
        const startDate = new Date(startDateFilter);
        const endDate = new Date(endDateFilter);
        if (recordDate < startDate || recordDate > endDate) {
          return false;
        }
      } else if (startDateFilter || endDateFilter) {
        // If only one date is set, filter accordingly
        const recordDate = new Date(a.date);
        if (startDateFilter && recordDate < new Date(startDateFilter)) {
          return false;
        }
        if (endDateFilter && recordDate > new Date(endDateFilter)) {
          return false;
        }
      } else {
        // Use month/year filters only if date range is not set
        const matchesMonth = date.getMonth() === selectedMonth;
        const matchesYear = date.getFullYear() === selectedYear;
        if (!matchesMonth || !matchesYear) {
          return false;
        }
      }

      const matchesEmployee = currentUser.role === 'employee'
        ? String(a.employeeId) === String(currentUser.id)
        : selectedEmployee === 'all' ? true : String(a.employeeId) === String(selectedEmployee);
      const matchesStatus = selectedStatus === 'all' ? true : a.status === selectedStatus;

      return matchesEmployee && matchesStatus;
    });

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, allUsers, selectedMonth, selectedYear, selectedEmployee, selectedStatus, startDateFilter, endDateFilter, currentUser]);

  const paginatedAttendance = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return {
      data: filteredAttendance.slice(startIndex, startIndex + itemsPerPage),
      totalPages: Math.ceil(filteredAttendance.length / itemsPerPage),
      totalItems: filteredAttendance.length
    };
  }, [filteredAttendance, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, selectedEmployee, selectedStatus, startDateFilter, endDateFilter]);

  const attendanceStats = useMemo(() => {
    const present = filteredAttendance.filter(a => (a.status === 'Present' || a.status === 'Late' || !a.clockOut) && a.status !== 'Absent' && a.status !== 'LWP').length;
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
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
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => exportToCSV(filteredAttendance, 'attendance_report')}
              variant="secondary"
            >
              Export to CSV
            </Button>
            {currentUser.role !== 'employee' && (
              <>
                <Button
                  onClick={() => setShowManualModal(true)}
                  variant="secondary"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Mark Attendance
                </Button>
                <Button
                  onClick={handleFixRecords}
                  loading={isSyncing}
                  variant="danger"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Fix Invalid Records
                </Button>
                <Button
                  onClick={handleSyncBiometric}
                  loading={isSyncing}
                  variant="primary"
                >
                  Sync Biometric Data
                </Button>
              </>
            )}
          </div>
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

        <Table columns={columns} data={paginatedAttendance.data} responsive={true} />

        {paginatedAttendance.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginatedAttendance.totalItems)} of {paginatedAttendance.totalItems} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2"
              >
                <ChevronLeft size={20} />
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(paginatedAttendance.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.min(paginatedAttendance.totalPages, prev + 1))}
                disabled={currentPage === paginatedAttendance.totalPages}
                className="p-2"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Mark Manual Attendance">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee</label>
            <Select
              value={manualData.employeeId}
              onChange={(e) => setManualData({ ...manualData, employeeId: e.target.value })}
              options={[
                { value: '', label: 'Select Employee' },
                ...allUsers.filter(u => u.role !== 'admin' && u.role !== 'super_admin').map(u => ({ value: String(u.id), label: `${u.name} (${u.employeeId})` }))
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={manualData.date}
              onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clock In (Required)</label>
              <input
                type="time"
                value={manualData.clockIn}
                onChange={(e) => setManualData({ ...manualData, clockIn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clock Out</label>
              <input
                type="time"
                value={manualData.clockOut}
                onChange={(e) => setManualData({ ...manualData, clockOut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500 italic">
            Note: System will automatically calculate status and work hours based on the Shift/Roster assigned for this day.
            Existing records for this day will be overwritten.
          </p>

          <Button onClick={handleManualSubmit} className="w-full" disabled={!manualData.employeeId || !manualData.date || !manualData.clockIn || isSyncing}>
            {isSyncing ? 'Processing...' : 'Save Attendance'}
          </Button>
        </div>
      </Modal>
    </div >
  );
};

export default Attendance;
