import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table } from '../components/UI';
import { deboardingTasks } from '../data/mockData';
import { CheckCircle, Circle, UserMinus, Eye } from 'lucide-react';

const Deboarding = () => {
  const { allUsers } = useAuth();
  const [tasks, setTasks] = useState(deboardingTasks);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [exitedEmployees, setExitedEmployees] = useState(() => {
    const saved = localStorage.getItem('exitedEmployees');
    return saved ? JSON.parse(saved) : [];
  });
  const [formData, setFormData] = useState({
    employeeId: '',
    lastWorkingDay: '',
    exitReason: '',
    exitInterview: '',
    finalSettlement: '',
    exitStatus: 'Resigned'
  });

  const toggleTask = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = (completedTasks / tasks.length) * 100;

  const handleSubmit = () => {
    const employee = allUsers.find(u => String(u.id) === String(formData.employeeId));
    if (!employee) return;

    const exitRecord = {
      id: Date.now(),
      ...employee,
      ...formData,
      exitDate: new Date().toISOString().split('T')[0],
      checklistCompleted: completedTasks === tasks.length,
      isExited: true,
      exitStatus: formData.exitStatus
    };

    const updated = [...exitedEmployees, exitRecord];
    setExitedEmployees(updated);
    localStorage.setItem('exitedEmployees', JSON.stringify(updated));

    // Mark employee as exited with status
    const exitedIds = JSON.parse(localStorage.getItem('exitedEmployeeIds') || '[]');
    exitedIds.push(String(formData.employeeId));
    localStorage.setItem('exitedEmployeeIds', JSON.stringify(exitedIds));

    const exitedStatuses = JSON.parse(localStorage.getItem('exitedEmployeeStatuses') || '{}');
    exitedStatuses[formData.employeeId] = formData.exitStatus;
    localStorage.setItem('exitedEmployeeStatuses', JSON.stringify(exitedStatuses));

    setShowModal(false);
    setFormData({ employeeId: '', lastWorkingDay: '', exitReason: '', exitInterview: '', finalSettlement: '', exitStatus: 'Resigned' });
    alert('Employee exit record saved successfully');
    window.location.reload();
  };

  const viewDetails = (emp) => {
    setSelectedEmployee(emp);
    setShowDetailsModal(true);
  };

  const columns = [
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Last Working Day', accessor: 'lastWorkingDay' },
    { header: 'Exit Date', accessor: 'exitDate' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.exitStatus === 'Resigned' ? 'bg-blue-100 text-blue-800' :
            row.exitStatus === 'Terminated' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
          }`}>
          {row.exitStatus}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button onClick={() => viewDetails(row)} variant="secondary" className="text-xs py-1 px-2">
          <Eye size={14} className="inline mr-1" /> View Details
        </Button>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Employee Deboarding</h1>
        <Button onClick={() => setShowModal(true)}>
          <UserMinus size={18} className="inline mr-2" />
          Process Exit
        </Button>
      </div>

      <Card title="Exited Employees" className="mb-6">
        <Table columns={columns} data={exitedEmployees} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Exit Checklist">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                {completedTasks} / {tasks.length} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => toggleTask(task.id)}
              >
                {task.completed ? (
                  <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                ) : (
                  <Circle className="text-gray-400 flex-shrink-0" size={20} />
                )}
                <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-white'}`}>
                  {task.task}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Exit Process Timeline">
          <div className="space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Notice Period</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Standard notice period: 30 days
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Week 1: Resignation Acceptance</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Process resignation and initiate exit formalities</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Week 2-3: Knowledge Transfer</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Complete handover of responsibilities</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Week 4: Asset Return</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Return all company assets and complete clearance</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Final Day: Exit Interview</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Conduct exit interview and final settlement</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Process Employee Exit">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Employee</label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select an employee</option>
              {allUsers.filter(u => {
                const exitedIds = JSON.parse(localStorage.getItem('exitedEmployeeIds') || '[]');
                return (u.role === 'employee' || u.role === 'hr') && !exitedIds.includes(String(u.id));
              }).map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exit Status</label>
            <select
              value={formData.exitStatus}
              onChange={(e) => setFormData({ ...formData, exitStatus: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
              <option value="Absconded">Absconded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Working Day</label>
            <input
              type="date"
              value={formData.lastWorkingDay}
              onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exit Reason</label>
            <textarea
              value={formData.exitReason}
              onChange={(e) => setFormData({ ...formData, exitReason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
              placeholder="Enter exit reason"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exit Interview Notes</label>
            <textarea
              value={formData.exitInterview}
              onChange={(e) => setFormData({ ...formData, exitInterview: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
              placeholder="Enter exit interview notes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Final Settlement Amount</label>
            <input
              type="text"
              value={formData.finalSettlement}
              onChange={(e) => setFormData({ ...formData, finalSettlement: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter final settlement amount"
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">Save Exit Record</Button>
        </div>
      </Modal>

      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Exit Details" size="lg">
        {selectedEmployee && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Employee ID</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedEmployee.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Name</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedEmployee.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedEmployee.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Designation</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedEmployee.designation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Last Working Day</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedEmployee.lastWorkingDay}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Exit Date</p>
                <p className="font-semibold text-gray-800 dark:text-white">{selectedEmployee.exitDate}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exit Reason</p>
              <p className="text-gray-800 dark:text-white">{selectedEmployee.exitReason}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exit Interview Notes</p>
              <p className="text-gray-800 dark:text-white">{selectedEmployee.exitInterview}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Final Settlement</p>
              <p className="font-semibold text-gray-800 dark:text-white">{selectedEmployee.finalSettlement}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Checklist Status</p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {selectedEmployee.checklistCompleted ? 'Completed' : 'Incomplete'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Deboarding;
