import React, { useState } from 'react';
import { Card, Button } from '../components/UI';
import { Save, Eye, EyeOff } from 'lucide-react';

const DashboardSettings = () => {
  const [widgets, setWidgets] = useState(() => {
    const saved = localStorage.getItem('dashboardWidgets');
    return saved ? JSON.parse(saved) : {
      totalEmployees: true,
      presentToday: true,
      onLeave: true,
      pendingApprovals: true,
      attendanceChart: true,
      leaveRequests: true,
      recentActivities: true,
      departmentStats: true,
      quickActions: true
    };
  });

  const widgetsList = [
    { key: 'totalEmployees', label: 'Total Employees', description: 'Display total employee count' },
    { key: 'presentToday', label: 'Present Today', description: 'Show employees present today' },
    { key: 'onLeave', label: 'On Leave', description: 'Display employees on leave' },
    { key: 'pendingApprovals', label: 'Pending Approvals', description: 'Show pending leave approvals' },
    { key: 'attendanceChart', label: 'Attendance Chart', description: 'Display attendance statistics chart' },
    { key: 'leaveRequests', label: 'Leave Requests', description: 'Show recent leave requests' },
    { key: 'recentActivities', label: 'Recent Activities', description: 'Display recent system activities' },
    { key: 'departmentStats', label: 'Department Statistics', description: 'Show department-wise stats' },
    { key: 'quickActions', label: 'Quick Actions', description: 'Display quick action buttons' }
  ];

  const toggleWidget = (key) => {
    setWidgets({ ...widgets, [key]: !widgets[key] });
  };

  const handleSave = () => {
    localStorage.setItem('dashboardWidgets', JSON.stringify(widgets));
    alert('Dashboard settings saved successfully!');
  };

  const enableAll = () => {
    const allEnabled = {};
    widgetsList.forEach(w => allEnabled[w.key] = true);
    setWidgets(allEnabled);
  };

  const disableAll = () => {
    const allDisabled = {};
    widgetsList.forEach(w => allDisabled[w.key] = false);
    setWidgets(allDisabled);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard Settings</h1>
        <div className="flex gap-2">
          <Button onClick={enableAll} variant="secondary">
            <Eye size={18} className="inline mr-2" />
            Enable All
          </Button>
          <Button onClick={disableAll} variant="secondary">
            <EyeOff size={18} className="inline mr-2" />
            Disable All
          </Button>
          <Button onClick={handleSave}>
            <Save size={18} className="inline mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      <Card title="Customize Dashboard Widgets">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select which widgets to display on the admin dashboard. Changes will be applied after saving.
        </p>
        
        <div className="space-y-3">
          {widgetsList.map(widget => (
            <div
              key={widget.key}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{widget.label}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">{widget.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={widgets[widget.key]}
                  onChange={() => toggleWidget(widget.key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DashboardSettings;
