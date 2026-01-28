import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Spinner } from './components/UI';
import { ToastProvider } from './utils/toast';
import GlobalSearch from './components/GlobalSearch';

// Lazy load pages
const Layout = lazy(() => import('./components/Layout'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Attendance = lazy(() => import('./pages/Attendance'));
const LeaveManagement = lazy(() => import('./pages/LeaveManagement'));
const LeavePolicy = lazy(() => import('./pages/LeavePolicy'));
const EmployeeDirectory = lazy(() => import('./pages/EmployeeDirectory'));
const Documents = lazy(() => import('./pages/Documents'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Deboarding = lazy(() => import('./pages/Deboarding'));
const BankAccount = lazy(() => import('./pages/BankAccount'));
const Approvals = lazy(() => import('./pages/Approvals'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const BiometricConfig = lazy(() => import('./pages/BiometricConfig'));
const ReportingHierarchy = lazy(() => import('./pages/ReportingHierarchy'));
const BulletinBoard = lazy(() => import('./pages/BulletinBoard'));
const Payslips = lazy(() => import('./pages/Payslips'));
const Payroll = lazy(() => import('./pages/Payroll'));
const SalarySlipTemplate = lazy(() => import('./pages/SalarySlipTemplate'));
const Departments = lazy(() => import('./pages/Departments'));
const DashboardSettings = lazy(() => import('./pages/DashboardSettings'));
const AttendanceRegularization = lazy(() => import('./pages/AttendanceRegularization'));
const AttendanceRules = lazy(() => import('./pages/AttendanceRules'));
const AdminManagement = lazy(() => import('./pages/AdminManagement'));
const DataSync = lazy(() => import('./pages/DataSync'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const IPRestrictions = lazy(() => import('./pages/IPRestrictions'));
const IPAccessLogs = lazy(() => import('./pages/IPAccessLogs'));
const Profile = lazy(() => import('./pages/Profile'));
const Roster = lazy(() => import('./pages/Roster'));
const AttendanceDebug = lazy(() => import('./pages/AttendanceDebug'));
const RosterFix = lazy(() => import('./pages/RosterFix'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const WebhookSettings = lazy(() => import('./pages/WebhookSettings'));
const PerformanceManagement = lazy(() => import('./pages/PerformanceManagement'));
const Workflows = lazy(() => import('./pages/Workflows'));
const AIChatbot = lazy(() => import('./components/AIChatbot'));
const Permissions = lazy(() => import('./pages/Permissions'));
const CultureHub = lazy(() => import('./pages/CultureHub'));
const VirtualOnboarding = lazy(() => import('./pages/VirtualOnboarding'));

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
      <Route
        path="/audit-logs"
        element={
          <PrivateRoute>
            <Layout>
              <AuditLogs />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/performance"
        element={
          <PrivateRoute>
            <Layout>
              <PerformanceManagement />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/webhooks"
        element={
          <PrivateRoute>
            <Layout>
              <WebhookSettings />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/permissions"
        element={
          <PrivateRoute>
            <Layout>
              <Permissions />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/culture"
        element={
          <PrivateRoute>
            <Layout>
              <CultureHub />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="/orientation"
        element={
          <PrivateRoute>
            <Layout>
              <VirtualOnboarding />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>

  );
};

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="flex flex-col items-center gap-4">
      <Spinner size="lg" />
      <p className="text-sm font-bold text-primary-600 animate-pulse tracking-widest uppercase">Optimizing Experience...</p>
    </div>
  </div>
);

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global keyboard shortcut for search
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<LoadingScreen />}>
            <AppRoutes />
            <GlobalSearch
              isOpen={isSearchOpen}
              onClose={() => setIsSearchOpen(false)}
            />
            <AIChatbot />
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
