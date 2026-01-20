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
    deleteLeaveType
  } = useAuth();

  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newLeaveType, setNewLeaveType] = useState({ name: '', description: '' });
  const [policy, setPolicy] = useState({
    annualLeaves: 18,
    monthlyAccrual: 1.5,
    workingDaysRequired: 15
  });

  // Keep local state in sync with Firestore
  useEffect(() => {
    if (fbPolicy) setPolicy(fbPolicy);
  }, [fbPolicy]);

  const indianHolidays = [
    { name: 'EID', type: 'Indian Holiday' },
    { name: 'Diwali', type: 'Indian Holiday' },
    { name: 'Christmas', type: 'Indian Holiday' }
  ];

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

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Leave Policy Management</h1>

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
          <Button onClick={() => setShowModal(true)} variant="secondary" className="mb-3 text-xs">
            <Plus size={14} className="inline mr-1" /> Add Leave Type
          </Button>
          <div className="space-y-3">
            {allLeaveTypes.map((type) => (
              <div key={type.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 dark:text-white">{type.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={20} className="text-primary-600" />
                    <button onClick={() => handleDeleteLeaveType(type.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Indian Holidays (Mandatory)">
          <div className="space-y-3">
            {indianHolidays.map((holiday, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Gift className="text-green-600" size={20} />
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{holiday.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{holiday.type}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="US Holidays (Optional)">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <Globe className="text-blue-600 mt-1" size={20} />
              <div>
                <p className="font-medium text-gray-800 dark:text-white mb-2">All US Federal Holidays</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Employees can optionally take US federal holidays. These are not mandatory and can be taken based on employee preference.
                </p>
              </div>
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
              <strong>Indian Holidays:</strong> 3 mandatory holidays - EID, Diwali, and Christmas
            </p>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>US Holidays:</strong> All US federal holidays are optional
            </p>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Leave Types:</strong> {allLeaveTypes.map(t => t.name).join(', ') || 'No custom types defined'}
            </p>
          </div>
        </div>
      </Card>

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
              placeholder="Enter description"
            />
          </div>
          <Button onClick={handleAddLeaveType} className="w-full">Add Leave Type</Button>
        </div>
      </Modal>
    </div>
  );
};

export default LeavePolicy;
