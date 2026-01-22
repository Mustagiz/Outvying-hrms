import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, Table } from '../components/UI';
import { Shield, Plus, Trash2, Save } from 'lucide-react';

const IPRestrictions = () => {
  const { currentUser, ipSettings, updateIPSettings } = useAuth();

  const [enabled, setEnabled] = useState(false);
  const [ipList, setIpList] = useState([]);
  const [newIP, setNewIP] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [modules, setModules] = useState({
    employeePortal: false,
    attendance: true,
    leaveRequests: true,
    payslip: false
  });
  const [blockMessage, setBlockMessage] = useState('Access denied. Please connect from office network or approved VPN.');

  // Sync local UI state with Firestore settings
  useEffect(() => {
    if (ipSettings) {
      setEnabled(ipSettings.enabled || false);
      setIpList(ipSettings.ipList || []);
      setModules(ipSettings.modules || { employeePortal: false, attendance: true, leaveRequests: true, payslip: false });
      setBlockMessage(ipSettings.blockMessage || 'Access denied. Please connect from office network or approved VPN.');
    }
  }, [ipSettings]);

  const saveConfig = async () => {
    const newSettings = { enabled, ipList, modules, blockMessage };
    const result = await updateIPSettings(newSettings);
    if (result.success) {
      alert('IP restrictions saved successfully to Firestore');
    } else {
      alert('Failed to save: ' + result.message);
    }
  };

  const addIP = () => {
    if (!newIP.trim()) return;
    setIpList([...ipList, { ip: newIP.trim(), label: newLabel.trim() || 'Unlabeled' }]);
    setNewIP('');
    setNewLabel('');
  };

  const removeIP = (index) => {
    setIpList(ipList.filter((_, i) => i !== index));
  };

  if (currentUser.role !== 'Admin' && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Access denied. Admin only.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">IP Restrictions</h1>

      <Card title="IP Whitelist Management">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5"
            />
            <label className="text-lg font-semibold text-gray-800 dark:text-white">Enable IP Restrictions</label>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Allowed IP Addresses/Ranges</h3>
            <div className="space-y-2 mb-4">
              {ipList.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <span className="font-mono text-gray-800 dark:text-white">{item.ip}</span>
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">({item.label})</span>
                  </div>
                  <Button onClick={() => removeIP(index)} variant="danger" className="text-xs py-1 px-2">
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="IP Address/Range (e.g., 192.168.1.0/24)"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                type="text"
                placeholder="Label (e.g., Office Floor 1)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <Button onClick={addIP} variant="primary">
                <Plus size={16} className="inline mr-1" />Add
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Apply Restrictions To</h3>
            <div className="space-y-2">
              {Object.entries(modules).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setModules({ ...modules, [key]: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label className="text-gray-700 dark:text-gray-300">
                    {key === 'employeePortal' ? 'Employee Portal' :
                      key === 'attendance' ? 'Attendance Module' :
                        key === 'leaveRequests' ? 'Leave Requests' :
                          'Payslip Download'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Block Message</h3>
            <textarea
              value={blockMessage}
              onChange={(e) => setBlockMessage(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <Button onClick={saveConfig} variant="primary">
            <Save size={16} className="inline mr-2" />Save Configuration
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default IPRestrictions;
