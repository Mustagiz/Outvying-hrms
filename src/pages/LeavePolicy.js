import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Alert, Modal } from '../components/UI';
import { Calendar, Gift, Globe, Plus, Trash2 } from 'lucide-react';

const LeavePolicy = () => {
  const {
    leavePolicy: fbPolicy,
    allLeaveTypes,
    updateLeavePolicy,
    addLeaveType,
    deleteLeaveType,
    holidays,
    addHoliday,
    deleteHoliday
  } = useAuth();

  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({ name: '', description: '' });
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'Indian Holiday' }); // 'Indian Holiday' | 'US Holiday'

  const [policy, setPolicy] = useState({
    annualLeaves: 18,
    monthlyAccrual: 1.5,
    workingDaysRequired: 15
  });

  // Keep local state in sync with Firestore
  useEffect(() => {
    if (fbPolicy) setPolicy(fbPolicy);
  }, [fbPolicy]);

  const indianHolidays = holidays.filter(h => h.type === 'Indian Holiday');
  const usHolidays = holidays.filter(h => h.type === 'US Holiday');

  const handleSave = async () => {
    const result = await updateLeavePolicy(policy);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleAddLeaveType = async () => {
    if (!newLeaveType.name) return;
    const result = await addLeaveType(newLeaveType);
    if (result.success) {
      setNewLeaveType({ name: '', description: '' });
      setShowModal(false);
    } else {
      setAlert({ type: 'error', message: result.message });
    }
  };

  const handleDeleteLeaveType = async (id) => {
    if (window.confirm('Delete this leave type?')) {
      await deleteLeaveType(id);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.name || !newHoliday.date) return;
    const result = await addHoliday(newHoliday);
    if (result.success) {
      setNewHoliday({ name: '', date: '', type: 'Indian Holiday' });
      setShowHolidayModal(false);
    } else {
      setAlert({ type: 'error', message: result.message });
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (window.confirm('Delete this holiday?')) {
      await deleteHoliday(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Leave Policy Management</h1>
        <Button onClick={() => setShowHolidayModal(true)} variant="primary" className="flex items-center gap-2">
          <Calendar size={18} /> Add Holiday
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Annual Leave Configuration">
          <div className="space-y-4">
            <Input
              label="Total Annual Leaves"
              type="number"
              value={policy.annualLeaves}
              onChange={(e) => setPolicy({ ...policy, annualLeaves: e.target.value })}
            />
            <Input
              label="Monthly Leave Accrual"
              type="number"
              step="0.5"
              value={policy.monthlyAccrual}
              onChange={(e) => setPolicy({ ...policy, monthlyAccrual: e.target.value })}
            />
            <Input
              label="Working Days Required for Accrual"
              type="number"
              value={policy.workingDaysRequired}
              onChange={(e) => setPolicy({ ...policy, workingDaysRequired: e.target.value })}
            />
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Policy:</strong> Employees receive {policy.monthlyAccrual} leaves per month after completing {policy.workingDaysRequired} working days. Total annual leaves: {policy.annualLeaves}
              </p>
            </div>
            <Button onClick={handleSave} className="w-full">Save Changes</Button>
          </div>
        </Card>

        <Card title="Leave Types">
          <Button onClick={() => setShowModal(true)} variant="secondary" className="mb-3 text-xs w-full sm:w-auto">
            <Plus size={14} className="inline mr-1" /> Add Leave Type
          </Button>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {allLeaveTypes.map((type) => (
              <div key={type.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 dark:text-white">{type.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDeleteLeaveType(type.id)} className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {allLeaveTypes.length === 0 && <p className="text-center text-gray-500 py-4">No leave types defined.</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Indian Holidays (Mandatory)">
          <div className="space-y-3">
            {indianHolidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-3">
                  <Gift className="text-green-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{holiday.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{holiday.date} • Mandatory</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteHoliday(holiday.id)} className="text-gray-400 hover:text-red-600 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {indianHolidays.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No mandatory holidays added.</p>}
          </div>
        </Card>

        <Card title="US Holidays (Optional)">
          <div className="space-y-3">
            {usHolidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-3">
                  <Globe className="text-blue-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{holiday.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{holiday.date} • Optional</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteHoliday(holiday.id)} className="text-gray-400 hover:text-red-600 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {usHolidays.length === 0 && <p className="text-sm text-gray-500 text-center py-2">No optional US holidays added.</p>}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-700 mt-2">
              <p className="text-xs text-center text-gray-500">
                US Holidays are optional. Employees working US shifts can request these.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Leave Policy Summary" className="mt-6">
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Annual Leave Quota:</strong> {policy.annualLeaves} leaves per year
            </p>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Monthly Accrual:</strong> {policy.monthlyAccrual} leaves per month after completing {policy.workingDaysRequired} working days
            </p>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Indian Holidays:</strong> {indianHolidays.length} mandatory holidays defined
            </p>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>US Holidays:</strong> {usHolidays.length} optional holidays defined
            </p>
          </div>
        </div>
      </Card>

      {/* Leave Type Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Leave Type">
        <div className="space-y-4">
          <Input
            label="Leave Type Name"
            value={newLeaveType.name}
            onChange={(e) => setNewLeaveType({ ...newLeaveType, name: e.target.value })}
            placeholder="e.g., Sick Leave"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea
              value={newLeaveType.description}
              onChange={(e) => setNewLeaveType({ ...newLeaveType, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
            />
          </div>
          <Button onClick={handleAddLeaveType} className="w-full">Add Leave Type</Button>
        </div>
      </Modal>

      {/* Add Holiday Modal */}
      <Modal isOpen={showHolidayModal} onClose={() => setShowHolidayModal(false)} title="Add Holiday">
        <div className="space-y-4">
          <Input
            label="Holiday Name"
            value={newHoliday.name}
            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
            placeholder="e.g., Independence Day"
          />
          <Input
            label="Date"
            type="date"
            value={newHoliday.date}
            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Holiday Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setNewHoliday({ ...newHoliday, type: 'Indian Holiday' })}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${newHoliday.type === 'Indian Holiday'
                  ? 'border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                🇮🇳 Indian (Mandatory)
              </button>
              <button
                type="button"
                onClick={() => setNewHoliday({ ...newHoliday, type: 'US Holiday' })}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${newHoliday.type === 'US Holiday'
                  ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                🇺🇸 US (Optional)
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {newHoliday.type === 'Indian Holiday'
                ? 'Mandatory for all employees unless they are on US shift.'
                : 'Optional holiday. Employees can request to take this off.'}
            </p>
          </div>
          <Button onClick={handleAddHoliday} className="w-full">Add Holiday</Button>
        </div>
      </Modal>
    </div>
  );
};

export default LeavePolicy;
