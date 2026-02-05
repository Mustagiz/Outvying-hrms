import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db, firebaseConfig } from '../config/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth,
  createUserWithEmailAndPassword,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getCurrentIP, validateIP, logIPAccess, checkModuleAccess } from '../utils/ipValidation';
import { calculateAttendanceStatus } from '../utils/biometricSync';
import { getTodayLocal, calculateAbsDuration } from '../utils/helpers';
import { geolocation, defaultOfficeLocations } from '../utils/geolocation';

// --- Default Data for Seeding (Optional) ---
// You can remove this import if you don't plan to auto-seed
import { leaveBalances as mockLeaveBalances, users as mockUsers } from '../data/mockData';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data Collections
  const [allUsers, setAllUsers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [allLeaveBalances, setAllLeaveBalances] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [allBankAccounts, setAllBankAccounts] = useState([]);
  const [allLeaveTypes, setAllLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leavePolicy, setLeavePolicy] = useState({
    annualLeaves: 18,
    monthlyAccrual: 1.5,
    workingDaysRequired: 15
  });
  const [announcements, setAnnouncements] = useState([]);
  const [rosters, setRosters] = useState([]);
  const [manualLeaveAllocations, setManualLeaveAllocations] = useState([]);
  const [regularizationRequests, setRegularizationRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [attendanceRules, setAttendanceRules] = useState([]);
  const [payrollSettings, setPayrollSettings] = useState({
    tax: { pfEmployee: 12, pfEmployer: 12, pfCeiling: 15000, esiEmployee: 0.75, esiEmployer: 3.25, esiCeiling: 21000, professionalTax: 200, tdsEnabled: true }
  });
  const [emailSettings, setEmailSettings] = useState({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true,
    user: 'hrms@ovmkr.site',
    pass: 'Outvying@123$'
  });

  // Local State
  const [theme, setTheme] = useState('light');
  const [currentIP, setCurrentIP] = useState('127.0.0.1');
  const [ipSettings, setIpSettings] = useState({
    enabled: false,
    ipList: [],
    modules: { employeePortal: false, attendance: true, leaveRequests: true, payslip: false },
    blockMessage: 'Access denied. Please connect from office network or approved VPN.'
  });
  const [ipValidation, setIpValidation] = useState({ allowed: true, location: 'Unrestricted' });

  // --- 1. Initialization & Auth Listener ---
  useEffect(() => {
    // Theme Initialization
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // Apply Theme to Document root
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // IP Initialization
    getCurrentIP().then(ip => {
      setCurrentIP(ip);
    });

    // Firebase Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch User Details from Firestore 'users' collection
        try {
          // We use onSnapshot here to keep user profile updated (e.g. role change)
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Check for explicit deletion flag if we decide to use one, or just proceed
            if (userData.isDeleted) {
              console.warn("Account marked as deleted. Logging out.");
              await signOut(auth);
              setCurrentUser(null);
              return;
            }

            // Force Admin Role for specific email even if DB is wrong
            const normalizedEmail = user.email ? user.email.toLowerCase().trim() : '';
            if (normalizedEmail === 'admin@hrmspro.com') {
              userData.role = 'admin';
            }

            // Merge Auth info with Firestore info
            setCurrentUser({
              ...userData,
              uid: user.uid,
              id: user.uid,
              email: user.email
            });
          } else {
            // Master Admin Fallback: allow login even if doc is missing
            const normalizedEmail = user.email ? user.email.toLowerCase().trim() : '';
            if (normalizedEmail === 'admin@hrmspro.com') {
              setCurrentUser({
                uid: user.uid,
                id: user.uid,
                email: user.email,
                name: 'Master Admin',
                role: 'admin'
              });
            } else {
              // FORBIDDEN: User exists in Auth but has no Firestore profile (DELETED ghost)
              console.error("No profile found for user:", user.email, ". Forcing logout.");
              await signOut(auth);
              setCurrentUser(null);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          if (user.email === 'admin@hrmspro.com') {
            setCurrentUser({ uid: user.uid, email: user.email, role: 'admin' });
          } else {
            await signOut(auth);
            setCurrentUser(null);
          }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    // Subscribe to Attendance Rules (Single doc or collection)
    const unsubRules = onSnapshot(collection(db, 'attendanceRules'), (snapshot) => {
      const rulesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendanceRules(rulesData);
    });

    const unsubscribePayroll = onSnapshot(doc(db, 'settings', 'payroll'), (doc) => {
      if (doc.exists()) {
        setPayrollSettings(doc.data());
      }
    });

    // Subscribe to Email Settings
    const unsubscribeEmail = onSnapshot(doc(db, 'settings', 'email'), (doc) => {
      if (doc.exists()) {
        setEmailSettings(doc.data());
      }
    });

    return () => {
      unsubscribeAuth();
      unsubRules();
      unsubscribePayroll();
      unsubscribeEmail();
    };
  }, []);

  // --- 2. Real-time Data Subscriptions ---
  // Subscribes to collections when a user is logged in
  useEffect(() => {
    if (!currentUser) {
      // Clear state on logout
      setAllUsers([]);
      setAttendance([]);
      setLeaves([]);
      setRosters([]);
      setAllLeaveBalances([]);
      setAnnouncements([]);
      setAllDocuments([]);
      return;
    }

    // Subscribe to ALL Users (Needed for Employee Directory, Admin views, etc.)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id }));
      setAllUsers(usersData);
    });

    // Subscribe to Attendance
    // Optimization: In a huge app, filter by date or assume role-based query.
    // For now, load all to match previous Context API behavior.
    const unsubAttendance = onSnapshot(collection(db, 'attendance'), (snapshot) => {
      const attData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date descending and time (if available) to ensure latest records are first
      const sorted = attData.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) return dateB.localeCompare(dateA);

        // If same date, prefer the one with most recent clockIn
        const timeA = a.clockIn || '';
        const timeB = b.clockIn || '';
        return timeB.localeCompare(timeA);
      });
      setAttendance(sorted);
    });

    // Subscribe to Leaves
    const unsubLeaves = onSnapshot(collection(db, 'leaves'), (snapshot) => {
      const leaveData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeaves(leaveData);
    });

    // Subscribe to Rosters
    const unsubRosters = onSnapshot(collection(db, 'rosters'), (snapshot) => {
      const rosterData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRosters(rosterData);
    });

    // Subscribe to Announcements
    const unsubAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const annData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort announcements by date desc locally or via query if we added 'orderBy'
      setAnnouncements(annData.sort((a, b) => new Date(b.date) - new Date(a.date)));
    });

    // Subscribe to Documents
    const unsubDocuments = onSnapshot(collection(db, 'documents'), (snapshot) => {
      const docData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllDocuments(docData);
    });

    // Subscribe to Bank Accounts (Separate collection)
    const unsubBank = onSnapshot(collection(db, 'bankAccounts'), (snapshot) => {
      const bankData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      console.log("AuthContext Debug - Bank Snapshot received. Count:", bankData.length);
      setAllBankAccounts(bankData);
    }, (error) => {
      console.error("AuthContext Debug - Bank Subscription Error:", error);
    });

    // Subscribe to Leave Types
    const unsubLeaveTypes = onSnapshot(collection(db, 'leaveTypes'), (snapshot) => {
      const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllLeaveTypes(types);
    });

    // Subscribe to Holidays
    const unsubHolidays = onSnapshot(collection(db, 'holidays'), (snapshot) => {
      const holidayData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHolidays(holidayData);
    });

    // Subscribe to Leave Policy (Single doc)
    const unsubPolicy = onSnapshot(doc(db, 'settings', 'leavePolicy'), (docSnap) => {
      if (docSnap.exists()) {
        setLeavePolicy(docSnap.data());
      }
    });

    // Subscribe to Manual Leave Allocations
    const unsubManualLeaves = onSnapshot(collection(db, 'manualLeaveAllocations'), (snapshot) => {
      const manualData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setManualLeaveAllocations(manualData);
    });

    // Subscribe to Regularization Requests
    const unsubRegularization = onSnapshot(collection(db, 'regularizationRequests'), (snapshot) => {
      const regData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegularizationRequests(regData);
    });

    // Subscribe to Notifications (filtered by current user)
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.id)
    );
    const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notifData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by createdAt descending (newest first)
      setNotifications(notifData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      }));
    });

    // Subscribe to IP Restrictions Settings
    const unsubIPSettings = onSnapshot(doc(db, 'settings', 'ipRestrictions'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const defaultModules = { employeePortal: false, attendance: true, leaveRequests: true, payslip: false };
        setIpSettings({
          enabled: data.enabled || false,
          ipList: data.ipList || [],
          modules: (data.modules && Object.keys(data.modules).length > 0) ? data.modules : defaultModules,
          blockMessage: data.blockMessage || 'Access denied. Please connect from office network or approved VPN.'
        });
      } else {
        setIpSettings({
          enabled: false,
          ipList: [],
          modules: { employeePortal: false, attendance: true, leaveRequests: true, payslip: false },
          blockMessage: 'Access denied. Please connect from office network or approved VPN.'
        });
      }
    });

    // Cleanup subscriptions on unmount or logout
    return () => {
      unsubUsers();
      unsubAttendance();
      unsubLeaves();
      unsubRosters();
      unsubAnnouncements();
      unsubDocuments();
      unsubBank();
      unsubLeaveTypes();
      unsubHolidays();
      unsubPolicy();
      unsubManualLeaves();
      unsubIPSettings();
      unsubRegularization();
      unsubNotifications();
    };

  }, [currentUser]);


  // --- 3. Dynamic Leave Balance Calculation ---
  // Mimicking the logic from the previous AuthContext
  useEffect(() => {
    if (loading || allUsers.length === 0) return;

    const updatedBalances = allUsers.map(user => {
      // 1. Calculate Accrued Leaves (PL and CL)
      let accruedPL = 0;
      let accruedCL = 0;
      const userAttendance = attendance.filter(a => String(a.employeeId) === String(user.uid) || String(a.employeeId) === String(user.id));

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
        if (daysPresent >= (leavePolicy.workingDaysRequired || 15)) {
          accruedPL += parseFloat(leavePolicy.monthlyAccrual || 1.5);
          accruedCL += 0.5; // Fixed CL accrual for now, could be made configurable too
        }
      });

      // 1b. Add Opening Balances from user profile
      accruedPL += parseFloat(user.openingBalancePL || 0);
      accruedCL += parseFloat(user.openingBalanceCL || 0);


      // 2. Add Manual Allocations
      const userManuals = manualLeaveAllocations.filter(m => String(m.employeeId) === String(user.uid) || String(m.employeeId) === String(user.id));
      userManuals.forEach(m => {
        if (m.type === 'Paid Leave') accruedPL += parseFloat(m.amount);
        else if (m.type === 'Casual Leave') accruedCL += parseFloat(m.amount);
      });

      // 3. Calculate Used Leaves
      const userLeaves = leaves.filter(l => (l.employeeId === user.uid || l.employeeId === user.id) && l.status === 'Approved');
      let usedPL = 0;
      let usedCL = 0;
      let usedLWP = 0;
      let usedUPL = 0;

      userLeaves.forEach(l => {
        if (l.leaveType === 'Paid Leave') usedPL += parseFloat(l.days);
        else if (l.leaveType === 'Casual Leave') usedCL += parseFloat(l.days);
        else if (l.leaveType === 'Sick Leave') usedPL += parseFloat(l.days);
      });

      // LWP from attendance
      const attendanceLWP = userAttendance.filter(a => a.status === 'LWP' || a.status === 'Absent').length;
      usedLWP = attendanceLWP;

      // We maintain a local structure for balances, but we aren't saving this back to Firestore constantly to avoid write-loops.
      // This state is computed client-side for display.
      return {
        employeeId: user.id, // or uid
        paidLeave: {
          total: accruedPL,
          used: usedPL,
          available: Math.max(0, accruedPL - usedPL)
        },
        casualLeave: {
          total: accruedCL,
          used: usedCL,
          available: Math.max(0, accruedCL - usedCL)
        },
        lwp: { total: 0, used: usedLWP, available: 0 },
        upl: { total: 0, used: 0, available: 0 }
      };
    });

    setAllLeaveBalances(updatedBalances);
  }, [attendance, leaves, allUsers, manualLeaveAllocations, loading]);


  // --- 4. Actions (CRUD) using Firebase ---

  // LOGIN
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // IP Validation Logic
      const ip = await getCurrentIP();
      const validation = validateIP(ip);
      setCurrentIP(ip);
      setIpValidation(validation);

      // We can log access to Firestore 'audit_logs' if needed
      // logIPAccess(...) 

      if (!validation.allowed) {
        await signOut(auth); // Force logout if IP is blocked
        return { success: false, message: validation.message, ipBlocked: true };
      }

      // Success
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Login error:", error);
      let message = "Invalid email or password";
      if (error.code === 'auth/user-not-found') message = "User not found";
      if (error.code === 'auth/wrong-password') message = "Invalid password";
      return { success: false, message };
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  // BIOMETRIC SYNC (Firestore version)
  const syncBiometric = async () => {
    try {
      // Import dynamically to avoid circular dependencies if any
      const { processBiometricSync } = require('../utils/biometricSync');
      const { updatedAttendance } = processBiometricSync(rosters, attendance);

      const promises = updatedAttendance.map(record => {
        const docRef = doc(db, 'attendance', record.id);
        return setDoc(docRef, { ...record, updatedAt: serverTimestamp() }, { merge: true });
      });

      await Promise.all(promises);
      return { success: true, message: `Synced ${updatedAttendance.length} records successfully` };
    } catch (error) {
      console.error("Biometric Sync Error:", error);
      return { success: false, message: 'Sync failed' };
    }
  };

  // --- 4. Theme & IP Re-calculation ---
  // Apply theme to document root reactively
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Re-calculate IP Validation whenever IP or Settings change
  useEffect(() => {
    const validation = validateIP(currentIP, ipSettings);
    setIpValidation(validation);
  }, [currentIP, ipSettings]);

  // TOGGLE THEME
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Apply immediately to the DOM
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // MODULE ACCESS HELPER
  const checkAccess = (module) => {
    return checkModuleAccess(module, ipSettings);
  };

  // CLOCK IN
  const clockIn = async (employeeId) => {
    console.log("Starting Clock In Process for:", employeeId);

    // 1. IP Check (Warning Only)
    if (checkAccess('attendance') && !ipValidation.allowed) {
      console.warn("Clock In Warning - Unverified IP:", ipValidation);
      // Removed hard block. Proceed with warning.
    }

    // 2. Geolocation Check (Warning Only)
    try {
      const geoResult = await geolocation.validateLocation(defaultOfficeLocations);
      if (!geoResult.valid) {
        console.warn("Clock In Warning - Geolocation:", geoResult);
      }
    } catch (geoError) {
      console.error("Geolocation Error:", geoError);
    }

    const today = getTodayLocal();
    const now = new Date();
    const clockInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    console.log("Clock In - Local Time:", clockInTime, "Today:", today);

    // Intelligent Roster Matching (Business Day Logic)
    const findRosterMatch = () => {
      // 1. Direct match (IST date)
      const direct = rosters.find(r => String(r.employeeId) === String(employeeId) && r.date === today);
      if (direct && clockInTime > '06:00') return direct;

      // 2. Cross-midnight match (Previous Day's US night shift)
      const prevDate = new Date(today);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevStr = prevDate.toISOString().split('T')[0];
      const prevRoster = rosters.find(r => String(r.employeeId) === String(employeeId) && r.date === prevStr);

      if (prevRoster && prevRoster.timezone !== 'Asia/Kolkata' && clockInTime < '06:00') {
        return prevRoster;
      }
      return direct;
    };

    const targetRoster = findRosterMatch();
    const effectiveDate = targetRoster?.date || today;

    console.log("Clock In - Roster Match:", targetRoster ? "Found" : "None", "Effective Date:", effectiveDate);

    // Fetch existing record
    const docId = `${employeeId}_${effectiveDate}`;
    const docRef = doc(db, 'attendance', docId);
    const docSnap = await getDoc(docRef);

    let newSessions = [];
    let previousWorkHours = 0;

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Check if currently clocked in (active session)
      const sessions = data.sessions || [];
      if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1];
        if (!lastSession.out) {
          // If the last session is still open, we can't clock in again
          return { success: false, message: `Already clocked in at ${lastSession.in}. Please clock out first.` };
        }
      }

      // Prepare for multiple sessions
      newSessions = sessions;
      previousWorkHours = parseFloat(data.workHours || 0);
    }

    // Add new session
    newSessions.push({ in: clockInTime, out: null });

    try {
      const result = calculateAttendanceStatus(newSessions[0].in, null, effectiveDate, targetRoster, attendanceRules);

      const updateData = {
        employeeId,
        date: effectiveDate,
        istDate: today,
        // Keep legacy fields for backward compatibility with UI
        clockIn: newSessions[0].in,
        clockOut: null,
        sessions: newSessions,
        status: result.status,
        workHours: previousWorkHours, // Don't reset hours on new punch-in
        ruleApplied: result.ruleApplied,
        updatedAt: serverTimestamp()
      };

      if (!docSnap.exists()) {
        updateData.createdAt = serverTimestamp();
      }

      console.log("Clock In - Writing to Firestore:", docId, updateData);
      await setDoc(docRef, updateData, { merge: true });
      console.log("Clock In - Write Success");

      return { success: true, message: `Clocked in at ${clockInTime}`, time: clockInTime };
    } catch (error) {
      console.error("ClockIn Error:", error);
      return { success: false, message: `Failed to clock in: ${error.message}` };
    }
  };

  // CLOCK OUT
  const clockOut = async (employeeId) => {
    console.log("Starting Clock Out Process for:", employeeId);

    // IP Check (Warning Only)
    if (checkAccess('attendance') && !ipValidation.allowed) {
      console.warn("Clock Out Warning - Unverified IP:", ipValidation);
    }

    // Geolocation Check (Warning Only)
    try {
      const geoResult = await geolocation.validateLocation(defaultOfficeLocations);
      if (!geoResult.valid) {
        console.warn("Clock Out Warning - Geolocation:", geoResult);
      }
    } catch (e) { console.error(e); }

    const today = getTodayLocal();
    const now = new Date();
    const clockOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    console.log("Clock Out - Local Time:", clockOutTime, "Today:", today);

    // Find record with open session - Prioritize MOST RECENT open session
    // Filtering on both clockOut and sessions array to be safe
    const record = attendance.find(a =>
      String(a.employeeId) === String(employeeId) &&
      (!a.clockOut || (a.sessions && a.sessions.length > 0 && !a.sessions[a.sessions.length - 1].out))
    );

    if (!record) {
      console.warn("Clock Out Failed: No active session found for employee", employeeId);
      return { success: false, message: 'No active clock-in found to clock out from' };
    }

    console.log("Clock Out - Found Active Record:", record.id, "Date:", record.date);
    return await finalizeClockOut(record, clockOutTime, employeeId);
  };

  const finalizeClockOut = async (record, clockOutTime, employeeId) => {
    try {
      const roster = rosters.find(r => String(r.employeeId) === String(employeeId) && r.date === record.date);

      // Update Sessions
      let sessions = record.sessions || [];
      if (sessions.length === 0 && record.clockIn) {
        sessions.push({ in: record.clockIn, out: null });
      }

      // Close last session
      if (sessions.length > 0) {
        sessions[sessions.length - 1].out = clockOutTime;
      }

      // First-In Last-Out Logic
      // Calculate duration between the FIRST punch-in of the day and the CURRENT punch-out
      const firstIn = sessions[0].in;
      const lastOut = clockOutTime;

      const totalHours = calculateAbsDuration(firstIn, record.date, lastOut, record.date);
      console.log(`FILO Calculation: First In (${firstIn}) to Last Out (${lastOut}) = ${totalHours}h`);

      // Recalculate Status based on First-In and Total Hours (FILO)
      const result = calculateAttendanceStatus(firstIn, lastOut, record.istDate, roster, attendanceRules);
      console.log("Clock Out - Calculated Status:", result.status, "Total Hours (FILO):", totalHours);

      const updates = {
        clockOut: clockOutTime, // Current punch out
        sessions: sessions,
        workHours: parseFloat(totalHours.toFixed(2)),
        status: result.status,
        workingDays: result.workingDays,
        overtime: result.overtime || 0,
        ruleApplied: result.ruleApplied || null,
        updatedAt: serverTimestamp()
      };

      console.log("Clock Out - Writing updates:", record.id, updates);
      const docRef = doc(db, 'attendance', record.id);
      await updateDoc(docRef, updates); // Merge is default for updateDoc

      return { success: true, message: 'Clocked out successfully', time: clockOutTime };

    } catch (error) {
      console.error("ClockOut Error Details:", error);
      return { success: false, message: 'Failed to clock out: ' + (error.message || 'Unknown error') };
    }
  };

  // APPLY LEAVE
  const applyLeave = async (leaveData) => {
    try {
      // Eligibility check
      const name = (leaveData.leaveType || '').toLowerCase();
      const isPaidOrCasual = name.includes('paid') || name.includes('casual') || name.includes('pl') || name.includes('cl');

      if (isPaidOrCasual) {
        const presentDays = attendance.filter(a =>
          (String(a.employeeId) === String(currentUser.uid)) &&
          ['Present', 'Late', 'Half Day'].includes(a.status)
        ).length;

        if (presentDays < 15) {
          return { success: false, message: `Eligibility failed: You have only completed ${presentDays} working days. 15 days required for Paid/Casual leave.` };
        }
      }

      const newLeave = {
        employeeId: currentUser.uid, // Ensure we use UID
        employeeName: currentUser.name || currentUser.email,
        ...leaveData,
        status: 'Pending',
        appliedDate: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'leaves'), newLeave);
      return { success: true, message: 'Leave application submitted successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to apply leave: ' + error.message };
    }
  };

  // UPDATE LEAVE STATUS
  const updateLeaveStatus = async (leaveId, status, approvedBy) => {
    try {
      const docRef = doc(db, 'leaves', leaveId);
      await updateDoc(docRef, {
        status,
        approvedBy,
        updatedAt: serverTimestamp()
      });

      // Fetch the leave data to notify the employee
      const leaveSnap = await getDoc(docRef);
      if (leaveSnap.exists()) {
        const leaveData = leaveSnap.data();
        await createNotification({
          userId: leaveData.employeeId,
          type: status === 'Approved' ? 'leave_approved' : 'leave_rejected',
          title: `Leave ${status}`,
          message: `Your ${leaveData.leaveType} request from ${leaveData.startDate} to ${leaveData.endDate} has been ${status.toLowerCase()}`,
          relatedId: leaveId,
          actionUrl: '/leave'
        });
      }

      return { success: true, message: `Leave ${status.toLowerCase()} successfully` };
    } catch (error) {
      console.error("Update Leave Status Error:", error);
      return { success: false, message: 'Update failed: ' + error.message };
    }
  };

  // UPDATE ATTENDANCE REGULARIZATION STATUS
  const updateRegularizationStatus = async (requestId, status, comments, approvedBy, approverId) => {
    try {
      const requestRef = doc(db, 'regularizationRequests', requestId);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) throw new Error("Request not found");
      const request = requestSnap.data();

      const auditEntry = {
        action: status,
        by: approvedBy,
        date: new Date().toISOString(),
        comments
      };

      await updateDoc(requestRef, {
        status,
        approverComments: comments,
        auditLog: [...(request.auditLog || []), auditEntry],
        updatedAt: serverTimestamp()
      });

      // If Approved, update the actual Attendance Record
      if (status === 'Approved') {
        const { employeeId, date, inTime, outTime, regularizationType } = request;

        // Find existing attendance record
        const q = query(
          collection(db, 'attendance'),
          where('employeeId', '==', employeeId),
          where('date', '==', date)
        );
        const querySnapshot = await getDocs(q);
        let existingData = !querySnapshot.empty ? querySnapshot.docs[0].data() : {};

        let attendanceUpdate = {};
        // Determine which fields to update based on regularizationType
        if (regularizationType === 'Login Only') {
          const finalClockOut = existingData.clockOut || null;
          if (inTime && finalClockOut) {
            const result = calculateAttendanceStatus(inTime, finalClockOut, date, rosters.find(r => r.employeeId === employeeId && r.date === date), attendanceRules);
            attendanceUpdate = { clockIn: inTime, status: result.status, workHours: result.workHours, workingDays: result.workingDays, overtime: result.overtime };
          } else {
            attendanceUpdate = { clockIn: inTime };
          }
        } else if (regularizationType === 'Logout Only') {
          const finalClockIn = existingData.clockIn || null;
          if (finalClockIn && outTime) {
            const result = calculateAttendanceStatus(finalClockIn, outTime, date, rosters.find(r => r.employeeId === employeeId && r.date === date), attendanceRules);
            attendanceUpdate = { clockOut: outTime, status: result.status, workHours: result.workHours, workingDays: result.workingDays, overtime: result.overtime };
          } else {
            attendanceUpdate = { clockOut: outTime };
          }
        } else {
          // Both
          if (inTime && outTime) {
            const result = calculateAttendanceStatus(inTime, outTime, date, rosters.find(r => r.employeeId === employeeId && r.date === date), attendanceRules);
            attendanceUpdate = { clockIn: inTime, clockOut: outTime, status: result.status, workHours: result.workHours, workingDays: result.workingDays, overtime: result.overtime };
          } else {
            attendanceUpdate = { clockIn: inTime || null, clockOut: outTime || null, status: 'Present', workingDays: 1.0 };
          }
        }

        attendanceUpdate = {
          ...attendanceUpdate,
          regularizedBy: approverId,
          regularizedAt: serverTimestamp(),
          isRegularized: true
        };

        if (!querySnapshot.empty) {
          await updateDoc(querySnapshot.docs[0].ref, attendanceUpdate);
          // Auto-heal duplicates
          if (querySnapshot.docs.length > 1) {
            for (let i = 1; i < querySnapshot.docs.length; i++) await deleteDoc(querySnapshot.docs[i].ref);
          }
        } else {
          const docId = `${employeeId}-${date}`;
          await setDoc(doc(db, 'attendance', docId), { employeeId, date, ...attendanceUpdate });
        }
      }

      // Notify employee
      await createNotification({
        userId: request.employeeId,
        type: status === 'Approved' ? 'regularization_approved' : 'regularization_rejected',
        title: `Regularization ${status}`,
        message: `Your regularization request for ${request.date} has been ${status.toLowerCase()}`,
        relatedId: requestId,
        actionUrl: '/attendance-regularization'
      });

      return { success: true, message: `Request ${status.toLowerCase()} successfully` };
    } catch (error) {
      console.error("Update Regularization Status Error:", error);
      return { success: false, message: 'Operation failed: ' + error.message };
    }
  };

  // ALLOCATE LEAVE (Admin only)
  const allocateLeave = async (employeeId, type, amount, reason) => {
    try {
      await addDoc(collection(db, 'manualLeaveAllocations'), {
        employeeId,
        type,
        amount: parseFloat(amount),
        reason,
        allocatedBy: currentUser.name || currentUser.email,
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });
      return { success: true, message: 'Leave allocated successfully' };
    } catch (error) {
      console.error("AllocateLeave Error", error);
      return { success: false, message: 'Failed to allocate leave' };
    }
  };

  // ROSTER - ASSIGN
  const assignRoster = async (rosterData) => {
    const { employeeIds, startDate, endDate, ...rest } = rosterData;
    try {
      const promises = [];
      for (const empId of employeeIds) {
        const employee = allUsers.find(u => u.id === empId || u.uid === empId);
        const employeeName = employee?.name || 'Unknown';

        const processDate = async (dateStr) => {
          // 1. Add/Assign Roster
          const rosterRef = await addDoc(collection(db, 'rosters'), {
            ...rest,
            employeeId: empId,
            employeeName,
            date: dateStr,
            assignedAt: serverTimestamp()
          });

          // 2. Sync existing attendance for this date (Direct Firestore Query)
          const q = query(
            collection(db, 'attendance'),
            where('employeeId', '==', empId),
            where('date', '==', dateStr)
          );
          const snap = await getDocs(q);

          if (!snap.empty) {
            console.log("AuthContext: Robust retro-syncing attendance for:", empId, dateStr);
            const rosterData = { ...rest, employeeId: empId, date: dateStr };

            for (const attDoc of snap.docs) {
              const attData = attDoc.data();
              if (attData.clockIn) {
                const result = calculateAttendanceStatus(attData.clockIn, attData.clockOut, attData.istDate || dateStr, rosterData, attendanceRules);
                await updateDoc(attDoc.ref, {
                  status: result.status,
                  workHours: result.workHours,
                  workingDays: result.workingDays,
                  overtime: result.overtime,
                  ruleApplied: result.ruleApplied
                });
              }
            }
          }
        };

        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            promises.push(processDate(dateStr));
          }
        } else {
          const dateStr = rosterData.date || startDate;
          promises.push(processDate(dateStr));
        }
      }

      await Promise.all(promises);
      return { success: true, message: `Roster assigned and attendance synchronized` };

    } catch (error) {
      console.error("Roster Assign Error", error);
      return { success: false, message: 'Failed to assign roster' };
    }
  };

  // ROSTER - DELETE
  const deleteRoster = async (id) => {
    try {
      await deleteDoc(doc(db, 'rosters', id));
      return { success: true, message: 'Roster deleted successfully' };
    } catch (error) {
      return { success: false, message: 'Delete failed' };
    }
  };

  // ROSTER - UPDATE
  const updateRoster = async (id, updatedData) => {
    try {
      const rosterRef = doc(db, 'rosters', id);
      const rosterSnap = await getDoc(rosterRef);
      if (!rosterSnap.exists()) throw new Error("Roster not found");
      const oldRoster = rosterSnap.data();

      await updateDoc(rosterRef, updatedData);

      const newRoster = { ...oldRoster, ...updatedData };

      // Sync attendance if it already exists (Direct Firestore Query)
      const q = query(
        collection(db, 'attendance'),
        where('employeeId', '==', newRoster.employeeId),
        where('date', '==', newRoster.date)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        console.log("AuthContext: Robust syncing attendance after roster update for employee:", newRoster.employeeId);
        for (const attDoc of snap.docs) {
          const attData = attDoc.data();
          if (attData.clockIn) {
            const result = calculateAttendanceStatus(attData.clockIn, attData.clockOut, attData.istDate || newRoster.date, newRoster, attendanceRules);
            await updateDoc(attDoc.ref, {
              status: result.status,
              workHours: result.workHours,
              workingDays: result.workingDays,
              overtime: result.overtime,
              ruleApplied: result.ruleApplied
            });
          }
        }
      }

      return { success: true, message: 'Roster updated and attendance synchronized' };
    } catch (error) {
      console.error("Update Roster Error:", error);
      return { success: false, message: 'Update failed: ' + error.message };
    }
  };

  // DOCUMENT - UPLOAD (Metadata only - real file storage happens in Component usually, or we can add storage logic here)
  const uploadDocument = async (employeeId, documentData) => {
    try {
      // documentData should contain { name, size, type, data(base64) OR url }
      await addDoc(collection(db, 'documents'), {
        employeeId,
        ...documentData,
        uploadDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      return { success: true, message: 'Document uploaded successfully' };
    } catch (error) {
      return { success: false, message: 'Upload failed' };
    }
  };

  const updateDocumentStatus = async (docId, status) => {
    try {
      await updateDoc(doc(db, 'documents', docId), { status });
      return { success: true, message: `Document ${status.toLowerCase()} successfully` };
    } catch (e) { return { success: false, message: 'Error updating document' }; }
  };

  // BANK ACCOUNT
  const updateBankAccount = async (employeeId, bankData) => {
    try {
      console.log("Attempting Bank Update for:", employeeId, "Data:", bankData);
      // Use employeeId as Document ID for 1:1 mapping
      await setDoc(doc(db, 'bankAccounts', employeeId), { ...bankData, updatedAt: serverTimestamp() }, { merge: true });
      return { success: true, message: 'Bank account updated' };
    } catch (e) {
      console.error("Bank Update Error:", e);
      return { success: false, message: 'Error updating bank details: ' + (e.message || 'Permission denied') };
    }
  };

  // ADMIN - CREATE USER (Only creates in Firestore profile, Auth creation usually server-side or secondary app in basic setup)
  // Note: Client-side `createUserWithEmailAndPassword` logs you in as the NEW user, which logs out the Admin. 
  // For this simple app, we can use a secondary function or just assume Admin creates manually in Console.
  // OR: We use the `addUser` purely for Firestore profile if Auth is handled differently.
  // For now: Simple Firestore Add.
  // ADMIN - CREATE USER (Creates Auth User + Firestore Profile via Secondary App)
  const addUser = async (userData) => {
    if (!userData.email) return { success: false, message: 'Email is required for account creation.' };
    let secondaryApp = null;
    try {
      // 1. Initialize secondary app to create user without logging out current admin
      // Use unique name to avoid collisions in bulk loops
      const appName = `SecondaryApp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create user in Firebase Auth
      const password = userData.password || 'Default@123';
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, password);
      const { uid } = userCredential.user;

      // 3. Create user profile in Firestore (using the new UID)
      const { password: _, ...userDataToStore } = userData; // Exclude password from Firestore

      // Auto-generate Employee ID if missing
      if (!userDataToStore.employeeId) {
        const empUsers = allUsers.filter(u => u.employeeId && u.employeeId.startsWith('EMP'));
        const lastId = empUsers.length > 0
          ? Math.max(...empUsers.map(u => parseInt(u.employeeId.replace('EMP', '')) || 0))
          : 0;
        userDataToStore.employeeId = `EMP${String(lastId + 1).padStart(3, '0')}`;
      }

      await setDoc(doc(db, 'users', uid), {
        ...userDataToStore,
        uid: uid,
        createdAt: serverTimestamp()
      });

      // 4. Create Bank Account document if details provided
      if (userData.bankName || userData.bankAccount || userData.ifscCode) {
        await setDoc(doc(db, 'bankAccounts', uid), {
          bankName: userData.bankName || '',
          accountNumber: userData.bankAccount || '',
          ifscCode: userData.ifscCode || '',
          accountType: 'Savings',
          branch: 'Main Branch',
          updatedAt: serverTimestamp()
        });
      }

      // 5. Cleanup
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      return { success: true, message: 'User created successfully with login access.' };
    } catch (e) {
      console.error("Error adding user:", e);
      if (secondaryApp) {
        try { await deleteApp(secondaryApp); } catch (err) { console.error("Error cleanup:", err); }
      }

      let errorMessage = e.message;
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already registered to another account.';
      }

      return { success: false, message: 'Error adding user: ' + errorMessage };
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      return { success: true, message: 'User updated' };
    } catch (e) { return { success: false, message: 'Update failed' }; }
  };

  // ADMIN - RESET PASSWORD (Requires signing in as user temporarily or using a secondary app)
  // WARNING: Resetting password for ANOTHER user without Cloud Functions usually requires their credentials.
  // HOWEVER, we can use the secondary app to "Login" as them if we know their OLD credentials, 
  // OR just instruct the admin to use the "Forgot Password" flow effectively.
  // FOR THIS APP: We will implement a "Force Update" using the secondary app pattern if old password is provided,
  // OR we inform the user to use Firebase Console.
  // BETTER CLIENT-SIDE APPROACH: Use `sendPasswordResetEmail`.
  const resetPassword = async (email) => {
    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset link sent to ' + email };
    } catch (e) {
      console.error("Reset Error:", e);
      return { success: false, message: 'Reset failed: ' + e.message };
    }
  };

  // New Administrative Password Reset (Uses Cloud Function)
  const resetPasswordAdmin = async (targetUserId, newPassword) => {
    try {
      const functions = getFunctions();
      const resetFn = httpsCallable(functions, 'resetUserPassword');
      const result = await resetFn({ targetUid: targetUserId, newPassword });
      return { success: true, message: result.data.message };
    } catch (e) {
      console.error("Admin Password Reset Error:", e);
      let errorMessage = e.message || 'Unknown error';

      // If it's a Firebase Functions error, it might have details or a more specific code
      if (e.code && e.code !== 'internal') {
        errorMessage = `${e.code}: ${e.message}`;
      } else if (e.details) {
        errorMessage = e.details;
      }

      return { success: false, message: 'Reset failed: ' + errorMessage };
    }
  };

  /**
   * Sends a system email using the custom hostinger SMTP server
   */
  const sendEmail = async (to, subject, html, text = '') => {
    try {
      const functions = getFunctions();
      const emailFn = httpsCallable(functions, 'sendSystemEmail');
      const result = await emailFn({ to, subject, text, html });
      return { success: true, message: result.data.message };
    } catch (e) {
      console.error("Send Email Error:", e);
      return { success: false, message: 'Email failed: ' + (e.message || 'Unknown error') };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const user = auth.currentUser;
      if (!user) return { success: false, message: 'No user logged in' };

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      return { success: true, message: 'Password changed successfully' };
    } catch (e) {
      console.error("Change Password Error:", e);
      return { success: false, message: 'Failed to change password: ' + e.message };
    }
  };

  const updateUserId = async (currentEmail, currentPassword, newEmail) => {
    let secondaryApp = null;
    try {
      secondaryApp = initializeApp(firebaseConfig, "EmailUpdateApp");
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await signInWithEmailAndPassword(secondaryAuth, currentEmail, currentPassword);

      // 1. Update in Auth
      await updateEmail(userCredential.user, newEmail);
      const uid = userCredential.user.uid;

      // 2. Update in Firestore
      await updateDoc(doc(db, 'users', uid), {
        email: newEmail,
        userId: newEmail // Sync userId field if used
      });

      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      return { success: true, message: 'User ID / Email updated successfully' };
    } catch (e) {
      if (secondaryApp) await deleteApp(secondaryApp);
      return { success: false, message: 'Update failed: ' + e.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const functions = getFunctions();
      const deleteFn = httpsCallable(functions, 'deleteUserAdmin');
      const result = await deleteFn({ targetUid: userId });

      // Fallback/Safety: Even if Cloud function fails to find Auth user, 
      // ensure Firestore doc is gone if possible, or just report success from function
      return { success: true, message: result.data.message || 'User deleted successfully.' };
    } catch (e) {
      console.error("Delete User Error:", e);
      // Fallback to Firestore-only deletion if Cloud Function fails specifically due to not being found/deployed
      // This ensures basic functionality remains while user figures out deployment
      try {
        await deleteDoc(doc(db, 'users', userId));
        return { success: true, message: 'User profile removed (Auth account might remain). Please deploy Cloud Functions for full deletion.' };
      } catch (firestoreError) {
        return { success: false, message: 'Delete failed: ' + (e.message || 'Unknown error') };
      }
    }
  };

  // LEAVE POLICY & TYPES
  const updateLeavePolicy = async (policyData) => {
    try {
      await setDoc(doc(db, 'settings', 'leavePolicy'), { ...policyData, updatedAt: serverTimestamp() }, { merge: true });
      return { success: true, message: 'Policy updated' };
    } catch (e) { return { success: false, message: 'Error' }; }
  };

  const addLeaveType = async (typeData) => {
    try {
      await addDoc(collection(db, 'leaveTypes'), { ...typeData, createdAt: serverTimestamp() });
      return { success: true, message: 'Type added' };
    } catch (e) { return { success: false, message: 'Error' }; }
  };

  const deleteLeaveType = async (id) => {
    try {
      await deleteDoc(doc(db, 'leaveTypes', id));
      return { success: true, message: 'Deleted' };
    } catch (e) { return { success: false, message: 'Error' }; }
  };

  // HOLIDAYS
  const addHoliday = async (holidayData) => {
    try {
      await addDoc(collection(db, 'holidays'), { ...holidayData, createdAt: serverTimestamp() });
      return { success: true, message: 'Holiday added' };
    } catch (e) { return { success: false, message: 'Error adding holiday' }; }
  };

  const deleteHoliday = async (id) => {
    try {
      await deleteDoc(doc(db, 'holidays', id));
      return { success: true, message: 'Holiday deleted' };
    } catch (e) { return { success: false, message: 'Error deleting holiday' }; }
  };

  // ANNOUNCEMENTS
  const addAnnouncement = async (data) => {
    try {
      await addDoc(collection(db, 'announcements'), { ...data, date: new Date().toISOString().split('T')[0] });
      return { success: true, message: 'Posted' };
    } catch (e) { return { success: false, message: 'Error' }; }
  };
  const deleteAnnouncement = async (id) => {
    try {
      await deleteDoc(doc(db, 'announcements', id));
      return { success: true, message: 'Deleted' };
    } catch (e) { return { success: false, message: 'Error' }; }
  };


  const repairAdminProfile = async () => {
    if (!currentUser || currentUser.email !== 'admin@hrmspro.com') {
      return { success: false, message: 'Only logged-in admin can perform repair.' };
    }

    try {
      // Force write the admin profile to Firestore to satisfy Security Rules
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        role: 'admin',
        name: 'Admin User',
        createdAt: serverTimestamp(),
        lastRepaired: serverTimestamp()
      }, { merge: true });

      return { success: true, message: 'Admin profile restored. You should now have write permissions.' };
    } catch (e) {
      console.error("Repair failed:", e);
      return { success: false, message: 'Repair failed: ' + e.message };
    }
  };

  // --- NOTIFICATION FUNCTIONS ---
  const createNotification = async (notificationData) => {
    try {
      const { userId, type, title, message, relatedId, actionUrl } = notificationData;
      await addDoc(collection(db, 'notifications'), {
        userId,
        type,
        title,
        message,
        relatedId: relatedId || null,
        actionUrl: actionUrl || null,
        read: false,
        createdAt: serverTimestamp()
      });

      // Phase 6: External Integrations
      const { triggerWebhooks, sendBrowserNotification } = await import('../utils/notifier');

      // 1. Browser Push (Real-time fallback)
      sendBrowserNotification(title, { body: message });

      // 2. Webhooks (External reporting/automation)
      triggerWebhooks(type, { title, message, relatedId });

      return { success: true };
    } catch (error) {
      console.error('Failed to create notification:', error);
      return { success: false, message: error.message };
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return { success: false, message: error.message };
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(n =>
        updateDoc(doc(db, 'notifications', n.id), { read: true })
      );
      await Promise.all(promises);
      return { success: true };
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    currentUser,
    allUsers,
    attendance,
    leaves,
    leaveBalances: allLeaveBalances,
    documents: allDocuments,
    bankAccounts: allBankAccounts,
    announcements,
    rosters,
    theme,
    toggleTheme,
    loading,
    currentIP,
    ipValidation,
    login,
    logout,
    clockIn,
    clockOut,
    syncBiometric,
    applyLeave,
    updateLeaveStatus,
    payrollSettings,
    commitPayroll: async (payrollBatch) => {
      try {
        const promises = payrollBatch.map(record =>
          addDoc(collection(db, 'processedPayroll'), {
            ...record,
            committedAt: serverTimestamp(),
            committedBy: currentUser.id
          })
        );
        await Promise.all(promises);
        return { success: true, message: 'Payroll committed successfully' };
      } catch (e) {
        console.error("Commit Payroll Error:", e);
        return { success: false, message: 'Commit failed: ' + e.message };
      }
    },
    updatePayrollSettings: async (newSettings) => {
      try {
        await setDoc(doc(db, 'settings', 'payroll'), newSettings, { merge: true });
        return { success: true };
      } catch (e) {
        return { success: false, message: e.message };
      }
    },
    updateEmailSettings: async (newSettings) => {
      try {
        await setDoc(doc(db, 'settings', 'email'), newSettings, { merge: true });
        return { success: true, message: 'Email settings updated successfully. Please note: You may need to redeploy Cloud Functions if you changed the credentials, OR the functions will pick them up on next call.' };
      } catch (e) {
        return { success: false, message: e.message };
      }
    },
    emailSettings,
    uploadDocument,
    updateBankAccount,
    updateDocumentStatus,
    addAnnouncement,
    deleteAnnouncement,
    addUser,
    updateUser,
    updateUserProfile: updateUser,
    deleteHoliday,
    leavePolicy,
    sendEmail,
    resetPassword,
    resetPasswordAdmin,
    forceUpdatePassword: resetPasswordAdmin, // Map existing function to the new admin-only method
    changePassword,
    updateUserId,
    deleteUser,
    assignRoster,
    deleteRoster,
    updateRoster,
    allocateLeave,
    manualLeaveAllocations,
    updateLeavePolicy,
    addLeaveType,
    deleteLeaveType,
    allLeaveTypes,
    holidays,
    addHoliday,
    regularizationRequests,
    updateRegularizationStatus,
    attendanceRules,
    // Add Employee wrapper
    addEmployee: addUser,
    repairAdminProfile,
    seedDatabase: async () => {
      try {
        let count = 0;
        for (const user of mockUsers) {
          try {
            // Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
            const uid = userCredential.user.uid;

            // Create Firestore Profile
            await setDoc(doc(db, 'users', uid), {
              ...user,
              uid: uid,
              createdAt: serverTimestamp()
            });
            count++;
          } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
              console.log(`User ${user.email} already exists, updating Firestore profile...`);
              // Update Firestore even if Auth exists to ensure role is correct
              // We need the UID. Since we can't get it easily without signing in, 
              // for this mock logic we might assume a standard mapping or just skip if we really can't get it.
              // However, since we are admin/dev, let's try to overwrite if we can find the user.
              // NOTE: In client-SDK, we can't "getUserByEmail". 
              // So we will just log this message. 
              // BUT, to fix the specific issue of "Admin" missing role, we can instruct user to "Seed" 
              // which unfortunately requires them to NOT exist or we have to sign them in.

              // ALTERNATIVE: valid for "admin@hrmspro.com" 
              // We can't overwrite easily without UID. 
              // The user will rely on the `onAuthStateChanged` fallback I added above for the Admin text fixes.

            } else {
              console.error(`Failed to create ${user.email}:`, error);
            }
          }
        }

        // Ensure Admin Logic Fix:
        // Attempt to login as admin temporarily to set the doc? No, that signs out current user.
        // The fallback in onAuthStateChanged is the safest immediate fix without cloud functions.

        await signOut(auth); // Sign out the last created user
        return { success: true, message: `Database seeded with ${count} users. Please login.` };
      } catch (error) {
        console.error("Seeding Error:", error);
        return { success: false, message: "Seeding failed: " + error.message };
      }
    },
    checkModuleAccess: checkAccess, // Shorthand for use in components
    updateIPSettings: async (newSettings) => {
      try {
        await setDoc(doc(db, 'settings', 'ipRestrictions'), newSettings);
        return { success: true };
      } catch (error) {
        console.error("Failed to update IP settings:", error);
        return { success: false, message: error.message };
      }
    },
    ipSettings,
    // Notifications
    notifications,
    createNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <div className="h-screen w-full flex items-center justify-center">Loading Firebase...</div> : children}
    </AuthContext.Provider>
  );
};
