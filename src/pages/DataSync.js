import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { Download, Upload } from 'lucide-react';

const DataSync = () => {
  const { currentUser } = useAuth();

  const exportData = () => {
    const data = {
      users: localStorage.getItem('users'),
      attendance: localStorage.getItem('attendance'),
      leaves: localStorage.getItem('leaves'),
      leaveBalances: localStorage.getItem('leaveBalances'),
      documents: localStorage.getItem('documents'),
      bankAccounts: localStorage.getItem('bankAccounts'),
      announcements: localStorage.getItem('announcements'),
      departments: localStorage.getItem('departments'),
      leaveTypes: localStorage.getItem('leaveTypes'),
      attendanceRules: localStorage.getItem('attendanceRules'),
      ipRestrictions: localStorage.getItem('ipRestrictions'),
      exitedEmployeeIds: localStorage.getItem('exitedEmployeeIds')
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hrms-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        Object.entries(data).forEach(([key, value]) => {
          if (value) localStorage.setItem(key, value);
        });
        alert('Data imported successfully! Please refresh the page.');
      } catch (error) {
        alert('Error importing data: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  if (currentUser.role !== 'Admin' && currentUser.role !== 'admin') {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Access denied. Admin only.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Data Sync</h1>

      <Card title="Export/Import Data">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Export Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Download all HRMS data to sync with other devices
            </p>
            <Button onClick={exportData} variant="primary">
              <Download size={16} className="inline mr-2" />Export All Data
            </Button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Import Data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload data file from another device
            </p>
            <label className="inline-block">
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
                id="import-file"
              />
              <Button variant="secondary" onClick={() => document.getElementById('import-file').click()}>
                <Upload size={16} className="inline mr-2" />Import Data
              </Button>
            </label>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> After importing data, refresh the page to see changes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DataSync;
