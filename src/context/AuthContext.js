import React, { createContext, useContext, useState, useEffect } from 'react';
import { users, generateAttendanceData, generateLeaveData, leaveBalances, documents, bankAccounts } from '../data/mockData';
import { getFromLocalStorage, setToLocalStorage } from '../utils/helpers';
import { getCurrentIP, validateIP, logIPAccess, checkModuleAccess } from '../utils/ipValidation';
import { calculateAttendanceStatus } from '../utils/biometricSync';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [allLeaveBalances, setAllLeaveBalances] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [allBankAccounts, setAllBankAccounts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [rosters, setRosters] = useState([]);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);
  const [currentIP, setCurrentIP] = useState('127.0.0.1');
  const [ipValidation, setIpValidation] = useState({ allowed: true, location: 'Unrestricted' });

  useEffect(() => {
    const savedUser = getFromLocalStorage('currentUser');
    const savedUsers = getFromLocalStorage('users', users);
    const savedAttendance = getFromLocalStorage('attendance', generateAttendanceData());
    const savedLeaves = getFromLocalStorage('leaves', generateLeaveData());
    const savedLeaveBalances = getFromLocalStorage('leaveBalances', leaveBalances);
    const savedDocuments = getFromLocalStorage('documents', documents);
    const savedBankAccounts = getFromLocalStorage('bankAccounts', bankAccounts);
    const savedAnnouncements = getFromLocalStorage('announcements', [
      { id: 1, type: 'New Joiner', title: 'Welcome Mike Johnson!', message: 'Please welcome Mike Johnson who joined as Frontend Developer in Engineering team.', date: '2024-01-15', author: 'HR Team', pinned: true, icon: 'Users', color: 'blue' },
      { id: 2, type: 'Holiday', title: 'Upcoming Holiday - Diwali', message: 'Office will be closed on November 12th for Diwali celebration. Enjoy the festival!', date: '2024-01-14', author: 'Admin', pinned: true, icon: 'Gift', color: 'purple' },
      { id: 3, type: 'Important', title: 'New Leave Policy Update', message: 'Updated leave policy is now active. Please review the changes in Leave Policy section.', date: '2024-01-13', author: 'Admin', pinned: false, icon: 'AlertCircle', color: 'red' },
      { id: 4, type: 'Achievement', title: 'Team Achievement Award', message: 'Congratulations to Engineering team for completing the project ahead of schedule!', date: '2024-01-12', author: 'Management', pinned: false, icon: 'Trophy', color: 'yellow' }
    ]);
    const savedRosters = getFromLocalStorage('rosters', []);
    const savedTheme = getFromLocalStorage('theme', 'light');

    setCurrentUser(savedUser);
    setAllUsers(savedUsers);
    setAttendance(savedAttendance);
    setLeaves(savedLeaves);
    setAllLeaveBalances(savedLeaveBalances);
    setAllDocuments(savedDocuments);
    setAllBankAccounts(savedBankAccounts);
    setAnnouncements(savedAnnouncements);
    setRosters(savedRosters);
    setTheme(savedTheme);
    setLoading(false);

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }

    getCurrentIP().then(ip => {
      setCurrentIP(ip);
      const validation = validateIP(ip);
      setIpValidation(validation);
    });
  }, []);



  // Recalculate Leave Balances based on Attendance and Used Leaves
  useEffect(() => {
    if (loading || allUsers.length === 0) return;

    const updatedBalances = allUsers.map(user => {
      // 1. Calculate Accrued Paid Leave (PL) based on Attendance
      // Rule: 1.5 PL for every month with >= 15 working days
      let accruedPL = 0;
      const userAttendance = attendance.filter(a => a.employeeId === user.id);

      const attendanceByMonth = {};
      userAttendance.forEach(a => {
        const date = new Date(a.date);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!attendanceByMonth[key]) attendanceByMonth[key] = 0;
        if (a.status === 'Present' || a.status === 'Late' || a.status === 'Half Day') {
          attendanceByMonth[key]++;
        }
      });

      Object.values(attendanceByMonth).forEach(daysPresent => {
        if (daysPresent >= 15) {
          accruedPL += 1.5;
        }
      });

      // 2. Calculate Used Leaves
      const userLeaves = leaves.filter(l => l.employeeId === user.id && l.status === 'Approved');
      let usedPL = 0;
      let usedCL = 0;
      let usedLWP = 0;
      let usedUPL = 0; // Assuming UPL logic is manual for now

      userLeaves.forEach(l => {
        if (l.leaveType === 'Paid Leave') usedPL += parseFloat(l.days);
        else if (l.leaveType === 'Casual Leave') usedCL += parseFloat(l.days);
        else if (l.leaveType === 'Sick Leave') usedPL += parseFloat(l.days); // Fallback if exists
      });

      // Calculate LWP from attendance (auto-marked)
      const attendanceLWP = userAttendance.filter(a => a.status === 'LWP' || a.status === 'Absent').length;
      usedLWP = attendanceLWP;

      // Current Mock Balances (Preserve static CL/UPL rules for now, override PL/LWP)
      const existingBalance = allLeaveBalances.find(b => b.employeeId === user.id) || {};

      return {
        employeeId: user.id,
        paidLeave: {
          total: accruedPL,
          used: usedPL,
          available: Math.max(0, accruedPL - usedPL)
        },
        casualLeave: existingBalance.casualLeave || { total: 6, used: usedCL, available: 6 - usedCL },
        lwp: { total: 0, used: usedLWP, available: 0 },
        upl: existingBalance.upl || { total: 0, used: 0, available: 0 }
      };
    });

    // Only update if changes are detected to avoid infinite loops (simple JSON stringify check)
    if (JSON.stringify(updatedBalances) !== JSON.stringify(allLeaveBalances)) {
      setAllLeaveBalances(updatedBalances);
      setToLocalStorage('leaveBalances', updatedBalances);
    }
  }, [attendance, leaves, allUsers, loading]); // Dependencies: updates when any of these change

  const updateDocumentStatus = (docId, status) => {
    const updatedDocs = allDocuments.map(d =>
      d.id === docId ? { ...d, status } : d
    );
    setAllDocuments(updatedDocs);
    setToLocalStorage('documents', updatedDocs);
    return { success: true, message: `Document ${status.toLowerCase()} successfully` };
  };

  const login = async (email, password) => {
    const savedUsers = getFromLocalStorage('users', users);
    const user = savedUsers.find(u => (u.email === email || u.userId === email) && u.password === password);
    if (user) {
      try {
        const ip = await getCurrentIP();
        const validation = validateIP(ip);
        setCurrentIP(ip);
        setIpValidation(validation);
        logIPAccess(user.id, user.name, 'Login', ip, validation.allowed ? 'Allowed' : 'Blocked', validation.location);
        if (!validation.allowed) {
          return { success: false, message: validation.message, ipBlocked: true };
        }
      } catch (error) {
        console.log('IP validation skipped');
      }
      const { password, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      setToLocalStorage('currentUser', userWithoutPassword);
      return { success: true, user: userWithoutPassword };
    }
    return { success: false, message: 'Invalid email or password' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setToLocalStorage('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const clockIn = async (employeeId) => {
    if (checkModuleAccess('attendance') && !ipValidation.allowed) {
      const ip = await getCurrentIP();
      logIPAccess(employeeId, currentUser.name, 'Clock In', ip, 'Blocked', 'Unknown');
      return { success: false, message: ipValidation.message };
    }
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const clockInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const existingRecord = attendance.find(a => a.employeeId === employeeId && a.date === today);

    if (existingRecord && existingRecord.clockIn) {
      return { success: false, message: 'Already clocked in today' };
    }

    const newRecord = {
      id: `${employeeId}-${today}`,
      employeeId,
      date: today,
      clockIn: clockInTime,
      clockOut: null,
      status: clockInTime > '09:15' ? 'Late' : 'Present',
      workHours: 0,
      overtime: 0
    };

    const updatedAttendance = existingRecord
      ? attendance.map(a => a.id === existingRecord.id ? { ...a, ...newRecord } : a)
      : [...attendance, newRecord];

    // Auto-calculate status if we have a roster
    const todayRoster = rosters.find(r => r.employeeId === employeeId && r.date === today);
    if (todayRoster) {
      const result = calculateAttendanceStatus(clockInTime, null, today, todayRoster);
      const recordWithStatus = { ...newRecord, status: result.status, ruleApplied: result.ruleApplied };
      const finalAttendance = existingRecord
        ? attendance.map(a => a.id === existingRecord.id ? { ...a, ...recordWithStatus } : a)
        : [...attendance, recordWithStatus];
      setAttendance(finalAttendance);
      setToLocalStorage('attendance', finalAttendance);
    } else {
      setAttendance(updatedAttendance);
      setToLocalStorage('attendance', updatedAttendance);
    }

    return { success: true, message: 'Clocked in successfully', time: clockInTime };
  };

  const clockOut = async (employeeId) => {
    if (checkModuleAccess('attendance') && !ipValidation.allowed) {
      const ip = await getCurrentIP();
      logIPAccess(employeeId, currentUser.name, 'Clock Out', ip, 'Blocked', 'Unknown');
      return { success: false, message: ipValidation.message };
    }
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const clockOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const record = attendance.find(a => a.employeeId === employeeId && a.date === today);

    if (!record || !record.clockIn) {
      return { success: false, message: 'Please clock in first' };
    }

    if (record.clockOut) {
      return { success: false, message: 'Already clocked out today' };
    }

    const todayRoster = rosters.find(r => r.employeeId === employeeId && r.date === today);
    const result = calculateAttendanceStatus(record.clockIn, clockOutTime, today, todayRoster);

    const updatedAttendance = attendance.map(a =>
      a.id === record.id
        ? { ...a, clockOut: clockOutTime, workHours: result.workHours, status: result.status, workingDays: result.workingDays, ruleApplied: result.ruleApplied, overtime: result.workHours > 9 ? (result.workHours - 9).toFixed(2) : 0 }
        : a
    );

    setAttendance(updatedAttendance);
    setToLocalStorage('attendance', updatedAttendance);
    return { success: true, message: 'Clocked out successfully', time: clockOutTime };
  };

  const applyLeave = async (leaveData) => {
    if (checkModuleAccess('leaveRequests') && !ipValidation.allowed) {
      const ip = await getCurrentIP();
      logIPAccess(currentUser.id, currentUser.name, 'Apply Leave', ip, 'Blocked', 'Unknown');
      return { success: false, message: ipValidation.message };
    }
    const newLeave = {
      id: `L${Date.now()}`,
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      ...leaveData,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };

    const updatedLeaves = [...leaves, newLeave];
    setLeaves(updatedLeaves);
    setToLocalStorage('leaves', updatedLeaves);
    return { success: true, message: 'Leave application submitted successfully' };
  };

  const updateLeaveStatus = (leaveId, status, approvedBy) => {
    const updatedLeaves = leaves.map(leave =>
      leave.id === leaveId ? { ...leave, status, approvedBy } : leave
    );
    setLeaves(updatedLeaves);
    setToLocalStorage('leaves', updatedLeaves);
    return { success: true, message: `Leave ${status.toLowerCase()} successfully` };
  };

  const uploadDocument = (employeeId, documentData) => {
    const newDoc = {
      id: Date.now(),
      employeeId,
      ...documentData,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    const updatedDocs = [...allDocuments, newDoc];
    setAllDocuments(updatedDocs);
    setToLocalStorage('documents', updatedDocs);
    return { success: true, message: 'Document uploaded successfully' };
  };

  const updateBankAccount = (employeeId, bankData) => {
    const existing = allBankAccounts.find(b => b.employeeId === employeeId);
    const updatedBankAccounts = existing
      ? allBankAccounts.map(b => b.employeeId === employeeId ? { ...b, ...bankData } : b)
      : [...allBankAccounts, { employeeId, ...bankData }];

    setAllBankAccounts(updatedBankAccounts);
    setToLocalStorage('bankAccounts', updatedBankAccounts);
    return { success: true, message: 'Bank account details updated successfully' };
  };

  const updateUserProfile = (userId, profileData) => {
    const updatedUsers = allUsers.map(u => u.id === userId ? { ...u, ...profileData } : u);
    setAllUsers(updatedUsers);
    setToLocalStorage('users', updatedUsers);

    if (currentUser.id === userId) {
      const updatedCurrentUser = { ...currentUser, ...profileData };
      setCurrentUser(updatedCurrentUser);
      setToLocalStorage('currentUser', updatedCurrentUser);
    }

    return { success: true, message: 'Profile updated successfully' };
  };

  const addEmployee = (employeeData) => {
    const newEmployee = {
      id: allUsers.length + 1,
      ...employeeData,
      employeeId: `EMP${String(allUsers.length + 1).padStart(3, '0')}`,
      dateOfJoining: new Date().toISOString().split('T')[0]
    };

    const updatedUsers = [...allUsers, newEmployee];
    setAllUsers(updatedUsers);
    setToLocalStorage('users', updatedUsers);
    return { success: true, message: 'Employee added successfully', employee: newEmployee };
  };

  const addAnnouncement = (announcementData) => {
    const newAnnouncement = {
      id: announcements.length + 1,
      ...announcementData,
      date: new Date().toISOString().split('T')[0]
    };

    const updatedAnnouncements = [newAnnouncement, ...announcements];
    setAnnouncements(updatedAnnouncements);
    setToLocalStorage('announcements', updatedAnnouncements);
    return { success: true, message: 'Announcement posted successfully' };
  };

  const updateAnnouncement = (id, updates) => {
    const updatedAnnouncements = announcements.map(a =>
      a.id === id ? { ...a, ...updates } : a
    );
    setAnnouncements(updatedAnnouncements);
    setToLocalStorage('announcements', updatedAnnouncements);
    return { success: true };
  };

  const deleteAnnouncement = (id) => {
    const updatedAnnouncements = announcements.filter(a => a.id !== id);
    setAnnouncements(updatedAnnouncements);
    setToLocalStorage('announcements', updatedAnnouncements);
    return { success: true, message: 'Announcement deleted' };
  };

  const addUser = (userData) => {
    const newUser = { ...userData, id: allUsers.length + 1 };
    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    setToLocalStorage('users', updatedUsers);
    return { success: true };
  };

  const deleteUser = (userId) => {
    const updatedUsers = allUsers.filter(u => u.id !== userId);
    setAllUsers(updatedUsers);
    setToLocalStorage('users', updatedUsers);
    return { success: true };
  };

  const updateUser = (userId, updates) => {
    const updatedUsers = allUsers.map(u => u.id === userId ? { ...u, ...updates } : u);
    setAllUsers(updatedUsers);
    setToLocalStorage('users', updatedUsers);
    return { success: true };
  };

  const assignRoster = (rosterData) => {
    const { employeeIds, startDate, endDate, ...rest } = rosterData;
    let newEntries = [];

    employeeIds.forEach(empId => {
      const employee = allUsers.find(u => u.id === empId);
      const employeeName = employee?.name || 'Unknown';

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          newEntries.push({
            id: `R${Date.now()}-${empId}-${d.getTime()}`,
            ...rest,
            employeeId: empId,
            employeeName,
            date: d.toISOString().split('T')[0],
            assignedAt: new Date().toISOString()
          });
        }
      } else {
        newEntries.push({
          id: `R${Date.now()}-${empId}`,
          ...rest,
          employeeId: empId,
          employeeName,
          date: rosterData.date,
          assignedAt: new Date().toISOString()
        });
      }
    });

    const updatedRosters = [...rosters, ...newEntries];
    setRosters(updatedRosters);
    setToLocalStorage('rosters', updatedRosters);
    return { success: true, message: `Roster assigned successfully for ${employeeIds.length} employees` };
  };

  const deleteRoster = (id) => {
    const updatedRosters = rosters.filter(r => r.id !== id);
    setRosters(updatedRosters);
    setToLocalStorage('rosters', updatedRosters);
    return { success: true, message: 'Roster deleted successfully' };
  };

  const value = {
    currentUser,
    allUsers: allUsers.filter(u => {
      const exitedIds = JSON.parse(localStorage.getItem('exitedEmployeeIds') || '[]');
      return !exitedIds.includes(u.id);
    }),
    attendance,
    leaves,
    leaveBalances: allLeaveBalances,
    documents: allDocuments,
    bankAccounts: allBankAccounts,
    announcements,
    rosters,
    theme,
    loading,
    currentIP,
    ipValidation,
    login,
    logout,
    toggleTheme,
    clockIn,
    clockOut,
    applyLeave,
    updateLeaveStatus,
    uploadDocument,
    updateBankAccount,
    updateDocumentStatus,
    updateUserProfile,
    addEmployee,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    addUser,
    deleteUser,
    updateUser,
    assignRoster,
    deleteRoster
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
