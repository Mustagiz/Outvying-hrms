import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Alert } from '../components/UI';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const AttendanceRules = () => {
  const { currentUser, attendanceRules } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    fullDayHours: 8.0,
    halfDayHours: 4.0,
    minPresentHours: 1.0,
    gracePeriodMins: 5,
    saturdayHalfDay: false,
    holidayAutoFull: false,
    wfhWebCheckin: false,
    departments: 'All',
    isUniversal: false
  });

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
        gracePeriodMins: 5,
        saturdayHalfDay: false,
        holidayAutoFull: false,
        wfhWebCheckin: false,
        departments: 'All',
        isUniversal: false
      });
    }
    setShowModal(true);
  };

  const saveRule = async () => {
    if (!formData.name.trim()) {
      setAlert({ type: 'error', message: 'Please enter rule name' });
      return;
    }

    try {
      if (editingRule) {
        const docRef = doc(db, 'attendanceRules', editingRule.id);
        const { id, ...saveData } = formData;
        await updateDoc(docRef, { ...saveData, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, 'attendanceRules'), {
          ...formData,
          createdAt: serverTimestamp(),
          isDefault: attendanceRules.length === 0
        });
      }
      setShowModal(false);
      setAlert({ type: 'success', message: 'Rule saved successfully' });
      setTimeout(() => setAlert(null), 3000);
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to save rule: ' + error.message });
    }
  };

  const deleteRule = async (id) => {
    const rule = attendanceRules.find(r => r.id === id);
    if (rule?.isDefault) {
      setAlert({ type: 'error', message: 'Cannot delete default rule' });
      return;
    }
    if (window.confirm('Delete this rule?')) {
      try {
        await deleteDoc(doc(db, 'attendanceRules', id));
        setAlert({ type: 'success', message: 'Rule deleted' });
        setTimeout(() => setAlert(null), 3000);
      } catch (error) {
        setAlert({ type: 'error', message: 'Delete failed: ' + error.message });
      }
    }
  };

  if (currentUser.role !== 'Admin' && currentUser.role !== 'admin') {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Access denied. Admin only.</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Attendance Rules</h1>
        <Button onClick={() => openModal()} variant="primary">
          <Plus size={16} className="inline mr-2" />New Rule
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {attendanceRules.map(rule => (
          <Card key={rule.id} className="border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{rule.name}</h3>
                <div className="flex gap-2 mt-1">
                  {rule.isDefault && <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Default</span>}
                  {rule.isUniversal && <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Universal</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => openModal(rule)} variant="secondary" className="p-2 h-8 w-8">
                  <Edit2 size={14} />
                </Button>
                {!rule.isDefault && (
                  <Button onClick={() => deleteRule(rule.id)} variant="danger" className="p-2 h-8 w-8">
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-50 dark:border-gray-800 pb-2">
                <span className="text-gray-500">Full Day:</span>
                <span className="font-bold text-gray-800 dark:text-white">{rule.fullDayHours}h</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 dark:border-gray-800 pb-2">
                <span className="text-gray-500">Half Day:</span>
                <span className="font-bold text-gray-800 dark:text-white">{rule.halfDayHours}h</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 dark:border-gray-800 pb-2">
                <span className="text-gray-500">Grace Period:</span>
                <span className="font-bold text-gray-800 dark:text-white">{rule.gracePeriodMins} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Departments:</span>
                <span className="font-bold text-primary-600">{rule.departments}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRule ? 'Edit Rule' : 'New Rule'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Rule Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              placeholder="e.g., Standard Office Policy"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Day (hrs)</label>
              <input
                type="number"
                step="0.1"
                value={formData.fullDayHours}
                onChange={(e) => setFormData({ ...formData, fullDayHours: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Half Day (hrs)</label>
              <input
                type="number"
                step="0.1"
                value={formData.halfDayHours}
                onChange={(e) => setFormData({ ...formData, halfDayHours: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Min Present (hrs)</label>
              <input
                type="number"
                step="0.1"
                value={formData.minPresentHours}
                onChange={(e) => setFormData({ ...formData, minPresentHours: parseFloat(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Grace Period (m)</label>
              <input
                type="number"
                value={formData.gracePeriodMins}
                onChange={(e) => setFormData({ ...formData, gracePeriodMins: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isUniversal}
                onChange={(e) => setFormData({ ...formData, isUniversal: e.target.checked })}
                className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Apply to all departments</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.saturdayHalfDay}
                onChange={(e) => setFormData({ ...formData, saturdayHalfDay: e.target.checked })}
                className="w-5 h-5 rounded-lg border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">Saturdays are always Half Day</span>
            </label>
          </div>

          <div className="pt-6">
            <Button onClick={saveRule} className="w-full py-3 text-sm font-bold uppercase tracking-widest shadow-lg shadow-primary-500/20">
              <Save size={18} className="inline mr-2" />Save Attendance Policy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceRules;
