import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Alert } from '../components/UI';
import { Settings as SettingsIcon, Shield, Bell, Database } from 'lucide-react';

const Settings = () => {
  const { currentUser, toggleTheme, theme, repairAdminProfile } = useAuth();
  const [alert, setAlert] = useState(null);

  const handleSave = () => {
    setAlert({ type: 'success', message: 'Settings saved successfully' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleRepair = async () => {
    if (window.confirm('This will attempt to repair your Admin profile in the database. Continue?')) {
      const result = await repairAdminProfile();
      setAlert({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      setTimeout(() => setAlert(null), 5000);
    }
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

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Troubleshooting</p>
              <Button
                onClick={handleRepair}
                variant="secondary"
                className="w-full text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400"
              >
                <Shield size={16} className="inline mr-2" />
                Repair Admin Permissions
              </Button>
            </div>
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
