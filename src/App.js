import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import LeavePolicy from './pages/LeavePolicy';
import EmployeeDirectory from './pages/EmployeeDirectory';
import Documents from './pages/Documents';
import Onboarding from './pages/Onboarding';
import Deboarding from './pages/Deboarding';
import BankAccount from './pages/BankAccount';
import Approvals from './pages/Approvals';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import BiometricConfig from './pages/BiometricConfig';
import ReportingHierarchy from './pages/ReportingHierarchy';
import BulletinBoard from './pages/BulletinBoard';
import Payslips from './pages/Payslips';
import Payroll from './pages/Payroll';
import SalarySlipTemplate from './pages/SalarySlipTemplate';
import Departments from './pages/Departments';
import DashboardSettings from './pages/DashboardSettings';
import AttendanceRegularization from './pages/AttendanceRegularization';
import AttendanceRules from './pages/AttendanceRules';
import AdminManagement from './pages/AdminManagement';
import DataSync from './pages/DataSync';
import UserManagement from './pages/UserManagement';
import IPRestrictions from './pages/IPRestrictions';
import IPAccessLogs from './pages/IPAccessLogs';
import Profile from './pages/Profile';
import Roster from './pages/Roster';
import AttendanceDebug from './pages/AttendanceDebug';
import RosterFix from './pages/RosterFix';
import { Spinner } from './components/UI';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route
        path="/"
        element={<Navigate to={currentUser ? "/dashboard" : "/login"} />}
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <PrivateRoute>
            <Layout>
              <Attendance />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/attendance-regularization"
        element={
          <PrivateRoute>
            <Layout>
              <AttendanceRegularization />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/attendance-rules"
        element={
          <PrivateRoute>
            <Layout>
              <AttendanceRules />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/admin-management"
        element={
          <PrivateRoute>
            <Layout>
              <AdminManagement />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/data-sync"
        element={
          <PrivateRoute>
            <Layout>
              <DataSync />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/leave"
        element={
          <PrivateRoute>
            <Layout>
              <LeaveManagement />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/leave-policy"
        element={
          <PrivateRoute>
            <Layout>
              <LeavePolicy />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <PrivateRoute>
            <Layout>
              <EmployeeDirectory />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <PrivateRoute>
            <Layout>
              <Documents />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <PrivateRoute>
            <Layout>
              <Onboarding />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/deboarding"
        element={
          <PrivateRoute>
            <Layout>
              <Deboarding />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/bank-account"
        element={
          <PrivateRoute>
            <Layout>
              <BankAccount />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <PrivateRoute>
            <Layout>
              <Approvals />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PrivateRoute>
            <Layout>
              <Reports />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Layout>
              <Settings />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/biometric-config"
        element={
          <PrivateRoute>
            <Layout>
              <BiometricConfig />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/reporting-hierarchy"
        element={
          <PrivateRoute>
            <Layout>
              <ReportingHierarchy />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/bulletin-board"
        element={
          <PrivateRoute>
            <Layout>
              <BulletinBoard />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/roster"
        element={
          <PrivateRoute>
            <Layout>
              <Roster />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/payslips"
        element={
          <PrivateRoute>
            <Layout>
              <Payslips />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <PrivateRoute>
            <Layout>
              <Payroll />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/salary-slip-template"
        element={
          <PrivateRoute>
            <Layout>
              <SalarySlipTemplate />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <PrivateRoute>
            <Layout>
              <Departments />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard-settings"
        element={
          <PrivateRoute>
            <Layout>
              <DashboardSettings />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/user-management"
        element={
          <PrivateRoute>
            <Layout>
              <UserManagement />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Layout>
              <Profile />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/ip-restrictions"
        element={
          <PrivateRoute>
            <Layout>
              <IPRestrictions />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/ip-access-logs"
        element={
          <PrivateRoute>
            <Layout>
              <IPAccessLogs />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/attendance-debug"
        element={
          <PrivateRoute>
            <Layout>
              <AttendanceDebug />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/roster-fix"
        element={
          <PrivateRoute>
            <Layout>
              <RosterFix />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
