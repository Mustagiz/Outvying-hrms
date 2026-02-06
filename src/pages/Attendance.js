import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Alert, Select, Modal } from '../components/UI';
import { Clock, Calendar, ChevronLeft, ChevronRight, TrendingUp, Search, Download, RefreshCw, FilePlus, Wrench, RotateCcw, Upload } from 'lucide-react';
import { formatDate, getStatusColor, exportToCSV, getYearOptions, getTodayLocal } from '../utils/helpers';

import { calculateAttendanceStatus } from '../utils/biometricSync';
import { doc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const Attendance = () => {
  const { currentUser, attendance, rosters, clockIn, clockOut, syncBiometric, allUsers, attendanceRules, leaves } = useAuth();
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Stats Date Filter (for the cards)
  const today = getTodayLocal();
  const [statsDate, setStatsDate] = useState(today);

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

  const handleClearFilters = () => {
    const freshFilters = {
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      startDate: '',
      endDate: '',
      employee: currentUser.role === 'employee' ? String(currentUser.id) : 'all',
      status: 'all'
    };
    setLocalFilters(freshFilters);
    setAppliedFilters(freshFilters);
    setCurrentPage(1);
  };

  // Manual Attendance State
  const [showManualModal, setShowManualModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [manualData, setManualData] = useState({
    employeeIds: [],
    startDate: '',
    endDate: '',
    clockIn: '',
    clockOut: '',
    status: ''
  });

  const activeAttendance = useMemo(() => {
    const todayDate = getTodayLocal();
    const todayRecord = attendance.find(a => String(a.employeeId) === String(currentUser.id) && a.date === todayDate);

    // 1. Prefer today's record if it has an open session
    if (todayRecord) {
      const sessions = todayRecord.sessions || [];
      if (sessions.length > 0 && !sessions[sessions.length - 1].out) {
        return todayRecord;
      }
    }

    // 2. Otherwise look for ANY open session (Logical priority for cross-midnight)
    const anyOpen = attendance.find(a =>
      String(a.employeeId) === String(currentUser.id) &&
      a.sessions &&
      a.sessions.length > 0 &&
      !a.sessions[a.sessions.length - 1].out
    );
    if (anyOpen) return anyOpen;

    // 3. Fallback to today's completed record
    return todayRecord;
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

  const handleSyncBiometric = async () => {
    setIsSyncing(true);
    const result = await syncBiometric();
    setIsSyncing(false);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleFixRecords = async () => {
    if (!window.confirm("This will fix ALL rosters AND attendance records. This will:\n1. Update all rosters to IST timezone\n2. Set grace period to 5 mins\n3. Recalculate all attendance\n\nProceed?")) return;
    setIsSyncing(true);
    let rosterCount = 0;
    let attendanceCount = 0;

    try {
      // STEP 1: Fix ALL rosters in database first
      const rostersRef = collection(db, 'rosters');
      const rostersSnap = await getDocs(rostersRef);

      for (const rosterDoc of rostersSnap.docs) {
        const rosterData = rosterDoc.data();
        const needsUpdate = rosterData.timezone !== 'Asia/Kolkata' || Number(rosterData.gracePeriod || 0) >= 10;

        if (needsUpdate) {
          await updateDoc(rosterDoc.ref, {
            timezone: 'Asia/Kolkata',
            gracePeriod: 5,
            updatedAt: serverTimestamp()
          });
          rosterCount++;
        }
      }

      // STEP 2: Update default Attendance Rule
      const rulesRef = collection(db, 'attendanceRules');
      const rulesSnap = await getDocs(query(rulesRef, where('isDefault', '==', true)));
      if (!rulesSnap.empty) {
        const defaultRuleDoc = rulesSnap.docs[0];
        if (defaultRuleDoc.data().gracePeriodMins > 5) {
          await updateDoc(defaultRuleDoc.ref, { gracePeriodMins: 5, updatedAt: serverTimestamp() });
        }
      }

      // STEP 3: Recalculate all attendance records with FRESH roster data
      const recordsToScan = attendance.filter(a => a.clockIn);
      for (const record of recordsToScan) {
        // Find roster with IST timezone (should be updated now)
        const roster = rosters.find(r => String(r.employeeId) === String(record.employeeId) && r.date === record.date);

        // Force IST and 5 mins for calculation
        const effectiveRoster = roster ? {
          ...roster,
          gracePeriod: 5,
          timezone: 'Asia/Kolkata'
        } : null;

        const result = calculateAttendanceStatus(record.clockIn, record.clockOut, record.date, effectiveRoster, attendanceRules);

        const ref = doc(db, 'attendance', record.id);
        await updateDoc(ref, {
          workHours: result.workHours,
          workingDays: result.workingDays,
          overtime: result.overtime,
          status: result.status,
          ruleApplied: result.ruleApplied
        });
        attendanceCount++;
      }

      setAlert({
        type: 'success',
        message: `✅ Fixed ${rosterCount} rosters + ${attendanceCount} attendance records. Please refresh the page!`
      });
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Fix failed: ' + err.message });
    }
    setIsSyncing(false);
    setTimeout(() => setAlert(null), 10000);
  };

  const handleManualSubmit = async () => {
    if (!manualData.employeeIds.length || !manualData.startDate || !manualData.endDate) {
      setAlert({ type: 'error', message: 'Please select Employees and Date Range' });
      return;
    }

    try {
      setIsSyncing(true);
      const { employeeIds, startDate, endDate, clockIn, clockOut } = manualData;
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
          let attendanceUpdate = {};

          if (clockIn) {
            let clockOutDate = date;
            if (clockOut && clockOut < clockIn) {
              const nextDay = new Date(date);
              nextDay.setDate(nextDay.getDate() + 1);
              clockOutDate = nextDay.toISOString().split('T')[0];
            }
            const result = calculateAttendanceStatus(clockIn, clockOut || null, date, roster, attendanceRules);
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

          const q = query(
            collection(db, 'attendance'),
            where('employeeId', '==', empId),
            where('date', '==', date)
          );
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const firstDoc = snapshot.docs[0];
            await updateDoc(firstDoc.ref, attendanceUpdate);
            if (snapshot.docs.length > 1) {
              for (let i = 1; i < snapshot.docs.length; i++) {
                await deleteDoc(snapshot.docs[i].ref);
              }
            }
          } else {
            const newId = `${empId}_${date}`;
            await setDoc(doc(db, 'attendance', newId), {
              employeeId: empId,
              date,
              ...attendanceUpdate
            });
          }
          successCount++;
        }
      }

      setAlert({ type: 'success', message: `Successfully updated ${successCount} records` });
      setShowManualModal(false);
      setManualData({ employeeIds: [], startDate: '', endDate: '', clockIn: '', clockOut: '', status: '' });
    } catch (error) {
      console.error(error);
      setAlert({ type: 'error', message: 'Update failed: ' + error.message });
    }
    setIsSyncing(false);
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDownloadTemplate = () => {
    const headers = ['employee_id', 'date', 'clock_in', 'clock_out'];
    const sampleData = [
      { employee_id: 'EMP101', date: '2026-01-24', clock_in: '09:00', clock_out: '18:00' },
      { employee_id: 'EMP102', date: '2026-01-24', clock_in: '10:00', clock_out: '19:30' }
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => `${row.employee_id},${row.date},${row.clock_in},${row.clock_out}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsSyncing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) throw new Error("File is empty or missing headers");

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const dataLines = lines.slice(1);

        let successCount = 0;
        let errorCount = 0;

        for (const line of dataLines) {
          const values = line.split(',').map(v => v.trim());
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });

          const { employee_id, date, clock_in, clock_out } = row;
          if (!employee_id || !date || !clock_in) {
            errorCount++;
            continue;
          }

          // Find user by employeeId String field (not Firestore internal ID/UID)
          const user = allUsers.find(u => String(u.employeeId) === String(employee_id));
          if (!user) {
            errorCount++;
            continue;
          }

          const empId = user.id; // Internal UID for document naming
          const roster = rosters.find(r => String(r.employeeId) === String(empId) && r.date === date);

          const result = calculateAttendanceStatus(clock_in, clock_out || null, date, roster, attendanceRules);

          let clockOutDate = date;
          if (clock_out && clock_out < clock_in) {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            clockOutDate = nextDay.toISOString().split('T')[0];
          }

          const attendanceUpdate = {
            employeeId: empId,
            date,
            clockIn: clock_in,
            clockOut: clock_out || null,
            clockOutDate: clock_out ? clockOutDate : null,
            status: result.status,
            workHours: result.workHours,
            workingDays: result.workingDays,
            overtime: result.overtime,
            ruleApplied: result.ruleApplied,
            manualEntry: true,
            updatedBy: currentUser.id,
            updatedAt: serverTimestamp()
          };

          const docId = `${empId}_${date}`;
          await setDoc(doc(db, 'attendance', docId), attendanceUpdate, { merge: true });
          successCount++;
        }

        setAlert({
          type: errorCount > 0 ? 'warning' : 'success',
          message: `Import complete: ${successCount} success, ${errorCount} failed.`
        });
        setShowBulkModal(false);
      } catch (error) {
        console.error("Bulk upload error:", error);
        setAlert({ type: 'error', message: 'Failed: ' + error.message });
      } finally {
        setIsSyncing(false);
        setTimeout(() => setAlert(null), 5000);
      }
    };
    reader.onerror = () => {
      setAlert({ type: 'error', message: 'Error reading file.' });
      setIsSyncing(false);
    };
    reader.readAsText(file);
    // Reset input so same file can be uploaded again if needed
    event.target.value = '';
  };

  const filteredAttendance = useMemo(() => {
    const role = (currentUser.role || '').toLowerCase();
    const teamUserIds = new Set();
    allUsers.forEach(u => {
      const isSelf = String(u.id) === String(currentUser.id);
      const isReport = role === 'manager' && (u.reportingTo || '').toLowerCase().trim() === (currentUser.name || '').toLowerCase().trim();

      if (isSelf || isReport || (role !== 'employee' && role !== 'manager')) {
        if (u.id) teamUserIds.add(String(u.id));
        if (u.employeeId) teamUserIds.add(String(u.employeeId));
      }
    });

    let records = attendance.filter(a => teamUserIds.has(String(a.employeeId)));
    const today = new Date().toISOString().split('T')[0];

    let start, end;
    if (appliedFilters.startDate && appliedFilters.endDate) {
      start = appliedFilters.startDate;
      end = appliedFilters.endDate;
    } else {
      start = new Date(appliedFilters.year, appliedFilters.month, 1).toISOString().split('T')[0];
      end = new Date(appliedFilters.year, appliedFilters.month + 1, 0).toISOString().split('T')[0];
    }
    if (end > today) end = today;

    const rangeRosters = rosters.filter(r => {
      const matchesDate = r.date >= start && r.date <= end;
      const matchesEmp = appliedFilters.employee === 'all'
        ? (currentUser.role === 'employee' ? String(r.employeeId) === String(currentUser.id) : true)
        : String(r.employeeId) === String(appliedFilters.employee);
      return matchesDate && matchesEmp;
    });

    const virtualRecords = [];
    rangeRosters.forEach(roster => {
      const hasRecord = records.find(a => String(a.employeeId) === String(roster.employeeId) && a.date === roster.date);
      if (!hasRecord) {
        const result = calculateAttendanceStatus(null, null, roster.date, roster, attendanceRules);
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

    return [...records, ...virtualRecords].filter(a => {
      const date = new Date(a.date);
      if (appliedFilters.startDate && appliedFilters.endDate) {
        if (a.date < appliedFilters.startDate || a.date > appliedFilters.endDate) return false;
      } else {
        if (date.getMonth() !== appliedFilters.month || date.getFullYear() !== appliedFilters.year) return false;
      }
      const matchesEmployee = (role === 'employee' || !appliedFilters.employee || appliedFilters.employee === 'all')
        ? (role === 'employee' ? String(a.employeeId) === String(currentUser.id) : teamUserIds.has(String(a.employeeId)))
        : String(a.employeeId) === String(appliedFilters.employee);
      const matchesStatus = appliedFilters.status === 'all' ? true : a.status === appliedFilters.status;
      return matchesEmployee && matchesStatus;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, rosters, allUsers, appliedFilters, currentUser]);

  useEffect(() => {
    const totalPages = Math.ceil(filteredAttendance.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(1);
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
    // 1. Get relevant employees based on role (Same scope as the table)
    const role = (currentUser.role || '').toLowerCase().trim();
    const relevantEmpIds = new Set();

    allUsers.forEach(u => {
      // 1a. Filter out deleted users
      if (u.isDeleted) return;

      const isEmployee = u.role === 'employee' || u.role === 'hr' || u.role === 'manager';
      if (!isEmployee) return;

      const isSelf = String(u.id) === String(currentUser.id);
      const isReport = role === 'manager' && (u.reportingTo || '').toLowerCase().trim() === (currentUser.name || '').toLowerCase().trim();

      if (role === 'employee') {
        if (isSelf) {
          if (u.id) relevantEmpIds.add(String(u.id));
          if (u.employeeId) relevantEmpIds.add(String(u.employeeId));
        }
      } else if (role === 'manager') {
        if (isSelf || isReport) {
          if (u.id) relevantEmpIds.add(String(u.id));
          if (u.employeeId) relevantEmpIds.add(String(u.employeeId));
        }
      } else {
        // Admin/HR
        if (u.id) relevantEmpIds.add(String(u.id));
        if (u.employeeId) relevantEmpIds.add(String(u.employeeId));
      }
    });

    // 2. Filter and deduplicate attendance records for the selected stats date
    // (Deduplication prevents double-counting if an employee has two records for same date)
    const dailyRecordsMap = new Map();
    attendance.forEach(a => {
      if (a.date === statsDate && relevantEmpIds.has(String(a.employeeId))) {
        // Get canonical ID (UID) for deduplication
        const user = allUsers.find(u => String(u.id) === String(a.employeeId) || String(u.employeeId) === String(a.employeeId));
        const canonicalId = user ? String(user.id) : String(a.employeeId);

        // If multiple records, prefer the one that is NOT virtual or has an actual clock-in
        if (!dailyRecordsMap.has(canonicalId) || (!a.isVirtual && dailyRecordsMap.get(canonicalId).isVirtual)) {
          dailyRecordsMap.set(canonicalId, a);
        }
      }
    });
    const dailyRecords = Array.from(dailyRecordsMap.values());

    // 3. Find who HAS rosters for today (to identify expected attendance)
    // 3. Find who HAS rosters for today (to identify expected attendance)
    // Deduplicate by employee to avoid double counting if duplicate rosters exist
    const dailyRostersMap = new Map();
    rosters.forEach(r => {
      if (r.date === statsDate && relevantEmpIds.has(String(r.employeeId))) {
        const hasWorkingHours = r.fullDayHours > 0 || (r.shiftName !== 'Weekly Off' && r.shiftName !== 'Holiday');
        if (hasWorkingHours) {
          const empId = String(r.employeeId);
          if (!dailyRostersMap.has(empId)) {
            dailyRostersMap.set(empId, r);
          }
        }
      }
    });
    const dailyRosters = Array.from(dailyRostersMap.values());

    // 4. Calculate stats
    const presentOnly = dailyRecords.filter(a => a.status === 'Present').length;
    const late = dailyRecords.filter(a => a.status === 'Late').length;
    const halfDay = dailyRecords.filter(a => a.status === 'Half Day').length;
    const lwp = dailyRecords.filter(a => a.status === 'LWP').length;

    // Identify Absent: People who are expected (have roster) but have no non-virtual record OR record status is 'Absent'
    const absentCount = dailyRosters.filter(r => {
      const user = allUsers.find(u => String(u.id) === String(r.employeeId) || String(u.employeeId) === String(r.employeeId));
      const canonicalId = user ? String(user.id) : String(r.employeeId);

      // Check if employee has an approved leave for this date
      const onLeave = leaves.find(l =>
        (String(l.employeeId) === String(user?.id) || String(l.employeeId) === String(user?.employeeId)) &&
        l.status === 'Approved' &&
        l.startDate <= statsDate &&
        l.endDate >= statsDate
      );

      if (onLeave) return false; // Not absent if on approved leave

      const record = dailyRecordsMap.get(canonicalId);
      return !record || record.isVirtual || record.status === 'Absent';
    }).length;

    const totalHours = dailyRecords.reduce((sum, a) => sum + parseFloat(a.workHours || 0), 0);
    const totalOvertime = dailyRecords.reduce((sum, a) => sum + parseFloat(a.overtime || 0), 0);
    const workingDays = dailyRecords.reduce((sum, a) => sum + parseFloat(a.workingDays || 0), 0);

    return {
      present: presentOnly + late,
      late,
      halfDay,
      lwp: lwp + absentCount,
      totalHours: totalHours.toFixed(1),
      totalOvertime: totalOvertime.toFixed(1),
      workingDays: workingDays.toFixed(1),
      isPersonal: role === 'employee'
    };
  }, [attendance, statsDate, allUsers, rosters, currentUser, leaves]);

  const columns = [
    { header: 'Date', accessor: 'date', render: (row) => formatDate(row.date) },
    ...(currentUser.role !== 'employee' ? [
      {
        header: 'Emp ID',
        accessor: 'employeeId',
        render: (row) => allUsers.find(u => String(u.id) === String(row.employeeId) || String(u.employeeId) === String(row.employeeId))?.employeeId || row.employeeId || 'N/A'
      },
      {
        header: 'Employee',
        accessor: 'employeeId',
        render: (row) => allUsers.find(u => String(u.id) === String(row.employeeId) || String(u.employeeId) === String(row.employeeId))?.name || 'Unknown'
      }
    ] : []),
    { header: 'Clock In', accessor: 'clockIn', render: (row) => row.clockIn || 'N/A' },
    { header: 'Clock Out', accessor: 'clockOut', render: (row) => row.clockOut || 'N/A' },
    { header: 'Work Hours', accessor: 'workHours', render: (row) => `${row.workHours || 0}h` },
    { header: 'Overtime', accessor: 'overtime', render: (row) => `${parseFloat(row.overtime || 0).toFixed(2)}h` },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    { header: 'Rule Applied', accessor: 'ruleApplied', render: (row) => row.ruleApplied || 'Standard Office' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {currentUser.role === 'employee' && (
            <Button
              onClick={() => navigate('/attendance-regularization', { state: { date: row.date } })}
              variant="secondary"
              className="text-xs py-1 px-3 bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
            >
              Apply
            </Button>
          )}
          {currentUser.role !== 'employee' && <span className="text-gray-400">-</span>}
        </div>
      )
    }
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
    ...allUsers.filter(u => {
      const role = (currentUser.role || '').toLowerCase();
      if (role === 'manager') {
        // Show direct reports + self
        return (u.reportingTo || '').toLowerCase() === (currentUser.name || '').toLowerCase() || String(u.id) === String(currentUser.id);
      }
      // Admins/HR see everyone with an employee role (or all registered if needed, but keeping existing filter)
      return true;
    }).map(u => ({ value: String(u.id), label: u.name }))
  ];
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'Present', label: 'Present' },
    { value: 'Late', label: 'Late' },
    { value: 'Half Day', label: 'Half Day' },
    { value: 'LWP', label: 'LWP' }
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Attendance Management</h1>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className={`grid grid-cols-1 ${currentUser.role === 'manager' ? 'md:grid-cols-2' : ''} gap-6 mb-6 transition-all duration-300`}>
        {currentUser.role === 'manager' && (
          <Card title="Today's Attendance" className="h-full border-primary-100 dark:border-primary-900/30">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 underline uppercase tracking-wider">Clock In</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {activeAttendance?.clockIn || 'Not clocked in'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleClockIn}
                  disabled={activeAttendance?.sessions?.length > 0 && !activeAttendance.sessions[activeAttendance.sessions.length - 1].out}
                  className="shadow-sm"
                >
                  Clock In
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 underline uppercase tracking-wider">Clock Out</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">
                      {activeAttendance?.clockOut || 'Not clocked out'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleClockOut}
                  disabled={!(activeAttendance?.sessions?.length > 0 && !activeAttendance.sessions[activeAttendance.sessions.length - 1].out)}
                  variant="secondary"
                  className="shadow-sm"
                >
                  Clock Out
                </Button>
              </div>

              {activeAttendance && (
                <div className="p-4 bg-gradient-to-r from-primary-500/10 to-transparent border-l-4 border-primary-500 rounded-lg shadow-sm">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Today's Status</p>
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${getStatusColor(activeAttendance.status)}`}>
                    {activeAttendance.status}
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card title="Daily Attendance Statistics" className={`${currentUser.role !== 'manager' ? 'w-full' : ''} border-gray-100 dark:border-gray-800/50`}>
          {/* Date Filter for Stats */}
          <div className="mb-4 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">View Stats for:</label>
            <input
              type="date"
              value={statsDate}
              max={today}
              onChange={(e) => setStatsDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <button
              onClick={() => setStatsDate(today)}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors"
            >
              Today
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Showing data for: <span className="font-bold text-gray-700 dark:text-white">{formatDate(statsDate)}</span>
            </span>
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${currentUser.role !== 'manager' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-4`}>
            {currentUser.role !== 'employee' && (
              <div className="group p-5 bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-800 rounded-2xl border border-green-100 dark:border-green-900/30 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-green-700 uppercase tracking-widest">Present</p>
                  <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg text-green-600">
                    <Calendar size={20} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-green-700 dark:text-green-300">{attendanceStats.present}</p>
                <p className="text-[10px] text-green-600/60 mt-1 italic">Employees present today</p>
              </div>
            )}

            {currentUser.role !== 'employee' && (
              <div className="group p-5 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/10 dark:to-gray-800 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest">Late</p>
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg text-yellow-600">
                    <Clock size={20} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-yellow-700 dark:text-yellow-300">{attendanceStats.late}</p>
                <p className="text-[10px] text-yellow-600/60 mt-1 italic">Late arrivals today</p>
              </div>
            )}

            {currentUser.role !== 'employee' && (
              <div className="group p-5 bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-gray-800 rounded-2xl border border-orange-100 dark:border-orange-900/30 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-orange-700 uppercase tracking-widest">Half Days</p>
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/40 rounded-lg text-orange-600">
                    <Calendar size={20} />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-orange-700 dark:text-orange-300">{attendanceStats.halfDay}</p>
                <p className="text-[10px] text-orange-600/60 mt-1 italic">Half day attendance</p>
              </div>
            )}

            <div className="group p-5 bg-gradient-to-br from-red-50 to-white dark:from-red-900/10 dark:to-gray-800 rounded-2xl border border-red-100 dark:border-red-900/30 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-red-700 uppercase tracking-widest">LWP / Absent</p>
                <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg text-red-600">
                  <Calendar size={20} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-red-700 dark:text-red-300">{attendanceStats.lwp}</p>
              <p className="text-[10px] text-red-600/60 mt-1 italic">
                {attendanceStats.isPersonal ? 'Your absence/LWP status' : 'Leave without pay today'}
              </p>
            </div>

            <div className="group p-5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800 rounded-2xl border border-blue-100 dark:border-blue-900/30 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">Total Hours</p>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600">
                  <Clock size={20} />
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-extrabold text-blue-700 dark:text-blue-300">{attendanceStats.totalHours}</p>
                <span className="text-xs font-bold text-blue-500/60">HRS</span>
              </div>
              <p className="text-[10px] text-blue-600/60 mt-1 italic">
                {attendanceStats.isPersonal ? 'Your total work hours' : 'Total hours worked today'}
              </p>
            </div>

            <div className="group p-5 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/10 dark:to-gray-800 rounded-2xl border border-purple-100 dark:border-purple-900/30 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-purple-700 uppercase tracking-widest">Salary Days</p>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600">
                  <TrendingUp size={20} />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-purple-700 dark:text-purple-300">{attendanceStats.workingDays}</p>
              <p className="text-[10px] text-purple-600/60 mt-1 italic">
                {attendanceStats.isPersonal ? 'Your billable days' : 'Billable days count'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6 mt-10">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white px-1">Attendance History Records</h2>
        <div className="space-y-6 bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800/50">
          <div className="p-5 bg-gray-50/50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800/50">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest pl-1">Start Date</label>
                  <input
                    type="date"
                    value={localFilters.startDate}
                    onChange={(e) => setLocalFilters({ ...localFilters, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest pl-1">End Date</label>
                  <input
                    type="date"
                    value={localFilters.endDate}
                    onChange={(e) => setLocalFilters({ ...localFilters, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Month Selection"
                  value={localFilters.month}
                  onChange={(e) => setLocalFilters({ ...localFilters, month: parseInt(e.target.value) })}
                  options={monthOptions}
                />
                <Select
                  label="Year Selection"
                  value={localFilters.year}
                  onChange={(e) => setLocalFilters({ ...localFilters, year: parseInt(e.target.value) })}
                  options={yearOptions}
                />
              </div>

              {currentUser.role !== 'employee' && (
                <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-gray-100/50 dark:bg-black/20 p-4 rounded-xl">
                  <Select
                    label="Search Employee"
                    value={localFilters.employee}
                    onChange={(e) => setLocalFilters({ ...localFilters, employee: e.target.value })}
                    options={employeeOptions}
                  />
                  <Select
                    label="Filter Status"
                    value={localFilters.status}
                    onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value })}
                    options={statusOptions}
                  />
                  <div className="flex gap-2 mb-4">
                    <Button onClick={handleApplyFilters} variant="primary" className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl shadow-lg">
                      <Search size={18} /> Apply
                    </Button>
                    <Button onClick={handleClearFilters} variant="secondary" className="flex items-center justify-center gap-2 py-2.5 rounded-xl border-gray-200">
                      <RotateCcw size={18} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
            <Button
              onClick={() => {
                const csvData = filteredAttendance.map(a => {
                  const user = allUsers.find(u => String(u.id) === String(a.employeeId));
                  return {
                    Date: a.date,
                    'Emp ID': user?.employeeId || 'N/A',
                    'Employee Name': user?.name || 'Unknown',
                    'Clock In': a.clockIn || 'P',
                    'Clock Out': a.clockOut || 'P',
                    Status: a.status,
                    'Work Hours': a.workHours || 0
                  };
                });
                exportToCSV(csvData, 'attendance_report');
              }}
              variant="secondary"
              className="flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider"
            >
              <Download size={16} /> Export CSV
            </Button>


            {currentUser.role !== 'employee' && (
              <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                <Button onClick={() => setShowBulkModal(true)} variant="secondary" className="bg-emerald-50 border-emerald-100 text-emerald-700 flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider">
                  <Upload size={16} /> Bulk Upload
                </Button>
                <Button onClick={() => setShowManualModal(true)} variant="secondary" className="bg-indigo-50 border-indigo-100 text-indigo-700 flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider">
                  <FilePlus size={16} /> Mark Attendance
                </Button>
                <Button onClick={handleFixRecords} loading={isSyncing} variant="secondary" className="bg-red-50 border-red-100 text-red-700 flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider">
                  <Wrench size={16} /> Fix Records
                </Button>
                <Button onClick={handleSyncBiometric} loading={isSyncing} variant="primary" className="flex items-center gap-2 py-2 text-xs font-bold uppercase tracking-wider shadow-md shadow-primary-500/10">
                  <RefreshCw size={16} className={`${isSyncing ? 'animate-spin' : ''}`} /> Sync Biometric
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
            <Table columns={columns} data={paginatedAttendance.data} responsive={true} />

            {paginatedAttendance.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4 border-t border-gray-100 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                  Showing <span className="text-gray-900 dark:text-white font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="text-gray-900 dark:text-white font-bold">{Math.min(currentPage * itemsPerPage, paginatedAttendance.totalItems)}</span> of <span className="text-gray-900 dark:text-white font-bold">{paginatedAttendance.totalItems}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="secondary" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-1 px-2 h-8 min-w-[32px] flex items-center justify-center rounded-lg border border-gray-200">
                    <ChevronLeft size={16} />
                  </Button>
                  <div className="flex items-center gap-1">
                    {/* Simplified pagination view for cleanliness */}
                    {[...Array(paginatedAttendance.totalPages)].map((_, i) => (
                      (i + 1 === 1 || i + 1 === paginatedAttendance.totalPages || Math.abs(i + 1 - currentPage) <= 1) && (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`min-w-[32px] h-8 px-2 rounded-lg text-[11px] font-black transition-all ${currentPage === i + 1 ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'text-gray-500 hover:bg-white dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'}`}
                        >
                          {i + 1}
                        </button>
                      )
                    ))}
                  </div>
                  <Button variant="secondary" onClick={() => setCurrentPage(prev => Math.min(paginatedAttendance.totalPages, prev + 1))} disabled={currentPage === paginatedAttendance.totalPages} className="p-1 px-2 h-8 min-w-[32px] flex items-center justify-center rounded-lg border border-gray-200">
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input type="date" value={manualData.startDate} onChange={(e) => setManualData({ ...manualData, startDate: e.target.value })} max={today} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input type="date" value={manualData.endDate} onChange={(e) => setManualData({ ...manualData, endDate: e.target.value })} max={today} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status (Optional)</label>
            <select value={manualData.status} onChange={(e) => setManualData({ ...manualData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
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
                <input type="time" value={manualData.clockIn} onChange={(e) => setManualData({ ...manualData, clockIn: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clock Out</label>
                <input type="time" value={manualData.clockOut} onChange={(e) => setManualData({ ...manualData, clockOut: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" />
              </div>
            </div>
          )}

          <Button onClick={handleManualSubmit} className="w-full" disabled={!manualData.employeeIds.length || !manualData.startDate || !manualData.endDate || (!manualData.clockIn && !['PL', 'UPL', 'LWP', 'Absent'].includes(manualData.status)) || isSyncing}>
            {isSyncing ? 'Processing...' : 'Save Attendance'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Attendance Upload">
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
            <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide">Instructions</h3>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-disc ml-4">
              <li>Use the provided CSV template for best results.</li>
              <li>Required columns: <code className="font-bold">employee_id</code>, <code className="font-bold">date</code>, <code className="font-bold">clock_in</code>.</li>
              <li>Date format: <code className="font-bold">YYYY-MM-DD</code> (e.g., 2026-01-24).</li>
              <li>Time format: <code className="font-bold">HH:MM</code> (24-hour, e.g., 09:30).</li>
            </ul>
          </div>

          <div className="relative flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:border-primary-500 transition-colors">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-full flex items-center justify-center mb-4">
              <Upload size={24} />
            </div>
            <p className="text-sm font-bold text-gray-700 dark:text-white mb-1">Upload CSV File</p>
            <p className="text-xs text-gray-500 mb-4">Click to browse or drag and drop</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleBulkUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title=""
            />
            <Button variant="primary" className="relative pointer-events-none">
              Select File
            </Button>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button onClick={handleDownloadTemplate} variant="secondary" className="text-xs font-bold uppercase tracking-wider">
              <Download size={14} className="mr-2" /> Download Template
            </Button>
            <Button onClick={() => setShowBulkModal(false)} variant="secondary" className="text-xs font-bold uppercase tracking-wider">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;
