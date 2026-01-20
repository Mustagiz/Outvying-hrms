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
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getCurrentIP, validateIP, logIPAccess, checkModuleAccess } from '../utils/ipValidation';
import { calculateAttendanceStatus } from '../utils/biometricSync';

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
  const [leavePolicy, setLeavePolicy] = useState({
    annualLeaves: 18,
    monthlyAccrual: 1.5,
    workingDaysRequired: 15
  });
  const [announcements, setAnnouncements] = useState([]);
  const [rosters, setRosters] = useState([]);

  // Local State
  const [theme, setTheme] = useState('light');
  const [currentIP, setCurrentIP] = useState('127.0.0.1');
  const [ipValidation, setIpValidation] = useState({ allowed: true, location: 'Unrestricted' });

  // --- 1. Initialization & Auth Listener ---
  useEffect(() => {
    // Theme Handler
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') document.documentElement.classList.add('dark');

    // IP Check
    getCurrentIP().then(ip => {
      setCurrentIP(ip);
      const validation = validateIP(ip);
      setIpValidation(validation);
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
            // Force Admin Role for specific email even if DB is wrong
            const normalizedEmail = user.email ? user.email.toLowerCase().trim() : '';
            if (normalizedEmail === 'admin@hrmspro.com') {
              console.log("Forcing Admin Role for: ", user.email);
              userData.role = 'admin';
            }

            // Merge Auth info with Firestore info
            setCurrentUser({
              ...userData,
              uid: user.uid,
              id: user.uid, // Always use UID as the primary ID for database consistency
              email: user.email,
              legacyId: userData.id // Preserve legacy ID if needed
            });
          } else {
            // Fallback: If user exists in Auth but not in Firestore (should not happen in prod)
            // Fix for Admin Access: Check email to assign admin role if doc is missing
            const normalizedEmail = user.email ? user.email.toLowerCase().trim() : '';
            const role = normalizedEmail === 'admin@hrmspro.com' ? 'admin' : 'employee';
            if (role === 'admin') console.log("Forcing Admin Role (No Doc) for: ", user.email);

            setCurrentUser({
              uid: user.uid,
              id: user.uid, // Polyfill
              email: user.email,
              name: user.email ? user.email.split('@')[0] : 'User',
              role
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback: Hardcode admin role for admin email if DB fails
          const normalizedEmail = user.email ? user.email.toLowerCase().trim() : '';
          if (normalizedEmail === 'admin@hrmspro.com') {
            setCurrentUser({ uid: user.uid, email: user.email, role: 'admin' });
          } else {
            setCurrentUser({ uid: user.uid, email: user.email, role: 'employee' });
          }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
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
      setAttendance(attData);
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
      const bankData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), employeeId: doc.id })); // Assuming doc ID is employeeId
      setAllBankAccounts(bankData);
    });

    // Subscribe to Leave Types
    const unsubLeaveTypes = onSnapshot(collection(db, 'leaveTypes'), (snapshot) => {
      const types = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllLeaveTypes(types);
    });

    // Subscribe to Leave Policy (Single doc)
    const unsubPolicy = onSnapshot(doc(db, 'settings', 'leavePolicy'), (docSnap) => {
      if (docSnap.exists()) {
        setLeavePolicy(docSnap.data());
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
      unsubPolicy();
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
        if (daysPresent >= 15) {
          accruedPL += 1.0;
          accruedCL += 0.5;
        }
      });

      // 2. Calculate Used Leaves
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
  }, [attendance, leaves, allUsers, loading]);


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

  // THEME
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // CLOCK IN
  const clockIn = async (employeeId) => {
    // IP Check
    if (checkModuleAccess('attendance') && !ipValidation.allowed) {
      return { success: false, message: ipValidation.message };
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const clockInTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Check if already clocked in today (Local state first for speed/permissions)
    const existingInState = attendance.find(a => String(a.employeeId) === String(employeeId) && a.date === today);
    if (existingInState && existingInState.clockIn) {
      console.log("Found existing record in state:", existingInState);
      return { success: false, message: 'Already clocked in today' };
    }

    const docId = `${employeeId}_${today}`;
    const docRef = doc(db, 'attendance', docId);

    try {
      // Secondary check via getDoc (handles cases where state might be filtering or slow)
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().clockIn) {
        return { success: false, message: 'Already clocked in today (DB)' };
      }

      console.log("Attempting Clock In - Doc ID:", docId);

      const newRecord = {
        employeeId,
        date: today,
        clockIn: clockInTime,
        clockOut: null,
        status: clockInTime > '09:15' ? 'Late' : 'Present',
        workHours: 0,
        overtime: 0,
        createdAt: serverTimestamp()
      };

      // Roster Logic for Status
      const todayRoster = rosters.find(r => String(r.employeeId) === String(employeeId) && r.date === today);
      if (todayRoster) {
        const result = calculateAttendanceStatus(clockInTime, null, today, todayRoster);
        newRecord.status = result.status;
        newRecord.ruleApplied = result.ruleApplied;
      }

      await setDoc(docRef, newRecord);
      console.log("Clock In Success");
      return { success: true, message: 'Clocked in successfully', time: clockInTime };
    } catch (error) {
      console.error("ClockIn Error Details:", error);
      return { success: false, message: `Failed to clock in: ${error.message || 'Unknown error'}` };
    }
  };

  // CLOCK OUT
  const clockOut = async (employeeId) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const clockOutTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const record = attendance.find(a => String(a.employeeId) === String(employeeId) && a.date === today);

    if (!record || !record.clockIn) {
      return { success: false, message: 'Please clock in first' };
    }
    if (record.clockOut) {
      return { success: false, message: 'Already clocked out today' };
    }

    try {
      const todayRoster = rosters.find(r => String(r.employeeId) === String(employeeId) && r.date === today);
      const result = calculateAttendanceStatus(record.clockIn, clockOutTime, today, todayRoster);

      const updates = {
        clockOut: clockOutTime,
        workHours: parseFloat(result.workHours || 0),
        status: result.status,
        workingDays: result.workingDays,
        ruleApplied: result.ruleApplied || null,
        overtime: result.workHours > 9 ? parseFloat((result.workHours - 9).toFixed(2)) : 0
      };

      console.log("Attempting Clock Out - Doc ID:", record.id, "updates:", updates);
      const docRef = doc(db, 'attendance', record.id);
      await updateDoc(docRef, updates);
      console.log("Clock Out Success");
      return { success: true, message: 'Clocked out successfully', time: clockOutTime };

    } catch (error) {
      console.error("ClockOut Error Details:", error);
      return { success: false, message: 'Failed to clock out: ' + (error.message || 'Unknown error') };
    }
  };

  // APPLY LEAVE
  const applyLeave = async (leaveData) => {
    try {
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
      await updateDoc(docRef, { status, approvedBy });
      return { success: true, message: `Leave ${status.toLowerCase()} successfully` };
    } catch (error) {
      return { success: false, message: 'Update failed' };
    }
  };

  // ROSTER - ASSIGN
  const assignRoster = async (rosterData) => {
    const { employeeIds, startDate, endDate, ...rest } = rosterData;
    // Batch writes recommended for efficiency, but simple loop for now
    try {
      const promises = [];
      employeeIds.forEach(empId => {
        // We need name for display. Find in allUsers
        const employee = allUsers.find(u => u.id === empId || u.uid === empId);
        const employeeName = employee?.name || 'Unknown';

        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);

          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            promises.push(addDoc(collection(db, 'rosters'), {
              ...rest,
              employeeId: empId,
              employeeName,
              date: dateStr,
              assignedAt: serverTimestamp()
            }));
          }
        } else {
          // Single Date logic if applicable (UI mostly sends ranges)
          promises.push(addDoc(collection(db, 'rosters'), {
            ...rest,
            employeeId: empId,
            employeeName,
            date: rosterData.date || startDate, // fallback
            assignedAt: serverTimestamp()
          }));
        }
      });

      await Promise.all(promises);
      return { success: true, message: `Roster assigned successfully` };

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
      await updateDoc(doc(db, 'rosters', id), updatedData);
      return { success: true, message: 'Roster updated successfully' };
    } catch (error) {
      return { success: false, message: 'Update failed' };
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
      return { success: false, message: 'Error adding user: ' + e.message };
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

  // For direct password override (if admin provides temporary password):
  const forceUpdatePassword = async (email, oldPassword, newPassword) => {
    let secondaryApp = null;
    try {
      secondaryApp = initializeApp(firebaseConfig, "PasswordResetApp");
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await signInWithEmailAndPassword(secondaryAuth, email, oldPassword);
      await updatePassword(userCredential.user, newPassword);

      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);
      return { success: true, message: 'Password updated successfully' };
    } catch (e) {
      if (secondaryApp) await deleteApp(secondaryApp);
      return { success: false, message: 'Update failed: ' + e.message };
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
      await deleteDoc(doc(db, 'users', userId));
      return { success: true, message: 'User deleted' };
    } catch (e) { return { success: false, message: 'Delete failed' }; }
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
    addAnnouncement,
    deleteAnnouncement,
    addUser,
    updateUser,
    updateUserProfile: updateUser,
    resetPassword,
    forceUpdatePassword,
    changePassword,
    updateUserId,
    deleteUser,
    assignRoster,
    deleteRoster,
    updateRoster,
    updateLeavePolicy,
    addLeaveType,
    deleteLeaveType,
    allLeaveTypes,
    leavePolicy,
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
    }
  };

  return <AuthContext.Provider value={value}>{loading ? <div className="h-screen w-full flex items-center justify-center">Loading Firebase...</div> : children}</AuthContext.Provider>;
};
