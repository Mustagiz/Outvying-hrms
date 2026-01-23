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
  // Applied Filters (used for data fetching)
  const [appliedFilters, setAppliedFilters] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    employee: currentUser.role === 'employee' ? String(currentUser.id) : 'all',
    status: 'all'
  });

  // UI State (inputs)
  const [localFilters, setLocalFilters] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
    employee: currentUser.role === 'employee' ? String(currentUser.id) : 'all',
    status: 'all'
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleApplyFilters = () => {
    setAppliedFilters(localFilters);
    setCurrentPage(1); // Reset to first page
  };

  // Manual Attendance State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({
    employeeIds: [],
    startDate: '',
    endDate: '',
    clockIn: '',
    clockOut: '',
    status: ''
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
    if (!manualData.employeeIds.length || !manualData.startDate || !manualData.endDate) {
      setAlert({ type: 'error', message: 'Please select Employees and Date Range' });
      return;
    }

    try {
      setIsSyncing(true);
      const { employeeIds, startDate, endDate, clockIn, clockOut } = manualData;

      // Calculate dates in range
      const dates = [];
      let currentDate = new Date(startDate);
      const end = new Date(endDate);
      while (currentDate <= end) {
        dates.push(new Date(currentDate).toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      let successCount = 0;

      for (const empId of employeeIds) {
        for (const date of dates) {
          const roster = rosters.find(r => String(r.employeeId) === String(empId) && r.date === date);

          // Calculate status
          let attendanceUpdate = {};

          if (clockIn) {
            // Check for midnight crossover
            let clockOutDate = date;
            if (clockOut && clockOut < clockIn) {
              const nextDay = new Date(date);
              nextDay.setDate(nextDay.getDate() + 1);
              clockOutDate = nextDay.toISOString().split('T')[0];
            }

            const result = calculateAttendanceStatus(clockIn, clockOut || null, date, roster);

            attendanceUpdate = {
              clockIn,
              clockOut: clockOut || null,
              clockOutDate: clockOut ? clockOutDate : null,
              status: manualData.status || result.status,
              workHours: result.workHours,
              workingDays: result.workingDays,
              overtime: result.overtime,
              ruleApplied: result.ruleApplied,
              manualEntry: true,
              updatedBy: currentUser.id,
              updatedAt: serverTimestamp()
            };
          } else if (manualData.status) {
            // Manual status only (Leaves etc)
            attendanceUpdate = {
              clockIn: null,
              clockOut: null,
              status: manualData.status,
              workHours: 0,
              workingDays: manualData.status === 'Present' ? 1 : (manualData.status === 'Half Day' ? 0.5 : 0),
              overtime: 0,
              ruleApplied: 'Manual Override',
              manualEntry: true,
              updatedBy: currentUser.id,
              updatedAt: serverTimestamp()
            };
          } else {
            continue;
          }

          // Update Firestore
          // Add timestamp to update
          attendanceUpdate.updatedAt = serverTimestamp();

          const q = query(
            collection(db, 'attendance'),
            where('employeeId', '==', empId),
            where('date', '==', date)
          );
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const firstDoc = snapshot.docs[0];
            await updateDoc(firstDoc.ref, attendanceUpdate);
            // Delete duplicates if any
            if (snapshot.docs.length > 1) {
              for (let i = 1; i < snapshot.docs.length; i++) {
                await deleteDoc(snapshot.docs[i].ref);
              }
            }
          } else {
            const newId = `${empId}-${date}`;
            await setDoc(doc(db, 'attendance', newId), {
              employeeId: empId,
              date,
              ...attendanceUpdate
            });
          }
          successCount++;
        }
      }

      setAlert({ type: 'success', message: `Successfully updated ${successCount} attendance records` });
      setShowManualModal(false);
      setManualData({ employeeIds: [], startDate: '', endDate: '', clockIn: '', clockOut: '', status: '' });
    } catch (error) {
      console.error(error);
      setAlert({ type: 'error', message: 'Manual update failed: ' + error.message });
    }
    setIsSyncing(false);
    setTimeout(() => setAlert(null), 3000);
  };

  const filteredAttendance = useMemo(() => {
    // 1. Get filtered attendance records
    const teamUserIds = new Set(
      allUsers
        .filter(u => currentUser.role === 'manager' ? u.reportingTo === currentUser.name : true)
        .map(u => String(u.id))
    );
    let records = attendance.filter(a => teamUserIds.has(String(a.employeeId)));
    const today = new Date().toISOString().split('T')[0];

    // Identify current date ranges for virtual calculation
    let start, end;
    if (appliedFilters.startDate && appliedFilters.endDate) {
      start = appliedFilters.startDate;
      end = appliedFilters.endDate;
    } else {
      const year = appliedFilters.year;
      const month = appliedFilters.month;
      start = new Date(year, month, 1).toISOString().split('T')[0];
      end = new Date(year, month + 1, 0).toISOString().split('T')[0];
    }

    // Don't show future absences
    if (end > today) end = today;

    // 2. Scan rosters to find missing entries
    // Filter rosters for the range and active employee filter
    const rangeRosters = rosters.filter(r => {
      const matchesDate = r.date >= start && r.date <= end;
      const matchesEmp = appliedFilters.employee === 'all'
        ? (currentUser.role === 'employee' ? String(r.employeeId) === String(currentUser.id) : true)
        : String(r.employeeId) === String(appliedFilters.employee);
      return matchesDate && matchesEmp;
    });

    // For each roster, if no attendance record exists, create a virtual one
    const virtualRecords = [];
    rangeRosters.forEach(roster => {
      const hasRecord = records.find(a => String(a.employeeId) === String(roster.employeeId) && a.date === roster.date);
      if (!hasRecord) {
        const result = calculateAttendanceStatus(null, null, roster.date, roster);
        virtualRecords.push({
          id: `virtual-${roster.employeeId}-${roster.date}`,
          employeeId: roster.employeeId,
          date: roster.date,
          status: result.status,
          workHours: 0,
          overtime: 0,
          workingDays: 0,
          ruleApplied: result.ruleApplied || 'Roster Assigned',
          isVirtual: true
        });
      }
    });

    const allRecords = [...records, ...virtualRecords];

    // 3. Filter allRecords (including virtual) by the search/selection criteria
    return allRecords.filter(a => {
      const date = new Date(a.date);

      // Date range filter
      if (appliedFilters.startDate && appliedFilters.endDate) {
        if (a.date < appliedFilters.startDate || a.date > appliedFilters.endDate) return false;
      } else {
        const matchesMonth = date.getMonth() === appliedFilters.month;
        const matchesYear = date.getFullYear() === appliedFilters.year;
        if (!matchesMonth || !matchesYear) return false;
      }

      const matchesEmployee = currentUser.role === 'employee'
        ? String(a.employeeId) === String(currentUser.id)
        : appliedFilters.employee === 'all'
          ? (currentUser.role === 'manager' ? teamUserIds.has(String(a.employeeId)) : true)
          : String(a.employeeId) === String(appliedFilters.employee);

      const matchesStatus = appliedFilters.status === 'all' ? true : a.status === appliedFilters.status;

      return matchesEmployee && matchesStatus;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, rosters, allUsers, appliedFilters, currentUser]);

  // Page Safety: Reset if current page is out of bounds
  useEffect(() => {
    const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredAttendance.length, currentPage]);

  const paginatedAttendance = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return {
      data: filteredAttendance.slice(startIndex, startIndex + itemsPerPage),
      totalPages: Math.ceil(filteredAttendance.length / itemsPerPage),
      totalItems: filteredAttendance.length
    };
  }, [filteredAttendance, currentPage]);



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
            {currentUser.role === 'manager' && (
              <>
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
              </>
            )}

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
          <div className="flex flex-wrap gap-4 mb-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={localFilters.startDate}
                onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={localFilters.endDate}
                onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <Select
              label="Month"
              value={localFilters.month}
              onChange={(e) => setLocalFilters({ ...localFilters, month: parseInt(e.target.value) })}
              options={monthOptions}
            />
            <Select
              label="Year"
              value={localFilters.year}
              onChange={(e) => setLocalFilters({ ...localFilters, year: parseInt(e.target.value) })}
              options={yearOptions}
            />
            {currentUser.role !== 'employee' && (
              <>
                <Select
                  label="Employee"
                  value={localFilters.employee}
                  onChange={(e) => setLocalFilters({ ...localFilters, employee: e.target.value })}
                  options={employeeOptions}
                />
                <Select
                  label="Status"
                  value={localFilters.status}
                  onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                  options={statusOptions}
                />
              </>
            )}
            <Button
              onClick={handleApplyFilters}
              variant="primary"
              className="mb-[2px]" // align with inputs
            >
              Apply Filters
            </Button>
          </div>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => {
                const csvData = filteredAttendance.map(a => {
                  const user = allUsers.find(u => String(u.id) === String(a.employeeId));
                  return {
                    Date: formatDate(a.date),
                    'Employee Name': user?.name || 'Unknown',
                    'Employee ID': user?.employeeId || 'N/A',
                    'Clock In': a.clockIn || 'N/A',
                    'Clock Out': a.clockOut || 'N/A',
                    'Work Hours': `${a.workHours || 0}h`,
                    'Overtime': `${a.overtime || 0}h`,
                    Status: a.status,
                    'Rule Applied': a.ruleApplied || 'Standard'
                  };
                });
                exportToCSV(csvData, 'attendance_report');
              }}
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
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-4 py-4 gap-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-lg overflow-hidden">
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">
              Showing <span className="text-gray-900 dark:text-white font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-gray-900 dark:text-white font-bold">{Math.min(currentPage * itemsPerPage, paginatedAttendance.totalItems)}</span> of <span className="text-gray-900 dark:text-white font-bold">{paginatedAttendance.totalItems}</span> entries
            </div>

            <div className="flex items-center gap-2 overflow-x-auto max-w-full no-scrollbar pb-1 sm:pb-0">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 px-2 h-9 min-w-[36px] flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-all font-bold"
              >
                <ChevronLeft size={18} />
              </Button>

              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const total = paginatedAttendance.totalPages;
                  const current = currentPage;

                  if (total <= 7) {
                    for (let i = 1; i <= total; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (current > 3) pages.push('...');

                    let start = Math.max(2, current - 1);
                    let end = Math.min(total - 1, current + 1);

                    if (current <= 3) end = 4;
                    if (current >= total - 2) start = total - 3;

                    for (let i = start; i <= end; i++) pages.push(i);

                    if (current < total - 2) pages.push('...');
                    pages.push(total);
                  }

                  return pages.map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={typeof page !== 'number'}
                      className={`min-w-[36px] h-9 px-2 rounded-md text-sm font-bold transition-all transform active:scale-95 ${currentPage === page
                        ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-500 ring-offset-1 dark:ring-offset-gray-800'
                        : typeof page === 'number'
                          ? 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
                          : 'text-gray-400 cursor-default px-1 min-w-[20px]'
                        }`}
                    >
                      {page}
                    </button>
                  ));
                })()}
              </div>

              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.min(paginatedAttendance.totalPages, prev + 1))}
                disabled={currentPage === paginatedAttendance.totalPages}
                className="p-1 px-2 h-9 min-w-[36px] flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-all font-bold"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Mark Manual Attendance (Bulk)">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employees</label>
            <select
              multiple
              value={manualData.employeeIds}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setManualData({ ...manualData, employeeIds: selectedOptions });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-32"
            >
              {allUsers.filter(u => u.role !== 'admin' && u.role !== 'super_admin')
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(u => (
                  <option key={u.id} value={String(u.id)}>
                    {u.name} ({u.employeeId})
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple employees</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={manualData.startDate}
                onChange={(e) => setManualData({ ...manualData, startDate: e.target.value })}
                max={today}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                value={manualData.endDate}
                onChange={(e) => setManualData({ ...manualData, endDate: e.target.value })}
                max={today}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status (Optional)</label>
            <select
              value={manualData.status}
              onChange={(e) => setManualData({ ...manualData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Auto Calculate</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Absent">Absent</option>
              <option value="LWP">LWP (Leave Without Pay)</option>
              <option value="PL">PL (Paid Leave)</option>
              <option value="UPL">UPL (Unplanned Leave)</option>
            </select>
          </div>

          {!['PL', 'UPL', 'LWP', 'Absent'].includes(manualData.status) && (
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
          )}

          <p className="text-xs text-gray-500 italic">
            Note: System will automatically calculate status and work hours based on the Shift/Roster assigned for this day.
            Existing records for this day will be overwritten.
          </p>

          <Button
            onClick={handleManualSubmit}
            className="w-full"
            disabled={
              !manualData.employeeIds.length ||
              !manualData.startDate ||
              !manualData.endDate ||
              (!manualData.clockIn && !['PL', 'UPL', 'LWP', 'Absent'].includes(manualData.status)) ||
              isSyncing
            }
          >
            {isSyncing ? 'Processing...' : 'Save Attendance'}
          </Button>
        </div>
      </Modal>
    </div >
  );
};

export default Attendance;
