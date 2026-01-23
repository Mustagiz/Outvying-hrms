import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table, Alert } from '../components/UI';
import { DollarSign, Edit, Search, Settings, TrendingUp, Calculator, FileText, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const Payroll = () => {
  const { allUsers, updateUser, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [ctc, setCtc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Salary Template
  const [template, setTemplate] = useState(() => {
    const saved = localStorage.getItem('salaryTemplate');
    return saved ? JSON.parse(saved) : {
      basic: 40,
      hra: 16,
      medical: 4,
      transport: 8.6,
      special: 15.4,
      lta: 8,
      food: 8
    };
  });

  // Tax Configuration
  const [taxConfig, setTaxConfig] = useState(() => {
    const saved = localStorage.getItem('taxConfig');
    return saved ? JSON.parse(saved) : {
      pfEmployee: 12,
      pfEmployer: 12,
      pfCeiling: 15000,
      esiEmployee: 0.75,
      esiEmployer: 3.25,
      esiCeiling: 21000,
      professionalTax: 200,
      tdsEnabled: true
    };
  });

  const employees = allUsers.filter(u => u.role === 'employee' || u.role === 'hr');
  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const calculateBreakdown = (totalCtc) => {
    const annual = parseFloat(totalCtc) || 0;
    const monthly = annual / 12;

    // Calculate gross salary components
    const basic = monthly * (template.basic / 100);
    const hra = monthly * (template.hra / 100);
    const medical = monthly * (template.medical / 100);
    const transport = monthly * (template.transport / 100);
    const special = monthly * (template.special / 100);
    const lta = monthly * (template.lta / 100);
    const food = monthly * (template.food / 100);

    const grossSalary = basic + hra + medical + transport + special + lta + food;

    // Calculate deductions
    const pfBasic = Math.min(basic, taxConfig.pfCeiling);
    const pfEmployee = pfBasic * (taxConfig.pfEmployee / 100);
    const pfEmployer = pfBasic * (taxConfig.pfEmployer / 100);

    const esiApplicable = grossSalary <= taxConfig.esiCeiling;
    const esiEmployee = esiApplicable ? (grossSalary * (taxConfig.esiEmployee / 100)) : 0;
    const esiEmployer = esiApplicable ? (grossSalary * (taxConfig.esiEmployer / 100)) : 0;

    const professionalTax = taxConfig.professionalTax;

    // Simple TDS calculation (can be enhanced)
    const annualGross = grossSalary * 12;
    const taxableIncome = annualGross - (pfEmployee * 12) - 50000; // Standard deduction
    let tds = 0;
    if (taxableIncome > 1500000) tds = (taxableIncome - 1500000) * 0.30 + 187500;
    else if (taxableIncome > 1200000) tds = (taxableIncome - 1200000) * 0.20 + 127500;
    else if (taxableIncome > 900000) tds = (taxableIncome - 900000) * 0.15 + 82500;
    else if (taxableIncome > 600000) tds = (taxableIncome - 600000) * 0.10 + 52500;
    else if (taxableIncome > 300000) tds = (taxableIncome - 300000) * 0.05 + 12500;
    else if (taxableIncome > 250000) tds = (taxableIncome - 250000) * 0.05;

    const monthlyTds = taxConfig.tdsEnabled ? (tds / 12) : 0;

    const totalDeductions = pfEmployee + esiEmployee + professionalTax + monthlyTds;
    const netSalary = grossSalary - totalDeductions;

    // Employer cost
    const employerCost = monthly + pfEmployer + esiEmployer;

    return {
      // Earnings
      basic: basic.toFixed(2),
      hra: hra.toFixed(2),
      medical: medical.toFixed(2),
      transport: transport.toFixed(2),
      special: special.toFixed(2),
      lta: lta.toFixed(2),
      food: food.toFixed(2),
      grossSalary: grossSalary.toFixed(2),

      // Deductions
      pfEmployee: pfEmployee.toFixed(2),
      pfEmployer: pfEmployer.toFixed(2),
      esiEmployee: esiEmployee.toFixed(2),
      esiEmployer: esiEmployer.toFixed(2),
      professionalTax: professionalTax.toFixed(2),
      tds: monthlyTds.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),

      // Final amounts
      netSalary: netSalary.toFixed(2),
      monthly: monthly.toFixed(2),
      annual: annual.toFixed(2),
      employerCost: employerCost.toFixed(2),
      costToCompany: (employerCost * 12).toFixed(2)
    };
  };

  const handleSaveTemplate = () => {
    const total = template.basic + template.hra + template.medical + template.transport + template.special + template.lta + template.food;
    if (Math.abs(total - 100) > 0.1) {
      setAlert({ type: 'error', message: 'Total percentage must equal 100%' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    localStorage.setItem('salaryTemplate', JSON.stringify(template));
    setShowTemplateModal(false);
    setAlert({ type: 'success', message: 'Template saved successfully' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleSaveTaxConfig = () => {
    localStorage.setItem('taxConfig', JSON.stringify(taxConfig));
    setShowTaxModal(false);
    setAlert({ type: 'success', message: 'Tax configuration saved successfully' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleAssignCTC = async () => {
    const breakdown = calculateBreakdown(ctc);
    const result = await updateUser(selectedEmployee.id, {
      ctc: parseFloat(ctc),
      salaryBreakdown: breakdown
    });

    if (result.success) {
      setAlert({ type: 'success', message: 'CTC assigned successfully' });
    } else {
      setAlert({ type: 'error', message: result.message || 'Failed to assign CTC' });
    }

    setShowModal(false);
    setSelectedEmployee(null);
    setCtc('');
    setTimeout(() => setAlert(null), 3000);
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
      header: 'Net Salary',
      render: (row) => row.salaryBreakdown ? `₹${parseFloat(row.salaryBreakdown.netSalary).toLocaleString()}` : '-'
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button onClick={() => openModal(row)} variant="secondary" className="text-xs py-1 px-2">
          <Edit size={14} className="inline mr-1" /> Manage CTC
        </Button>
      )
    }
  ];

  const breakdown = ctc ? calculateBreakdown(ctc) : null;

  if (currentUser.role !== 'admin' && currentUser.role !== 'Admin') {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Access denied. Admin only.</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Payroll Management</h1>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'employees'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <Users size={16} className="inline mr-2" />
            Employee Payroll ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'components'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <Calculator size={16} className="inline mr-2" />
            Salary Components
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'tax'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <FileText size={16} className="inline mr-2" />
            Tax Configuration
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'employees' && (
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
              <Settings size={18} className="inline mr-2" />
              Salary Template
            </Button>
          </div>

          <Table columns={columns} data={paginatedEmployees} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="secondary"
                  className="text-xs py-1 px-3"
                >
                  <ChevronLeft size={16} className="inline mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all ${currentPage === page
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (Math.abs(page - currentPage) === 2) {
                      return <span key={page} className="text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="secondary"
                  className="text-xs py-1 px-3"
                >
                  Next
                  <ChevronRight size={16} className="inline ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'components' && (
        <Card title="Salary Components Configuration">
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Configure the percentage breakdown for salary components. Total must equal 100%.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Basic Salary (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={template.basic}
                  onChange={(e) => setTemplate({ ...template, basic: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">House Rent Allowance (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={template.hra}
                  onChange={(e) => setTemplate({ ...template, hra: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medical Allowance (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={template.medical}
                  onChange={(e) => setTemplate({ ...template, medical: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transport Allowance (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={template.transport}
                  onChange={(e) => setTemplate({ ...template, transport: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Special Allowance (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={template.special}
                  onChange={(e) => setTemplate({ ...template, special: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Leave Travel Allowance (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={template.lta}
                  onChange={(e) => setTemplate({ ...template, lta: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Food Allowance (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={template.food}
                  onChange={(e) => setTemplate({ ...template, food: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm font-bold text-gray-800 dark:text-white">
                Total: {(template.basic + template.hra + template.medical + template.transport + template.special + template.lta + template.food).toFixed(1)}%
              </p>
            </div>

            <Button onClick={handleSaveTemplate} className="w-full">
              <Settings size={18} className="inline mr-2" />
              Save Salary Template
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'tax' && (
        <Card title="Tax & Compliance Configuration">
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Configure PF, ESI, TDS, and other statutory deductions as per compliance requirements.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Provident Fund (PF)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee Contribution (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxConfig.pfEmployee}
                    onChange={(e) => setTaxConfig({ ...taxConfig, pfEmployee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employer Contribution (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={taxConfig.pfEmployer}
                    onChange={(e) => setTaxConfig({ ...taxConfig, pfEmployer: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wage Ceiling (₹)</label>
                  <input
                    type="number"
                    value={taxConfig.pfCeiling}
                    onChange={(e) => setTaxConfig({ ...taxConfig, pfCeiling: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Employee State Insurance (ESI)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee Contribution (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxConfig.esiEmployee}
                    onChange={(e) => setTaxConfig({ ...taxConfig, esiEmployee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employer Contribution (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxConfig.esiEmployer}
                    onChange={(e) => setTaxConfig({ ...taxConfig, esiEmployer: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Wage Ceiling (₹)</label>
                  <input
                    type="number"
                    value={taxConfig.esiCeiling}
                    onChange={(e) => setTaxConfig({ ...taxConfig, esiCeiling: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Other Deductions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Professional Tax (₹/month)</label>
                  <input
                    type="number"
                    value={taxConfig.professionalTax}
                    onChange={(e) => setTaxConfig({ ...taxConfig, professionalTax: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={taxConfig.tdsEnabled}
                      onChange={(e) => setTaxConfig({ ...taxConfig, tdsEnabled: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable TDS Calculation</span>
                  </label>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveTaxConfig} className="w-full">
              <FileText size={18} className="inline mr-2" />
              Save Tax Configuration
            </Button>
          </div>
        </Card>
      )}

      {/* CTC Assignment Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Manage Employee CTC" size="lg">
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Employee</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">{selectedEmployee?.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Employee ID</p>
                <p className="text-base font-bold text-gray-900 dark:text-white">{selectedEmployee?.employeeId}</p>
              </div>
            </div>
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
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">Salary Breakdown</h3>

              {/* Earnings */}
              <div>
                <h4 className="text-sm font-semibold text-green-600 mb-2">Earnings (Monthly)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-600 dark:text-gray-400">Basic ({template.basic}%)</span>
                    <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.basic}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-600 dark:text-gray-400">HRA ({template.hra}%)</span>
                    <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.hra}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-600 dark:text-gray-400">Medical ({template.medical}%)</span>
                    <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.medical}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-600 dark:text-gray-400">Transport ({template.transport}%)</span>
                    <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.transport}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-600 dark:text-gray-400">Special ({template.special}%)</span>
                    <span className="font-semibold text-gray-800 dark:text-white">₹{breakdown.special}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded font-semibold">
                    <span className="text-gray-800 dark:text-white">Gross Salary</span>
                    <span className="text-green-600">₹{breakdown.grossSalary}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="text-sm font-semibold text-red-600 mb-2">Deductions (Monthly)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-600 dark:text-gray-400">PF ({taxConfig.pfEmployee}%)</span>
                    <span className="font-semibold text-red-600">-₹{breakdown.pfEmployee}</span>
                  </div>
                  {parseFloat(breakdown.esiEmployee) > 0 && (
                    <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-600 dark:text-gray-400">ESI ({taxConfig.esiEmployee}%)</span>
                      <span className="font-semibold text-red-600">-₹{breakdown.esiEmployee}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span className="text-gray-600 dark:text-gray-400">Professional Tax</span>
                    <span className="font-semibold text-red-600">-₹{breakdown.professionalTax}</span>
                  </div>
                  {parseFloat(breakdown.tds) > 0 && (
                    <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-gray-600 dark:text-gray-400">TDS</span>
                      <span className="font-semibold text-red-600">-₹{breakdown.tds}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded font-semibold">
                    <span className="text-gray-800 dark:text-white">Total Deductions</span>
                    <span className="text-red-600">-₹{breakdown.totalDeductions}</span>
                  </div>
                </div>
              </div>

              {/* Net Salary */}
              <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg border-2 border-primary-200 dark:border-primary-700">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-800 dark:text-white">Net Take Home (Monthly)</span>
                  <span className="text-2xl font-extrabold text-primary-600">₹{breakdown.netSalary}</span>
                </div>
              </div>

              {/* Employer Cost */}
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <p className="text-xs text-gray-700 dark:text-gray-300">
                  <strong>Employer Cost:</strong> ₹{breakdown.employerCost}/month (₹{breakdown.costToCompany}/year including PF & ESI employer contributions)
                </p>
              </div>
            </div>
          )}

          <Button onClick={handleAssignCTC} className="w-full" disabled={!ctc}>
            <DollarSign size={18} className="inline mr-2" />
            Assign CTC
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Payroll;
