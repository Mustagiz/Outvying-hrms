import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, Users, Calendar, FileText, UserPlus, UserMinus, 
  Briefcase, DollarSign, CheckSquare, BarChart2, Settings, 
  LogOut, Menu, X, Sun, Moon, BookOpen, Fingerprint, Megaphone, UserCog, Wallet, CreditCard, Building, Shield 
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout, theme, toggleTheme } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = {
    employee: [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/attendance', icon: Calendar, label: 'Attendance' },
      { path: '/bank-account', icon: DollarSign, label: 'Bank Account' },
      { path: '/bulletin-board', icon: Megaphone, label: 'Bulletin Board' },
      { path: '/documents', icon: Briefcase, label: 'Documents' },
      { path: '/leave', icon: FileText, label: 'Leave Management' },
      { path: '/profile', icon: Users, label: 'My Profile' },
      { path: '/payslips', icon: DollarSign, label: 'Payslips' },
      { path: '/attendance-regularization', icon: CheckSquare, label: 'Regularization' }
    ],
    hr: [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/approvals', icon: CheckSquare, label: 'Approvals' },
      { path: '/attendance', icon: Calendar, label: 'Attendance' },
      { path: '/bulletin-board', icon: Megaphone, label: 'Bulletin Board' },
      { path: '/deboarding', icon: UserMinus, label: 'Deboarding' },
      { path: '/documents', icon: Briefcase, label: 'Documents' },
      { path: '/employees', icon: Users, label: 'Employee Directory' },
      { path: '/leave', icon: FileText, label: 'Leave Management' },
      { path: '/leave-policy', icon: BookOpen, label: 'Leave Policy' },
      { path: '/profile', icon: Users, label: 'My Profile' },
      { path: '/onboarding', icon: UserPlus, label: 'Onboarding' },
      { path: '/payslips', icon: DollarSign, label: 'Payslips' },
      { path: '/attendance-regularization', icon: CheckSquare, label: 'Regularization' },
      { path: '/reports', icon: BarChart2, label: 'Reports' }
    ],
    admin: [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/approvals', icon: CheckSquare, label: 'Approvals' },
      { path: '/attendance', icon: Calendar, label: 'Attendance' },
      { path: '/attendance-rules', icon: Settings, label: 'Attendance Rules' },
      { path: '/admin-management', icon: Shield, label: 'Admin Management' },
      { path: '/bank-account', icon: DollarSign, label: 'Bank Account Management' },
      { path: '/biometric-config', icon: Fingerprint, label: 'Biometric Config' },
      { path: '/bulletin-board', icon: Megaphone, label: 'Bulletin Board' },
      { path: '/dashboard-settings', icon: Settings, label: 'Dashboard Settings' },
      { path: '/data-sync', icon: Settings, label: 'Data Sync' },
      { path: '/deboarding', icon: UserMinus, label: 'Deboarding' },
      { path: '/departments', icon: Building, label: 'Departments' },
      { path: '/documents', icon: Briefcase, label: 'Documents' },
      { path: '/employees', icon: Users, label: 'Employee Directory' },
      { path: '/ip-access-logs', icon: BarChart2, label: 'IP Access Logs' },
      { path: '/ip-restrictions', icon: Shield, label: 'IP Restrictions' },
      { path: '/leave', icon: FileText, label: 'Leave Management' },
      { path: '/leave-policy', icon: BookOpen, label: 'Leave Policy' },
      { path: '/onboarding', icon: UserPlus, label: 'Onboarding' },
      { path: '/payroll', icon: Wallet, label: 'Payroll' },
      { path: '/payslips', icon: DollarSign, label: 'Payslips' },
      { path: '/attendance-regularization', icon: CheckSquare, label: 'Regularization' },
      { path: '/reporting-hierarchy', icon: Users, label: 'Reporting Hierarchy' },
      { path: '/reports', icon: BarChart2, label: 'Reports' },
      { path: '/salary-slip-template', icon: FileText, label: 'Salary Slip Template' },
      { path: '/settings', icon: Settings, label: 'Settings' },
      { path: '/user-management', icon: UserCog, label: 'User Management' }
    ]
  };

  const currentMenuItems = menuItems[currentUser?.role] || [];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary-600">Outvying HRMS</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {currentMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 w-full rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg md:text-2xl font-semibold text-gray-800 dark:text-white">
                  Welcome, {currentUser?.name?.split(' ')[0]}
                </h2>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  {currentUser?.designation}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm md:text-base">
                {currentUser?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
