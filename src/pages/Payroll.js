import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table, Alert } from '../components/UI';
import {
  DollarSign, Edit, Search, Settings,
  TrendingUp, Calculator, FileText, Users,
  ChevronLeft, ChevronRight, Gift, History,
  Download, Eye, CheckCircle, BarChart, Wallet,
  Receipt, Plus, FileSpreadsheet
} from 'lucide-react';
import Papa from 'papaparse';
import {
  BarElement, CategoryScale, Chart as ChartJS,
  Legend, LinearScale, Title, Tooltip, ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { db } from '../config/firebase';
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp, doc, updateDoc
} from 'firebase/firestore';
import { jsPDF } from 'jspdf';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement
);

const Payroll = () => {
  const { allUsers, updateUser, currentUser, allBankAccounts } = useAuth();
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
  const [loans, setLoans] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [newLoan, setNewLoan] = useState({ amount: '', duration: '12', reason: '', interest: '0' });
  const [newClaim, setNewClaim] = useState({ amount: '', type: 'Travel', reason: '' });
  const [selectedProcessMonth, setSelectedProcessMonth] = useState('January 2026');
  const itemsPerPage = 10;

  const [adjustmentData, setAdjustmentData] = useState({
    type: 'Bonus',
    amount: '',
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [history, setHistory] = useState([]);

  const [template, setTemplate] = useState(() => {
    const saved = localStorage.getItem('salaryTemplate');
    return saved ? JSON.parse(saved) : {
      basic: 40, hra: 16, medical: 4, transport: 8.6, special: 15.4, shiftAllowance: 8, attendanceAllowance: 8
    };
  });

  const [taxConfig, setTaxConfig] = useState(() => {
    const saved = localStorage.getItem('taxConfig');
    return saved ? JSON.parse(saved) : {
      pfEmployee: 12, pfEmployer: 12, pfCeiling: 15000,
      esiEmployee: 0.75, esiEmployer: 3.25, esiCeiling: 21000,
      professionalTax: 200, tdsEnabled: true
    };
  });

  const employees = allUsers.filter(u => u.role === 'employee' || u.role === 'hr');
  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const calculateBreakdown = (totalCtc) => {
    const annual = parseFloat(totalCtc) || 0;
    const monthly = annual / 12;
    const basic = monthly * (template.basic / 100);
    const hra = monthly * (template.hra / 100);
    const medical = monthly * (template.medical / 100);
    const transport = monthly * (template.transport / 100);
    const special = monthly * (template.special / 100);
    const shiftAllowance = monthly * (template.shiftAllowance / 100);
    const attendanceAllowance = monthly * (template.attendanceAllowance / 100);
    const grossSalary = basic + hra + medical + transport + special + shiftAllowance + attendanceAllowance;
    const pfBasic = Math.min(basic, taxConfig.pfCeiling);
    const pfEmployee = pfBasic * (taxConfig.pfEmployee / 100);
    const pfEmployer = pfBasic * (taxConfig.pfEmployer / 100);
    const esiApplicable = grossSalary <= taxConfig.esiCeiling;
    const esiEmployee = esiApplicable ? (grossSalary * (taxConfig.esiEmployee / 100)) : 0;
    const esiEmployer = esiApplicable ? (grossSalary * (taxConfig.esiEmployer / 100)) : 0;
    const professionalTax = taxConfig.professionalTax;
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
      basic: basic.toFixed(2), hra: hra.toFixed(2), medical: medical.toFixed(2), transport: transport.toFixed(2),
      special: special.toFixed(2), shiftAllowance: shiftAllowance.toFixed(2), attendanceAllowance: attendanceAllowance.toFixed(2), grossSalary: grossSalary.toFixed(2),
      pfEmployee: pfEmployee.toFixed(2), pfEmployer: pfEmployer.toFixed(2), esiEmployee: esiEmployee.toFixed(2),
      esiEmployer: esiEmployer.toFixed(2), professionalTax: professionalTax.toFixed(2), tds: monthlyTds.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2), netSalary: netSalary.toFixed(2), monthly: monthly.toFixed(2),
      annual: annual.toFixed(2), employerCost: employerCost.toFixed(2), costToCompany: (employerCost * 12).toFixed(2)
    };
  };

  const handleSaveTemplate = () => {
    localStorage.setItem('salaryTemplate', JSON.stringify(template));
    setShowTemplateModal(false);
    setAlert({ type: 'success', message: 'Template saved' });
  };

  const handleSaveTaxConfig = () => {
    localStorage.setItem('taxConfig', JSON.stringify(taxConfig));
    setShowTaxModal(false);
    setAlert({ type: 'success', message: 'Statutory rules updated' });
  };

  const handleAddAdjustment = async () => {
    if (!selectedEmployee || !adjustmentData.amount) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'payrollHistory'), {
        employeeId: selectedEmployee.id, employeeName: selectedEmployee.name, ...adjustmentData,
        amount: parseFloat(adjustmentData.amount), appliedBy: currentUser.id, createdAt: serverTimestamp()
      });
      if (adjustmentData.type === 'Increment') {
        const newCtc = (selectedEmployee.ctc || 0) + parseFloat(adjustmentData.amount);
        await updateUser(selectedEmployee.id, { ctc: newCtc, salaryBreakdown: calculateBreakdown(newCtc) });
      }
      setAlert({ type: 'success', message: 'Adjustment applied!' });
      fetchHistory(selectedEmployee.id);
    } catch (e) { setAlert({ type: 'error', message: e.message }); }
    finally { setIsProcessing(false); }
  };

  const fetchHistory = async (empId) => {
    const q = query(collection(db, 'payrollHistory'), where('employeeId', '==', empId));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
  };

  const fetchLoans = async () => {
    const q = query(collection(db, 'payrollLoans'));
    const snap = await getDocs(q);
    setLoans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchReimbursements = async () => {
    const q = query(collection(db, 'payrollClaims'));
    const snap = await getDocs(q);
    setReimbursements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddLoan = async () => {
    if (!selectedEmployee) {
      setAlert({ type: 'error', message: 'Please select an employee' });
      return;
    }
    if (!newLoan.amount || parseFloat(newLoan.amount) <= 0) {
      setAlert({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }
    if (!newLoan.duration || parseInt(newLoan.duration) <= 0) {
      setAlert({ type: 'error', message: 'Please enter a valid duration' });
      return;
    }

    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'payrollLoans'), {
        employeeId: selectedEmployee.id, employeeName: selectedEmployee.name,
        ...newLoan, amount: parseFloat(newLoan.amount), status: 'Active', createdAt: serverTimestamp()
      });
      setAlert({ type: 'success', message: 'Loan entry created' });
      setShowLoanModal(false);
      setNewLoan({ amount: '', duration: '12', reason: '', interest: '0' });
      fetchLoans();
    } catch (e) {
      setAlert({ type: 'error', message: 'Failed to create loan: ' + e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddClaim = async () => {
    if (!selectedEmployee || !newClaim.amount) return;
    try {
      await addDoc(collection(db, 'payrollClaims'), {
        employeeId: selectedEmployee.id, employeeName: selectedEmployee.name,
        ...newClaim, amount: parseFloat(newClaim.amount), status: 'Pending',
        date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
      });
      setAlert({ type: 'success', message: 'Claim submitted' });
      setShowReimbursementModal(false);
      fetchReimbursements();
    } catch (e) { setAlert({ type: 'error', message: e.message }); }
  };

  useEffect(() => {
    if (activeTab === 'loans') fetchLoans();
    if (activeTab === 'reimbursements') fetchReimbursements();
  }, [activeTab]);

  const generatePayslip = (emp, monthName, year) => {
    const doc = new jsPDF();
    const b = emp.salaryBreakdown;
    if (!b) return alert('No salary breakdown assigned!');

    // Fetch Bank Account for this employee
    const bank = allBankAccounts.find(ba => String(ba.userId) === String(emp.id)) || {};

    const daysInMonth = new Date(year, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName) + 1, 0).getDate();
    const workDays = 31; // Placeholder as in image, but can be dynamic from attendance

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(0);
    doc.text('Outvying Media Solution Pvt Ltd.', 105, 20, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('A-106, 1st floor, Town Square, New Airport Road, Viman Nagar, Pune, Maharashtra 411014', 105, 26, { align: 'center' });
    doc.text(`Email: hr@outvying.com | Website: www.Outvying.com`, 105, 31, { align: 'center' });

    // Payslip Month Box
    doc.setFillColor(220, 220, 220); // Light gray
    doc.rect(20, 36, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Payslip For The Month Of ${monthName}-${year}`, 105, 42, { align: 'center' });

    // Employee Info Grid
    doc.setFontSize(10);
    doc.setTextColor(0);
    const leftX = 20;
    const midX = 110;
    let currentY = 55;
    const lineGap = 7;

    const infoFields = [
      ['Employee ID', emp.employeeId || 'N/A', 'Employee Name', emp.name || 'N/A'],
      ['Designation', emp.designation || 'N/A', 'Business Unit', emp.department || 'N/A'],
      ['Date Of Joining', emp.joiningDate || '-', 'Location', 'Pune'],
      ['Bank Name', bank.bankName || '-', 'Bank Account No.', bank.accountNumber || '-'],
      ['IFSC Code', bank.ifscCode || '-', 'ESI No.', '-'],
      ['PAN Number', emp.panNumber || 'ABCDE1234F'],
      ['Days In Month', daysInMonth.toString(), 'Effective Work Days', '3'] // '3' is from image
    ];

    infoFields.forEach((row) => {
      doc.setFont('helvetica', 'bold');
      doc.text(row[0], leftX, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], leftX + 45, currentY);

      if (row[2]) {
        doc.setFont('helvetica', 'bold');
        doc.text(row[2], midX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(row[3], midX + 45, currentY);
      }
      currentY += lineGap;
    });

    // Table Separator
    doc.setLineWidth(0.5);
    doc.line(20, currentY + 5, 190, currentY + 5);
    currentY += 12;

    // Earnings & Deductions Headers
    doc.setFont('helvetica', 'bold');
    doc.text('EARNINGS', 55, currentY, { align: 'center' });
    doc.text('DEDUCTIONS', 150, currentY, { align: 'center' });
    doc.line(20, currentY + 2, 190, currentY + 2);
    currentY += 8;

    // Sub-headers
    doc.setFontSize(9);
    doc.text('Description', 22, currentY);
    doc.text('Full', 70, currentY, { align: 'right' });
    doc.text('Arrear', 85, currentY, { align: 'right' });
    doc.text('Actual', 105, currentY, { align: 'right' });

    doc.text('Description', 112, currentY);
    doc.text('Amount', 188, currentY, { align: 'right' });
    currentY += 2;
    doc.line(20, currentY, 190, currentY);
    currentY += 6;

    // Table Rows
    const earnings = [
      ['Basic Salary (BS)', b.basic],
      ['House Rent Allowance (HRA)', b.hra],
      ['Medical Allowance', b.medical],
      ['Transportation Allowance (TA)', b.transport],
      ['Shift Allowance', b.shiftAllowance],
      ['Attendance Allowance', b.attendanceAllowance]
    ];

    const deductions = [
      ['Tax (TDS)', b.tds],
      ['Professional TAX', b.professionalTax],
      ['ESI', b.esiEmployee]
    ];

    const rowCount = Math.max(earnings.length, deductions.length);
    doc.setFont('helvetica', 'normal');

    for (let i = 0; i < rowCount; i++) {
      if (earnings[i]) {
        doc.text(earnings[i][0], 22, currentY);
        doc.text(parseFloat(earnings[i][1]).toFixed(2), 70, currentY, { align: 'right' });
        doc.text('0.00', 85, currentY, { align: 'right' });
        // Calculate proportionate actual
        const actual = (parseFloat(earnings[i][1]) * (3 / daysInMonth)).toFixed(2); // '3' is from image
        doc.text(actual, 105, currentY, { align: 'right' });
      }

      if (deductions[i]) {
        doc.text(deductions[i][0], 112, currentY);
        doc.text(parseFloat(deductions[i][1]).toFixed(2), 188, currentY, { align: 'right' });
      }
      currentY += lineGap;
    }

    // Bottom Section
    const finalActualEarnings = (parseFloat(b.grossSalary) * (3 / daysInMonth)).toFixed(2);
    const totalDeds = parseFloat(b.totalDeductions).toFixed(2);

    doc.line(20, currentY - 2, 190, currentY - 2);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Earnings', 22, currentY);
    doc.text(finalActualEarnings, 105, currentY, { align: 'right' });
    doc.text('Total Deduction', 112, currentY);
    doc.text(totalDeds, 188, currentY, { align: 'right' });
    currentY += 2;
    doc.line(20, currentY, 190, currentY);

    currentY += 10;
    doc.setFontSize(11);
    doc.text(`Net Pay for the month (Total Earnings - Total Dedutions):`, 22, currentY);
    doc.setFontSize(14);
    const net = (parseFloat(finalActualEarnings) - parseFloat(totalDeds)).toFixed(2);
    doc.text(`\u20B9 ${net}`, 188, currentY, { align: 'right' });

    currentY += 2;
    doc.line(20, currentY, 190, currentY);

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
          <Button onClick={() => { setSelectedEmployee(row); setCtc(row.ctc || ''); setShowModal(true); }} variant="secondary" className="p-2 h-8 w-8"><Edit size={14} /></Button>
          <Button onClick={() => { setSelectedEmployee(row); fetchHistory(row.id); setShowHistoryModal(true); }} variant="secondary" className="p-2 h-8 w-8 text-blue-600"><History size={14} /></Button>
          <Button onClick={() => generatePayslip(row, 'January', '2026')} variant="secondary" className="p-2 h-8 w-8 text-emerald-600"><Download size={14} /></Button>
        </div>
      )
    }
  ];

  const handleAssignCTC = async () => {
    const breakdown = calculateBreakdown(ctc);
    await updateUser(selectedEmployee.id, { ctc: parseFloat(ctc), salaryBreakdown: breakdown });
    setShowModal(false); setCtc(''); setAlert({ type: 'success', message: 'CTC updated' });
  };

  const handleGenerateMonthlyReport = () => {
    const reportData = filteredEmployees.map(emp => {
      const b = emp.salaryBreakdown;
      if (!b) return null;

      const [month, year] = selectedProcessMonth.split(' ');
      const daysInMonth = new Date(year, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month) + 1, 0).getDate();

      // For now using 31 as default or 3 as per image, but let's assume full pay if no attendance logic is yet fully integrated here
      const workDays = 31;
      const actualEarnings = (parseFloat(b.grossSalary) * (workDays / daysInMonth)).toFixed(2);
      const netPayable = (parseFloat(actualEarnings) - parseFloat(b.totalDeductions)).toFixed(2);

      return {
        'Employee ID': emp.employeeId,
        'Name': emp.name,
        'Department': emp.department,
        'Gross Salary': b.grossSalary,
        'Actual Earnings': actualEarnings,
        'Deductions': b.totalDeductions,
        'Net Payable': netPayable,
        'Month': selectedProcessMonth
      };
    }).filter(r => r !== null);

    if (reportData.length === 0) {
      setAlert({ type: 'error', message: 'No payroll data found to generate report' });
      return;
    }

    const csv = Papa.unparse(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Payroll_Report_${selectedProcessMonth.replace(' ', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setAlert({ type: 'success', message: 'Report generated successfully' });
  };

  const deptData = useMemo(() => {
    const depts = {};
    allUsers.forEach(u => { if (u.ctc && u.department) depts[u.department] = (depts[u.department] || 0) + (u.ctc / 12); });
    return depts;
  }, [allUsers]);

  const topCtcData = useMemo(() => {
    return allUsers.filter(u => u.ctc).sort((a, b) => b.ctc - a.ctc).slice(0, 7);
  }, [allUsers]);

  if (currentUser.role !== 'admin' && currentUser.role !== 'Admin') return <div className="text-center py-8">Access denied. Admin only.</div>;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payroll Ecosystem</h1>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="mb-6 border-b flex gap-4 overflow-x-auto pb-2">
        {['employees', 'process', 'reports', 'loans', 'reimbursements'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-bold text-sm capitalize border-b-2 transition-all ${activeTab === tab ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500'}`}>
            {tab}
          </button>
        ))}
        <button onClick={() => setShowTemplateModal(true)} className="px-4 py-2 font-bold text-sm text-gray-400">Template</button>
        <button onClick={() => setShowTaxModal(true)} className="px-4 py-2 font-bold text-sm text-gray-400">Statutory</button>
      </div>

      {activeTab === 'employees' && (
        <Card>
          <div className="flex items-center mb-4 max-w-md relative">
            <Search className="absolute left-3 text-gray-400" size={18} />
            <input placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl" />
          </div>
          <Table columns={columns} data={paginatedEmployees} />
          {totalPages > 1 && (
            <div className="mt-4 flex justify-between items-center text-xs font-bold text-gray-400">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <Button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} className="p-2"><ChevronLeft size={16} /></Button>
                <Button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} className="p-2"><ChevronRight size={16} /></Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'process' && (
        <Card title="Monthly Batch Review">
          <div className="space-y-6">
            <div className="flex gap-4">
              <select
                value={selectedProcessMonth}
                onChange={(e) => setSelectedProcessMonth(e.target.value)}
                className="px-4 py-2 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option>January 2026</option>
                <option>February 2026</option>
                <option>March 2026</option>
              </select>
              <Button onClick={handleGenerateMonthlyReport}>
                <FileSpreadsheet size={16} className="mr-2" />
                Generate CSV Report
              </Button>
            </div>
            <Table columns={[
              { header: 'Employee', accessor: 'name' },
              {
                header: 'Actual Earnings',
                render: (u) => {
                  const [month, year] = selectedProcessMonth.split(' ');
                  const daysInMonth = new Date(year, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month) + 1, 0).getDate();
                  const actual = (parseFloat(u.salaryBreakdown?.grossSalary || 0) * (31 / daysInMonth)).toFixed(2);
                  return `₹${parseFloat(actual).toLocaleString()}`;
                }
              },
              { header: 'Deductions', render: (u) => `₹${parseFloat(u.salaryBreakdown?.totalDeductions || 0).toLocaleString()}` },
              {
                header: 'Net Payable',
                render: (u) => {
                  const [month, year] = selectedProcessMonth.split(' ');
                  const daysInMonth = new Date(year, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(month) + 1, 0).getDate();
                  const actual = (parseFloat(u.salaryBreakdown?.grossSalary || 0) * (31 / daysInMonth));
                  const net = (actual - parseFloat(u.salaryBreakdown?.totalDeductions || 0)).toFixed(2);
                  return <span className="font-extrabold text-emerald-600">₹${parseFloat(net).toLocaleString()}</span>;
                }
              }
            ]} data={filteredEmployees} />
          </div>
        </Card>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Department Payouts"><div className="h-[300px]"><Pie data={{ labels: Object.keys(deptData), datasets: [{ data: Object.values(deptData), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'] }] }} options={{ maintainAspectRatio: false }} /></div></Card>
          <Card title="Top CTCs"><div className="h-[300px]"><Bar data={{ labels: topCtcData.map(u => u.name.split(' ')[0]), datasets: [{ label: 'CTC (₹)', data: topCtcData.map(u => u.ctc), backgroundColor: '#3b82f6', borderRadius: 8 }] }} options={{ maintainAspectRatio: false }} /></div></Card>
        </div>
      )}

      {activeTab === 'loans' && (
        <Card title="Company Loans">
          <div className="flex justify-between items-center mb-6">
            <Button onClick={() => {
              setSelectedEmployee(null);
              setNewLoan({ amount: '', duration: '12', reason: '', interest: '0' });
              setShowLoanModal(true);
            }}>
              <Plus size={16} className="mr-2" /> New Loan
            </Button>
          </div>
          <Table columns={[
            { header: 'Employee', accessor: 'employeeName' },
            { header: 'Principal', render: (l) => `₹${l.amount.toLocaleString()}` },
            { header: 'EMI', render: (l) => `₹${Math.round(l.amount / l.duration).toLocaleString()}` },
            { header: 'Duration', render: (l) => `${l.duration} Mo` },
            { header: 'Status', accessor: 'status' }
          ]} data={loans} />
        </Card>
      )}

      {activeTab === 'reimbursements' && (
        <Card title="Expense Claims">
          <div className="flex justify-between items-center mb-6">
            <Button onClick={() => {
              setSelectedEmployee(null);
              setNewClaim({ amount: '', type: 'Travel', reason: '' });
              setShowReimbursementModal(true);
            }}>
              <Plus size={16} className="mr-2" /> Log Claim
            </Button>
          </div>
          <Table columns={[
            { header: 'Category', accessor: 'type' },
            { header: 'Employee', accessor: 'employeeName' },
            { header: 'Amount', render: (c) => `₹${c.amount.toLocaleString()}` },
            { header: 'Status', accessor: 'status' }
          ]} data={reimbursements} />
        </Card>
      )}

      {/* Modals */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Update CTC">
        <div className="space-y-4">
          <input type="number" value={ctc} onChange={e => setCtc(e.target.value)} className="w-full p-2 border rounded-xl" placeholder="Annual CTC" />
          <Button onClick={handleAssignCTC} className="w-full">Save Changes</Button>
        </div>
      </Modal>

      <Modal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} title="Create New Loan Entry">
        <div className="space-y-4">
          <select onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === e.target.value))} className="w-full p-2 border rounded-xl">
            <option>Select Employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input placeholder="Amount" type="number" onChange={e => setNewLoan({ ...newLoan, amount: e.target.value })} className="w-full p-2 border rounded-xl" />
          <input placeholder="Duration (Months)" type="number" onChange={e => setNewLoan({ ...newLoan, duration: e.target.value })} className="w-full p-2 border rounded-xl" />
          <Button onClick={handleAddLoan} className="w-full">Sanction Loan</Button>
        </div>
      </Modal>

      <Modal isOpen={showReimbursementModal} onClose={() => setShowReimbursementModal(false)} title="Log Expense Claim">
        <div className="space-y-4">
          <select onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === e.target.value))} className="w-full p-2 border rounded-xl">
            <option>Select Employee</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input placeholder="Amount" type="number" onChange={e => setNewClaim({ ...newClaim, amount: e.target.value })} className="w-full p-2 border rounded-xl" />
          <select onChange={e => setNewClaim({ ...newClaim, type: e.target.value })} className="w-full p-2 border rounded-xl">
            <option>Travel</option><option>Medical</option><option>Mobile</option>
          </select>
          <Button onClick={handleAddClaim} className="w-full">Submit Claim</Button>
        </div>
      </Modal>

      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Salary Percentages">
        <div className="space-y-3">
          {Object.keys(template).map(k => (
            <div key={k}>
              <label className="text-xs uppercase font-bold">
                {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}%
              </label>
              <input
                type="number"
                value={template[k]}
                onChange={e => setTemplate({ ...template, [k]: parseFloat(e.target.value) })}
                className="w-full p-2 border rounded-xl"
              />
            </div>
          ))}
          <Button onClick={handleSaveTemplate} className="w-full">Save Policy</Button>
        </div>
      </Modal>

      <Modal isOpen={showTaxModal} onClose={() => setShowTaxModal(false)} title="Tax Rules">
        <div className="space-y-4"><input type="number" value={taxConfig.pfEmployee} onChange={e => setTaxConfig({ ...taxConfig, pfEmployee: parseFloat(e.target.value) })} className="w-full p-2 border rounded-xl" placeholder="PF %" /><Button onClick={handleSaveTaxConfig} className="w-full">Save</Button></div>
      </Modal>

      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Adjustments" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Amount" type="number" value={adjustmentData.amount} onChange={e => setAdjustmentData({ ...adjustmentData, amount: e.target.value })} className="p-2 border rounded-xl" />
            <select value={adjustmentData.type} onChange={e => setAdjustmentData({ ...adjustmentData, type: e.target.value })} className="p-2 border rounded-xl"><option>Bonus</option><option>Increment</option></select>
            <input placeholder="Reason" value={adjustmentData.reason} onChange={e => setAdjustmentData({ ...adjustmentData, reason: e.target.value })} className="col-span-2 p-2 border rounded-xl" />
            <Button onClick={handleAddAdjustment} className="col-span-2">Apply</Button>
          </div>
          <div className="space-y-2">{history.map(h => <div key={h.id} className="p-2 border rounded-xl flex justify-between"><span>{h.type}: ₹{h.amount}</span><span className="text-gray-400">{h.reason}</span></div>)}</div>
        </div>
      </Modal>

    </div>
  );
};

export default Payroll;
