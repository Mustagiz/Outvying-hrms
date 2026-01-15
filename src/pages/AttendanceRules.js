import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal } from '../components/UI';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';

const AttendanceRules = () => {
  const { currentUser } = useAuth();
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    fullDayHours: 8.0,
    halfDayHours: 4.0,
    minPresentHours: 1.0,
    gracePeriodMins: 15,
    saturdayHalfDay: false,
    holidayAutoFull: false,
    wfhWebCheckin: false,
    departments: 'All'
  });

  useEffect(() => {
    const savedRules = JSON.parse(localStorage.getItem('attendanceRules') || '[]');
    if (savedRules.length === 0) {
      const defaultRule = {
        id: 1,
        name: 'Standard Office',
        fullDayHours: 8.0,
        halfDayHours: 4.0,
        minPresentHours: 1.0,
        gracePeriodMins: 15,
        saturdayHalfDay: false,
        holidayAutoFull: false,
        wfhWebCheckin: false,
        departments: 'All',
        isDefault: true
      };
      setRules([defaultRule]);
      localStorage.setItem('attendanceRules', JSON.stringify([defaultRule]));
    } else {
      setRules(savedRules);
    }
  }, []);

  const openModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData(rule);
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        fullDayHours: 8.0,
        halfDayHours: 4.0,
        minPresentHours: 1.0,
        gracePeriodMins: 15,
        saturdayHalfDay: false,
        holidayAutoFull: false,
        wfhWebCheckin: false,
        departments: 'All'
      });
    }
    setShowModal(true);
  };

  const saveRule = () => {
    if (!formData.name.trim()) {
      alert('Please enter rule name');
      return;
    }

    let updatedRules;
    if (editingRule) {
      updatedRules = rules.map(r => r.id === editingRule.id ? { ...formData, id: editingRule.id } : r);
    } else {
      const newRule = { ...formData, id: Date.now(), isDefault: false };
      updatedRules = [...rules, newRule];
    }

    setRules(updatedRules);
    localStorage.setItem('attendanceRules', JSON.stringify(updatedRules));
    setShowModal(false);
  };

  const deleteRule = (id) => {
    const rule = rules.find(r => r.id === id);
    if (rule?.isDefault) {
      alert('Cannot delete default rule');
      return;
    }
    if (window.confirm('Delete this rule?')) {
      const updatedRules = rules.filter(r => r.id !== id);
      setRules(updatedRules);
      localStorage.setItem('attendanceRules', JSON.stringify(updatedRules));
    }
  };

  if (currentUser.role !== 'Admin' && currentUser.role !== 'admin') {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Access denied. Admin only.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Attendance Rules</h1>
        <Button onClick={() => openModal()} variant="primary">
          <Plus size={16} className="inline mr-2" />New Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rules.map(rule => (
          <Card key={rule.id}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{rule.name}</h3>
                {rule.isDefault && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>}
              </div>
              <div className="flex gap-2">
                <Button onClick={() => openModal(rule)} variant="secondary" className="text-xs py-1 px-2">
                  <Edit2 size={14} />
                </Button>
                {!rule.isDefault && (
                  <Button onClick={() => deleteRule(rule.id)} variant="danger" className="text-xs py-1 px-2">
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Full Day:</span>
                <span className="font-semibold text-gray-800 dark:text-white">{rule.fullDayHours} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Half Day:</span>
                <span className="font-semibold text-gray-800 dark:text-white">{rule.halfDayHours} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Min Present:</span>
                <span className="font-semibold text-gray-800 dark:text-white">{rule.minPresentHours} hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Grace Period:</span>
                <span className="font-semibold text-gray-800 dark:text-white">{rule.gracePeriodMins} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Departments:</span>
                <span className="font-semibold text-gray-800 dark:text-white">{rule.departments}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRule ? 'Edit Rule' : 'New Rule'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="e.g., Flexi-Shift Policy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Day (hours)</label>
              <input
                type="number"
                step="0.1"
                value={formData.fullDayHours}
                onChange={(e) => setFormData({ ...formData, fullDayHours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Half Day (hours)</label>
              <input
                type="number"
                step="0.1"
                value={formData.halfDayHours}
                onChange={(e) => setFormData({ ...formData, halfDayHours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Present (hours)</label>
              <input
                type="number"
                step="0.1"
                value={formData.minPresentHours}
                onChange={(e) => setFormData({ ...formData, minPresentHours: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grace Period (mins)</label>
              <input
                type="number"
                value={formData.gracePeriodMins}
                onChange={(e) => setFormData({ ...formData, gracePeriodMins: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exceptions</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.saturdayHalfDay}
                  onChange={(e) => setFormData({ ...formData, saturdayHalfDay: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Saturday: Half day = 4hrs</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.holidayAutoFull}
                  onChange={(e) => setFormData({ ...formData, holidayAutoFull: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Holidays: Auto Full Day</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.wfhWebCheckin}
                  onChange={(e) => setFormData({ ...formData, wfhWebCheckin: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">WFH Days: Hours from web check-in</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Departments</label>
            <input
              type="text"
              value={formData.departments}
              onChange={(e) => setFormData({ ...formData, departments: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="All, IT, HR, etc."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setShowModal(false)} variant="secondary">Cancel</Button>
            <Button onClick={saveRule} variant="primary">
              <Save size={16} className="inline mr-2" />Save Rule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceRules;
