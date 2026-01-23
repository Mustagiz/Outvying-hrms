import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table, Alert } from '../components/UI';
import {
  DollarSign, Edit, Search, Settings,
  TrendingUp, Calculator, FileText, Users,
  ChevronLeft, ChevronRight, Gift, History,
  Download, Eye, CheckCircle
} from 'lucide-react';
import { db } from '../config/firebase';
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { jsPDF } from 'jspdf';

const Payroll = () => {
  const { allUsers, updateUser, currentUser, attendanceRules } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [ctc, setCtc] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const itemsPerPage = 10;

  // New State for Bonuses/Increments
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'Bonus',
    amount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [history, setHistory] = useState([]);

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

    // Deductions
    const pfBasic = Math.min(basic, taxConfig.pfCeiling);
    const pfEmployee = pfBasic * (taxConfig.pfEmployee / 100);
    const pfEmployer = pfBasic * (taxConfig.pfEmployer / 100);

    const esiApplicable = grossSalary <= taxConfig.esiCeiling;
    const esiEmployee = esiApplicable ? (grossSalary * (taxConfig.esiEmployee / 100)) : 0;
    const esiEmployer = esiApplicable ? (grossSalary * (taxConfig.esiEmployer / 100)) : 0;

    const professionalTax = taxConfig.professionalTax;

    // Simple TDS calculation 
    const annualGross = grossSalary * 12;
    const taxableIncome = annualGross - (pfEmployee * 12) - 50000;
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

    const employerCost = monthly + pfEmployer + esiEmployer;

    return {
      basic: basic.toFixed(2),
      hra: hra.toFixed(2),
      medical: medical.toFixed(2),
      transport: transport.toFixed(2),
      special: special.toFixed(2),
      lta: lta.toFixed(2),
      food: food.toFixed(2),
      grossSalary: grossSalary.toFixed(2),
      pfEmployee: pfEmployee.toFixed(2),
      pfEmployer: pfEmployer.toFixed(2),
      esiEmployee: esiEmployee.toFixed(2),
      esiEmployer: esiEmployer.toFixed(2),
      professionalTax: professionalTax.toFixed(2),
      tds: monthlyTds.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
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
      return;
    }
    localStorage.setItem('salaryTemplate', JSON.stringify(template));
    setShowTemplateModal(false);
    setAlert({ type: 'success', message: 'Template saved' });
  };

  const handleAddAdjustment = async () => {
    if (!selectedEmployee || !adjustmentData.amount) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'payrollHistory'), {
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        ...adjustmentData,
        amount: parseFloat(adjustmentData.amount),
        appliedBy: currentUser.id,
        createdAt: serverTimestamp()
      });

      if (adjustmentData.type === 'Increment') {
        const newCtc = (selectedEmployee.ctc || 0) + parseFloat(adjustmentData.amount);
        const newBreakdown = calculateBreakdown(newCtc);
        await updateUser(selectedEmployee.id, {
          ctc: newCtc,
          salaryBreakdown: newBreakdown
        });
      }

      setAlert({ type: 'success', message: `${adjustmentData.type} applied successfully!` });
      setAdjustmentData({ type: 'Bonus', amount: '', reason: '', date: new Date().toISOString().split('T')[0] });
      fetchHistory(selectedEmployee.id);
    } catch (e) {
      setAlert({ type: 'error', message: 'Failed: ' + e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchHistory = async (empId) => {
    const q = query(collection(db, 'payrollHistory'), where('employeeId', '==', empId));
    const snap = await getDocs(q);
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHistory(data.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
  };

  const generatePayslip = (emp, monthName, year) => {
    const doc = new jsPDF();
    const b = emp.salaryBreakdown;
    if (!b) return alert('No salary breakdown assigned!');

    doc.setFontSize(22);
    doc.setTextColor(0, 102, 204);
    doc.text('PAYSLIP', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`${monthName} ${year}`, 105, 30, { align: 'center' });

    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    // Employee Info
    doc.setTextColor(0);
    doc.text(`Employee Name: ${emp.name}`, 20, 45);
    doc.text(`Employee ID: ${emp.employeeId}`, 20, 52);
    doc.text(`Department: ${emp.department}`, 20, 59);
    doc.text(`Designation: ${emp.designation}`, 20, 66);

    // Earnings Table
    doc.setFillColor(240, 245, 255);
    doc.rect(20, 75, 80, 8, 'F');
    doc.text('EARNINGS', 25, 81);
    doc.text('AMOUNT', 80, 81, { align: 'right' });

    const earnings = [
      ['Basic Pay', b.basic],
      ['HRA', b.hra],
      ['Medical', b.medical],
      ['Transport', b.transport],
      ['Special', b.special],
      ['Food', b.food],
      ['LTA', b.lta]
    ];

    let y = 88;
    earnings.forEach(([label, amt]) => {
      doc.text(label, 25, y);
      doc.text(`Rs. ${parseFloat(amt).toLocaleString()}`, 80, y, { align: 'right' });
      y += 7;
    });

    // Deductions Table
    doc.setFillColor(255, 240, 240);
    doc.rect(110, 75, 80, 8, 'F');
    doc.text('DEDUCTIONS', 115, 81);
    doc.text('AMOUNT', 170, 81, { align: 'right' });

    const deds = [
      ['PF', b.pfEmployee],
      ['ESI', b.esiEmployee],
      ['Prof. Tax', b.professionalTax],
      ['TDS', b.tds]
    ];

    y = 88;
    deds.forEach(([label, amt]) => {
      doc.text(label, 115, y);
      doc.text(`Rs. ${parseFloat(amt).toLocaleString()}`, 170, y, { align: 'right' });
      y += 7;
    });

    doc.line(20, 145, 190, 145);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`NET TAKE HOME: Rs. ${parseFloat(b.netSalary).toLocaleString()}`, 105, 160, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Computer generated payslip, no signature required.', 105, 180, { align: 'center' });

    doc.save(`Payslip_${emp.employeeId}_${monthName}.pdf`);
  };

  const columns = [
    { header: 'ID', accessor: 'employeeId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Annual CTC', render: (row) => row.ctc ? `₹${row.ctc.toLocaleString()}` : '-' },
    { header: 'Net Salary', render: (row) => row.salaryBreakdown ? `₹${parseFloat(row.salaryBreakdown.netSalary).toLocaleString()}` : '-' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button onClick={() => openModal(row)} variant="secondary" className="p-2 h-8 w-8" title="Manage CTC">
            <Edit size={14} />
          </Button>
          <Button onClick={() => { setSelectedEmployee(row); fetchHistory(row.id); setShowHistoryModal(true); }} variant="secondary" className="p-2 h-8 w-8 text-blue-600" title="Bonuses & History">
            <History size={14} />
          </Button>
          <Button onClick={() => generatePayslip(row, 'January', '2026')} variant="secondary" className="p-2 h-8 w-8 text-emerald-600" title="Download Payslip">
            <Download size={14} />
          </Button>
        </div>
      )
    }
  ];

  if (currentUser.role !== 'admin' && currentUser.role !== 'Admin') {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Access denied. Admin only.</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Professional Payroll</h1>
      </div>

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
            Employees ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('process')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'process'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <Calculator size={16} className="inline mr-2" />
            Monthly Process
          </button>
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-4 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Settings size={16} className="inline mr-2" />
            Template Policy
          </button>
          <button
            onClick={() => setShowTaxModal(true)}
            className="px-4 py-3 font-semibold text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <FileText size={16} className="inline mr-2" />
            Statutory Rules
          </button>
        </div>
      </div>

      {activeTab === 'employees' && (
        <Card>
          <div className="flex items-center mb-4 max-w-md relative">
            <Search className="absolute left-3 text-gray-400" size={18} />
            <input
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>
          <Table columns={columns} data={paginatedEmployees} />
          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <Button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} className="p-2"><ChevronLeft size={16} /></Button>
                <Button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} className="p-2"><ChevronRight size={16} /></Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Salary & CTC Management">
        <div className="space-y-4">
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100">
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1">Employee Info</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">{selectedEmployee?.name} ({selectedEmployee?.employeeId})</p>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Annual CTC (INR)</label>
            <input
              type="number"
              value={ctc}
              onChange={(e) => setCtc(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700 text-lg font-bold"
            />
          </div>
          <Button onClick={handleAssignCTC} className="w-full py-4 shadow-lg shadow-primary-500/20">
            <CheckCircle className="mr-2" size={18} /> Update Salary Structure
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Adjustment & Bonus History" size="lg">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-dashed border-gray-200">
            <div className="col-span-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Add New Adjustment</h3>
            </div>
            <select
              value={adjustmentData.type}
              onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
              className="px-4 py-2 rounded-xl bg-white border border-gray-200"
            >
              <option>Bonus</option>
              <option>Increment</option>
              <option>Deduction</option>
            </select>
            <input
              placeholder="Amount"
              type="number"
              value={adjustmentData.amount}
              onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
              className="px-4 py-2 rounded-xl bg-white border border-gray-200"
            />
            <input
              placeholder="Reason / Description"
              value={adjustmentData.reason}
              onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
              className="col-span-2 px-4 py-2 rounded-xl bg-white border border-gray-200"
            />
            <Button onClick={handleAddAdjustment} className="col-span-2" loading={isProcessing}>
              Apply Adjustment
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Record History</h3>
            {history.length === 0 ? <p className="text-center py-4 text-gray-400 italic text-sm">No adjustments found</p> :
              history.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{item.type}: ₹{item.amount}</p>
                    <p className="text-xs text-gray-400">{item.reason} • {item.date}</p>
                  </div>
                  {item.type === 'Bonus' && <Gift size={20} className="text-amber-500" />}
                  {item.type === 'Increment' && <TrendingUp size={20} className="text-emerald-500" />}
                </div>
              ))
            }
          </div>
        </div>
      </Modal>

      {/* Template & Tax Modals (Simplified for brevity) */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Salary Breakdown Template">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {Object.keys(template).map(key => (
            <div key={key}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{key} (%)</label>
              <input
                type="number"
                value={template[key]}
                onChange={(e) => setTemplate({ ...template, [key]: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
              />
            </div>
          ))}
          <Button onClick={handleSaveTemplate} className="w-full">Save Policy</Button>
        </div>
      </Modal>

      <Modal isOpen={showTaxModal} onClose={() => setShowTaxModal(false)} title="Global Tax & PF Rules">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PF Employee %</label>
              <input type="number" value={taxConfig.pfEmployee} onChange={e => setTaxConfig({ ...taxConfig, pfEmployee: parseFloat(e.target.value) })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">PF Employer %</label>
              <input type="number" value={taxConfig.pfEmployer} onChange={e => setTaxConfig({ ...taxConfig, pfEmployer: parseFloat(e.target.value) })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl" />
            </div>
          </div>
          <Button onClick={handleSaveTaxConfig} className="w-full">Update Statutory Rules</Button>
        </div>
      </Modal>

      {activeTab === 'process' && (
        <Card title="Batch Monthly Payroll Processing">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200">
                <option>January 2026</option>
                <option>December 2025</option>
              </select>
              <Button variant="primary">Generate Payroll Report</Button>
              <Button variant="secondary"><Download size={16} className="mr-2" /> Export All Payslips</Button>
            </div>

            <div className="rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Gross Salary</th>
                    <th className="px-4 py-3">LWP Days</th>
                    <th className="px-4 py-3">Deductions</th>
                    <th className="px-4 py-3">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEmployees.map(emp => {
                    const b = emp.salaryBreakdown;
                    return (
                      <tr key={emp.id}>
                        <td className="px-4 py-3 font-bold">{emp.name}</td>
                        <td className="px-4 py-3 font-medium">₹{b?.grossSalary || 0}</td>
                        <td className="px-4 py-3 text-red-600 font-bold">0</td>
                        <td className="px-4 py-3">₹{b?.totalDeductions || 0}</td>
                        <td className="px-4 py-3 text-emerald-600 font-bold">₹{b?.netSalary || 0}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Payroll;
