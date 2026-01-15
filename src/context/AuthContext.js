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
    const savedTheme = getFromLocalStorage('theme', 'light');

    setCurrentUser(savedUser);
    setAllUsers(savedUsers);
    setAttendance(savedAttendance);
    setLeaves(savedLeaves);
    setAllLeaveBalances(savedLeaveBalances);
    setAllDocuments(savedDocuments);
    setAllBankAccounts(savedBankAccounts);
    setAnnouncements(savedAnnouncements);
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

  const login = async (email, password) => {
    const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const user = savedUsers.find(u => (u.email === email || u.userId === email) && u.password === password);
    if (user) {
      const ip = await getCurrentIP();
      const validation = validateIP(ip);
      setCurrentIP(ip);
      setIpValidation(validation);
      
      logIPAccess(user.id, user.name, 'Login', ip, validation.allowed ? 'Allowed' : 'Blocked', validation.location);
      
      if (!validation.allowed) {
        return { success: false, message: validation.message, ipBlocked: true };
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

    setAttendance(updatedAttendance);
    setToLocalStorage('attendance', updatedAttendance);
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

    const result = calculateAttendanceStatus(record.clockIn, clockOutTime, today);

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
    updateUserProfile,
    addEmployee,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    addUser,
    deleteUser,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
