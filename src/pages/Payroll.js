import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table } from '../components/UI';
import { DollarSign, Edit, Search } from 'lucide-react';

const Payroll = () => {
  const { allUsers, updateUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [ctc, setCtc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [template, setTemplate] = useState(() => {
    const saved = localStorage.getItem('salaryTemplate');
    return saved ? JSON.parse(saved) : {
      basic: 40,
      hra: 16,
      medical: 4,
      transport: 8.6,
      shift: 16,
      attendance: 15.4
    };
  });

  const employees = allUsers.filter(u => u.role === 'employee' || u.role === 'hr');
  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateBreakdown = (totalCtc) => {
    const annual = parseFloat(totalCtc) || 0;
    const monthly = annual / 12;
    const professionalTax = 200;
    const grossSalary = monthly - professionalTax;
    return {
      basic: (grossSalary * (template.basic / 100)).toFixed(2),
      hra: (grossSalary * (template.hra / 100)).toFixed(2),
      medical: (grossSalary * (template.medical / 100)).toFixed(2),
      transport: (grossSalary * (template.transport / 100)).toFixed(2),
      shift: (grossSalary * (template.shift / 100)).toFixed(2),
      attendance: (grossSalary * (template.attendance / 100)).toFixed(2),
      professionalTax: professionalTax.toFixed(2),
      grossSalary: grossSalary.toFixed(2),
      monthly: monthly.toFixed(2),
      annual: annual.toFixed(2)
    };
  };

  const handleSaveTemplate = () => {
    localStorage.setItem('salaryTemplate', JSON.stringify(template));
    setShowTemplateModal(false);
    alert('Template saved successfully');
  };

  const handleAssignCTC = () => {
    const breakdown = calculateBreakdown(ctc);
    updateUser(selectedEmployee.id, { ctc: parseFloat(ctc), salaryBreakdown: breakdown });
    setShowModal(false);
    setSelectedEmployee(null);
    setCtc('');
  };

  const openModal = (employee) => {
    setSelectedEmployee(employee);
    setCtc(employee.ctc || '');
    setShowModal(true);
  };

  const columns = [
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Department', accessor: 'department' },
    { 
      header: 'Annual CTC', 
      render: (row) => row.ctc ? `₹${row.ctc.toLocaleString()}` : 'Not Assigned'
    },
    { 
      header: 'Monthly Salary', 
      render: (row) => row.salaryBreakdown ? `₹${parseFloat(row.salaryBreakdown.monthly).toLocaleString()}` : '-'
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button onClick={() => openModal(row)} variant="secondary" className="text-xs py-1 px-2">
          <Edit size={14} className="inline mr-1" /> Assign CTC
        </Button>
      )
    }
  ];

  const breakdown = ctc ? calculateBreakdown(ctc) : null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Payroll Management</h1>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <Button onClick={() => setShowTemplateModal(true)} variant="secondary">
            <Edit size={18} className="inline mr-2" />
            Customize Template
          </Button>
        </div>

        <Table columns={columns} data={filteredEmployees} />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Assign CTC" size="lg">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Employee</p>
            <p className="font-semibold text-gray-800 dark:text-white">{selectedEmployee?.name} ({selectedEmployee?.employeeId})</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Annual CTC (₹)
            </label>
            <input
              type="number"
              placeholder="Enter annual CTC"
              value={ctc}
              onChange={(e) => setCtc(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {breakdown && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Monthly Salary Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Basic ({template.basic}%)</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.basic}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">House Rent Allowance ({template.hra}%)</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.hra}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Medical Allowance ({template.medical}%)</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.medical}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Transport Allowance ({template.transport}%)</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.transport}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Shift Allowance ({template.shift}%)</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.shift}</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Attendance Allowance ({template.attendance}%)</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.attendance}</span>
                </div>
                <div className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Professional Tax</span>
                  <span className="font-semibold text-red-600">-₹{breakdown.professionalTax}</span>
                </div>
                <div className="flex justify-between p-2 bg-primary-50 dark:bg-primary-900/20 rounded font-semibold">
                  <span className="text-gray-800 dark:text-white">Gross Salary</span>
                  <span className="text-primary-600">₹{breakdown.grossSalary}</span>
                </div>
                <div className="flex justify-between p-2 bg-primary-50 dark:bg-primary-900/20 rounded font-semibold">
                  <span className="text-gray-800 dark:text-white">Total CTC (Monthly)</span>
                  <span className="text-primary-600">₹{breakdown.monthly}</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Note: Actual salary will be calculated based on attendance. Absent days will be deducted from gross salary.
            </p>
          </div>

          <Button onClick={handleAssignCTC} className="w-full" disabled={!ctc}>
            <DollarSign size={18} className="inline mr-2" />
            Assign CTC
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Customize Salary Template">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Set percentage for each salary component (Total should be 100%)</p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Basic (%)</label>
            <input
              type="number"
              step="0.1"
              value={template.basic}
              onChange={(e) => setTemplate({ ...template, basic: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">House Rent Allowance (%)</label>
            <input
              type="number"
              step="0.1"
              value={template.hra}
              onChange={(e) => setTemplate({ ...template, hra: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medical Allowance (%)</label>
            <input
              type="number"
              step="0.1"
              value={template.medical}
              onChange={(e) => setTemplate({ ...template, medical: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transport Allowance (%)</label>
            <input
              type="number"
              step="0.1"
              value={template.transport}
              onChange={(e) => setTemplate({ ...template, transport: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shift Allowance (%)</label>
            <input
              type="number"
              step="0.1"
              value={template.shift}
              onChange={(e) => setTemplate({ ...template, shift: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attendance Allowance (%)</label>
            <input
              type="number"
              step="0.1"
              value={template.attendance}
              onChange={(e) => setTemplate({ ...template, attendance: parseFloat(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              Total: {(template.basic + template.hra + template.medical + template.transport + template.shift + template.attendance).toFixed(1)}%
            </p>
          </div>

          <Button onClick={handleSaveTemplate} className="w-full">
            Save Template
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Payroll;
