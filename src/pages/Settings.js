import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Alert } from '../components/UI';
import { Settings as SettingsIcon, Shield, Bell, Database } from 'lucide-react';

const Settings = () => {
  const { currentUser, toggleTheme, theme } = useAuth();
  const [alert, setAlert] = useState(null);

  const handleSave = () => {
    setAlert({ type: 'success', message: 'Settings saved successfully' });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">System Settings</h1>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Appearance">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-800 dark:text-white">Theme</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Current: {theme === 'light' ? 'Light' : 'Dark'} Mode
                </p>
              </div>
              <Button onClick={toggleTheme} variant="secondary">
                Toggle Theme
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Notifications">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell size={20} className="text-gray-400" />
                <span className="text-sm text-gray-800 dark:text-white">Email Notifications</span>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell size={20} className="text-gray-400" />
                <span className="text-sm text-gray-800 dark:text-white">Leave Approval Alerts</span>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Bell size={20} className="text-gray-400" />
                <span className="text-sm text-gray-800 dark:text-white">Attendance Reminders</span>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
          </div>
        </Card>

        <Card title="Security">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Shield size={20} className="text-gray-400" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
              </div>
            </div>
            <Button variant="secondary" className="w-full">Change Password</Button>
          </div>
        </Card>

        <Card title="Data Management">
          <div className="space-y-3">
            <Button variant="secondary" className="w-full">
              <Database size={16} className="inline mr-2" />
              Export All Data
            </Button>
            <Button variant="secondary" className="w-full">
              <Database size={16} className="inline mr-2" />
              Backup Database
            </Button>
            <Button variant="danger" className="w-full">
              Clear Cache
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card title="System Information">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Version</p>
              <p className="font-medium text-gray-800 dark:text-white">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
              <p className="font-medium text-gray-800 dark:text-white">2024-01-15</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Database Status</p>
              <p className="font-medium text-green-600">Connected</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Storage Used</p>
              <p className="font-medium text-gray-800 dark:text-white">2.5 MB</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
