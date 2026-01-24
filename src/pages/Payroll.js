import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table, Alert } from '../components/UI';
import {
  DollarSign, Edit, Search, Settings,
  TrendingUp, Calculator, FileText, Users,
  ChevronLeft, ChevronRight, Gift, History,
  Download, Eye, CheckCircle, BarChart, Wallet,
  Receipt, Plus, FileSpreadsheet, TrendingDown,
  Briefcase, Landmark, ShieldCheck
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
  const [newComp, setNewComp] = useState({ name: '', value: '' });
  const itemsPerPage = 10;

  const [adjustmentData, setAdjustmentData] = useState({
    type: 'Bonus', amount: '', reason: '', date: new Date().toISOString().split('T')[0]
  });
  const [history, setHistory] = useState([]);

  const [template, setTemplate] = useState(() => {
    const saved = localStorage.getItem('salaryTemplate');
    return saved ? JSON.parse(saved) : {
      basic: 40, hra: 16, medical: 4, transport: 8.1, shiftAllowance: 8.6, attendanceAllowance: 8.6
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

    const components = {};
    let grossSalary = 0;

    Object.keys(template).forEach(key => {
      const val = monthly * (template[key] / 100);
      components[key] = val.toFixed(2);
      grossSalary += val;
    });

    const pfBasic = Math.min(parseFloat(components.basic || 0), taxConfig.pfCeiling);
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
      ...components,
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
    localStorage.setItem('salaryTemplate', JSON.stringify(template));
    setShowTemplateModal(false);
    setAlert({ type: 'success', message: 'Template saved' });
  };

  const handleSaveTaxConfig = () => {
    localStorage.setItem('taxConfig', JSON.stringify(taxConfig));
    setShowTaxModal(false);
    setAlert({ type: 'success', message: 'Statutory rules updated' });
  };

  const handleDeleteComponent = (key) => {
    if (['basic'].includes(key)) return;
    const newTemplate = { ...template };
    delete newTemplate[key];
    setTemplate(newTemplate);
  };

  const handleAddComponent = () => {
    if (!newComp.name || !newComp.value) return;
    const key = newComp.name.toLowerCase().replace(/\s+/g, '');
    setTemplate({ ...template, [key]: parseFloat(newComp.value) });
    setNewComp({ name: '', value: '' });
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
    if (!selectedEmployee) return setAlert({ type: 'error', message: 'Please select an employee' });
    if (!newLoan.amount || parseFloat(newLoan.amount) <= 0) return setAlert({ type: 'error', message: 'Valid amount required' });
    setIsProcessing(true);
    try {
      await addDoc(collection(db, 'payrollLoans'), {
        employeeId: selectedEmployee.id, employeeName: selectedEmployee.name,
        ...newLoan, amount: parseFloat(newLoan.amount), status: 'Active', createdAt: serverTimestamp()
      });
      setAlert({ type: 'success', message: 'Loan entry created' });
      setShowLoanModal(false);
      fetchLoans();
    } catch (e) { setAlert({ type: 'error', message: e.message }); }
    finally { setIsProcessing(false); }
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
    const bank = allBankAccounts.find(ba => String(ba.userId) === String(emp.id)) || {};
    const daysInMonth = new Date(year, ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName) + 1, 0).getDate();

    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(0);
    doc.text('Outvying Media Solution Pvt Ltd.', 105, 20, { align: 'center' });
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text('A-106, 1st floor, Town Square, New Airport Road, Viman Nagar, Pune, Maharashtra 411014', 105, 26, { align: 'center' });
    doc.text(`Email: hr@outvying.com | Website: www.Outvying.com`, 105, 31, { align: 'center' });
    doc.setFillColor(220, 220, 220); doc.rect(20, 36, 170, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(`Payslip For The Month Of ${monthName}-${year}`, 105, 42, { align: 'center' });

    doc.setFontSize(10); doc.setTextColor(0);
    const leftX = 20, midX = 110; let currentY = 55; const lineGap = 7;
    const infoFields = [
      ['Employee ID', emp.employeeId || 'N/A', 'Employee Name', emp.name || 'N/A'],
      ['Designation', emp.designation || 'N/A', 'Business Unit', emp.department || 'N/A'],
      ['Date Of Joining', emp.joiningDate || '-', 'Location', 'Pune'],
      ['Bank Name', bank.bankName || '-', 'Bank Account No.', bank.accountNumber || '-'],
      ['IFSC Code', bank.ifscCode || '-', 'ESI No.', '-'],
      ['PAN Number', emp.panNumber || 'ABCDE1234F'],
      ['Days In Month', daysInMonth.toString(), 'Effective Work Days', '31']
    ];
    infoFields.forEach((row) => {
      doc.setFont('helvetica', 'bold'); doc.text(row[0], leftX, currentY);
      doc.setFont('helvetica', 'normal'); doc.text(row[1], leftX + 45, currentY);
      if (row[2]) { doc.setFont('helvetica', 'bold'); doc.text(row[2], midX, currentY); doc.setFont('helvetica', 'normal'); doc.text(row[3], midX + 45, currentY); }
      currentY += lineGap;
    });
    doc.setLineWidth(0.5); doc.line(20, currentY + 5, 190, currentY + 5); currentY += 12;
    doc.setFont('helvetica', 'bold'); doc.text('EARNINGS', 55, currentY, { align: 'center' }); doc.text('DEDUCTIONS', 150, currentY, { align: 'center' });
    doc.line(20, currentY + 2, 190, currentY + 2); currentY += 8;
    doc.setFontSize(9); doc.text('Description', 22, currentY); doc.text('Full', 70, currentY, { align: 'right' }); doc.text('Actual', 105, currentY, { align: 'right' });
    doc.text('Description', 112, currentY); doc.text('Amount', 188, currentY, { align: 'right' }); currentY += 6;
    const earnings = Object.keys(template).map(k => [
      k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      b[k] || '0.00'
    ]);
    const deductions = [['Tax (TDS)', b.tds], ['Professional TAX', b.professionalTax], ['ESI', b.esiEmployee]];
    const rowCount = Math.max(earnings.length, deductions.length);
    for (let i = 0; i < rowCount; i++) {
      if (earnings[i]) { doc.text(earnings[i][0], 22, currentY); doc.text(parseFloat(earnings[i][1]).toFixed(2), 105, currentY, { align: 'right' }); }
      if (deductions[i]) { doc.text(deductions[i][0], 112, currentY); doc.text(parseFloat(deductions[i][1]).toFixed(2), 188, currentY, { align: 'right' }); }
      currentY += lineGap;
    }
    const finalEarnings = parseFloat(b.grossSalary).toFixed(2); const totalDeds = parseFloat(b.totalDeductions).toFixed(2);
    doc.line(20, currentY - 2, 190, currentY - 2); doc.setFont('helvetica', 'bold'); doc.text('Total Earnings', 22, currentY); doc.text(finalEarnings, 105, currentY, { align: 'right' }); doc.text('Total Deduction', 112, currentY); doc.text(totalDeds, 188, currentY, { align: 'right' });
    currentY += 10; doc.setFontSize(11); doc.text(`Net Pay for the month (Total Earnings - Total Dedutions):`, 22, currentY); doc.setFontSize(14);
    const net = (parseFloat(finalEarnings) - parseFloat(totalDeds)).toFixed(2); doc.text(`₹ ${net}`, 188, currentY, { align: 'right' });
    doc.save(`Payslip_${emp.employeeId}_${monthName}.pdf`);
  };

  const columns = [
    { header: 'Employee', render: (row) => <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">{row.name.charAt(0)}</div><div><p className="font-bold text-gray-800 dark:text-white leading-none">{row.name}</p><p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tight">{row.employeeId}</p></div></div> },
    { header: 'Status', render: (row) => <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${row.ctc ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{row.ctc ? 'Configured' : 'Pending'}</span> },
    { header: 'Annual CTC', render: (row) => <span className="font-mono font-bold text-gray-600">₹{row.ctc?.toLocaleString() || '-'}</span> },
    { header: 'Take Home', render: (row) => <span className="font-mono font-bold text-blue-600">₹{parseFloat(row.salaryBreakdown?.netSalary || 0).toLocaleString()}</span> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <Button onClick={() => { setSelectedEmployee(row); setCtc(row.ctc || ''); setShowModal(true); }} variant="secondary" className="p-1.5 h-7 w-7"><Edit size={12} /></Button>
          <Button onClick={() => { setSelectedEmployee(row); fetchHistory(row.id); setShowHistoryModal(true); }} variant="secondary" className="p-1.5 h-7 w-7 text-blue-600"><History size={12} /></Button>
          <Button onClick={() => generatePayslip(row, 'January', '2026')} variant="secondary" className="p-1.5 h-7 w-7 text-emerald-600"><Download size={12} /></Button>
        </div>
      )
    }
  ];

  const handleAssignCTC = async () => {
    const breakdown = calculateBreakdown(ctc);
    await updateUser(selectedEmployee.id, { ctc: parseFloat(ctc), salaryBreakdown: breakdown });
    setShowModal(false); setAlert({ type: 'success', message: 'Structure Updated' });
  };

  const handleGenerateMonthlyReport = () => {
    const reportData = employees.map(emp => {
      const b = emp.salaryBreakdown; if (!b) return null;
      return { 'ID': emp.employeeId, 'Name': emp.name, 'Gross': b.grossSalary, 'Net': b.netSalary };
    }).filter(Boolean);
    const csv = Papa.unparse(reportData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'Report.csv'; link.click();
  };

  const deptData = useMemo(() => {
    const depts = {};
    allUsers.forEach(u => { if (u.ctc && u.department) depts[u.department] = (depts[u.department] || 0) + (u.ctc / 12); });
    return depts;
  }, [allUsers]);

  const topCtcData = useMemo(() => {
    return allUsers.filter(u => u.ctc).sort((a, b) => b.ctc - a.ctc).slice(0, 7);
  }, [allUsers]);

  const stats = useMemo(() => {
    const totalItems = allUsers.length;
    const processed = allUsers.filter(u => u.salaryBreakdown).length;
    const activeLoanAmt = loans.reduce((s, l) => s + l.amount, 0);
    return { totalItems, processed, activeLoanAmt };
  }, [allUsers, loans]);

  if (currentUser.role !== 'admin' && currentUser.role !== 'Admin' && currentUser.role !== 'hr') return <div className="text-center py-20 text-gray-400 italic">Restricted Access Dashboard.</div>;

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-[0.2em] mb-1">
            <ShieldCheck size={14} /> Secure Financial Hub
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Payroll <span className="text-primary-600">Ecosystem</span></h1>
          <p className="text-gray-400 text-sm mt-1">Manage, Revise and Monitor Organization-wide payouts.</p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setShowTemplateModal(true)} variant="secondary" className="bg-white hover:shadow-md transition-all">
            <Settings size={16} className="mr-2" /> Configuration
          </Button>
          <Button onClick={handleGenerateMonthlyReport} variant="primary" className="shadow-lg shadow-primary-500/20">
            <FileSpreadsheet size={16} className="mr-2" /> Export Ledger
          </Button>
        </div>
      </div>

      {alert && <div className="mb-6"><Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} /></div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Headcount</p>
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-gray-900">{stats.totalItems}</h3>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors"><Users size={20} /></div>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Processed Profiles</p>
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-gray-900">{stats.processed}</h3>
              <p className="text-[10px] text-emerald-600 font-bold">{(stats.processed / stats.totalItems * 100).toFixed(0)}% Done</p>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Loan Payout</p>
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-gray-900">₹{stats.activeLoanAmt.toLocaleString()}</h3>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors"><Wallet size={20} /></div>
            </div>
          </div>
        </Card>
        <Card className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estimated Tax/Mo</p>
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-gray-900">₹{(stats.processed * 1200).toLocaleString()}</h3>
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors"><TrendingUp size={20} /></div>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-2 mb-8 inline-flex items-center shadow-sm">
        {['employees', 'process', 'reports', 'loans', 'reimbursements'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {activeTab === 'employees' && (
          <Card className="border-none shadow-xl shadow-gray-200/50">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input placeholder="Search Staff DB..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-transparent focus:border-primary-200 focus:bg-white rounded-2xl outline-none transition-all" />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowTaxModal(true)} className="rounded-xl"><Landmark size={16} className="mr-2" /> Statutory Rules</Button>
              </div>
            </div>

            <Table columns={columns} data={paginatedEmployees} />

            {totalPages > 1 && (
              <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center px-4">
                <p className="text-xs font-bold text-gray-400 uppercase">Page {currentPage} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button onClick={() => setCurrentPage(c => Math.max(1, c - 1))} disabled={currentPage === 1} variant="secondary" className="p-2 w-10 h-10"><ChevronLeft size={18} /></Button>
                  <Button onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} disabled={currentPage === totalPages} variant="secondary" className="p-2 w-10 h-10"><ChevronRight size={18} /></Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {activeTab === 'process' && (
          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <select value={selectedProcessMonth} onChange={(e) => setSelectedProcessMonth(e.target.value)} className="bg-gray-100 border-none rounded-xl px-4 py-3 font-bold text-sm outline-none">
                    <option>January 2026</option><option>February 2026</option>
                  </select>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Active Processing Period</p>
                </div>
                <Button><Calculator size={18} className="mr-2" /> Commit Salaries</Button>
              </div>
            </Card>
            <Card title="Monthly Batch Review" className="border-none shadow-lg">
              <Table columns={[
                { header: 'Employee', accessor: 'name' },
                { header: 'Actual (Mo)', render: (u) => <span className="font-bold">₹{parseFloat(u.salaryBreakdown?.grossSalary || 0).toLocaleString()}</span> },
                { header: 'Statutory Deds', render: (u) => <span className="text-red-400 font-medium">₹{parseFloat(u.salaryBreakdown?.totalDeductions || 0).toLocaleString()}</span> },
                { header: 'Payout', render: (u) => <span className="font-black text-emerald-600">₹{parseFloat(u.salaryBreakdown?.netSalary || 0).toLocaleString()}</span> }
              ]} data={filteredEmployees} />
            </Card>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="Market Competitiveness" className="border-none shadow-lg h-full">
              <div className="h-[350px] mt-6"><Bar data={{ labels: topCtcData.map(u => u.name.split(' ')[0]), datasets: [{ label: 'CTC Package', data: topCtcData.map(u => u.ctc), backgroundColor: '#3b82f6', borderRadius: 8, barThickness: 20 }] }} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>
            </Card>
            <Card title="Spend by Department" className="border-none shadow-lg h-full">
              <div className="h-[350px] mt-6 flex justify-center"><Pie data={{ labels: Object.keys(deptData), datasets: [{ data: Object.values(deptData), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'], borderWidth: 0 }] }} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
            </Card>
          </div>
        )}

        {activeTab === 'loans' && (
          <Card className="border-none shadow-lg">
            <div className="flex justify-between items-center mb-8 bg-black text-white p-6 rounded-[1.5rem]">
              <div>
                <h2 className="text-xl font-black tracking-tight">Financial Support Center</h2>
                <p className="text-gray-400 text-xs">Currently tracking {loans.length} active employee loans.</p>
              </div>
              <Button onClick={() => { setSelectedEmployee(null); setNewLoan({ amount: '', duration: '12', reason: '', interest: '0' }); setShowLoanModal(true); }} className="bg-white text-black border-none hover:bg-gray-100 flex items-center gap-2">
                <Plus size={18} /> New Sanction
              </Button>
            </div>
            <Table columns={[
              { header: 'Beneficiary', accessor: 'employeeName' },
              { header: 'Principal', render: (l) => <span className="font-bold">₹{l.amount.toLocaleString()}</span> },
              { header: 'EMI Size', render: (l) => <span className="text-primary-600 font-bold">₹{Math.round(l.amount / l.duration).toLocaleString()}</span> },
              { header: 'Status', render: (l) => <span className="px-3 py-1 bg-primary-100 text-primary-600 rounded-full text-[9px] font-black uppercase">{l.status}</span> }
            ]} data={loans} />
          </Card>
        )}

        {activeTab === 'reimbursements' && (
          <Card title="Open Expense Claims" className="border-none shadow-lg">
            <div className="flex justify-start mb-6">
              <Button onClick={() => { setSelectedEmployee(null); setNewClaim({ amount: '', type: 'Travel', reason: '' }); setShowReimbursementModal(true); }}><Plus size={16} className="mr-2" /> Log Internal Claim</Button>
            </div>
            <Table columns={[
              { header: 'Type', render: (c) => <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500"></div>{c.type}</div> },
              { header: 'Claimant', accessor: 'employeeName' },
              { header: 'Amount', render: (c) => <span className="font-black">₹{c.amount.toLocaleString()}</span> },
              { header: 'Status', render: (c) => <span className="text-[10px] font-black uppercase text-amber-500">{c.status}</span> }
            ]} data={reimbursements} />
          </Card>
        )}
      </div>

      {/* All Fixed Position Modals */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Assign Annual CTC Structure">
        <div className="space-y-6 pt-2">
          <div className="p-4 bg-primary-50 rounded-2xl border border-primary-100">
            <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Target Profile</p>
            <p className="text-xl font-black text-gray-900">{selectedEmployee?.name}</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase px-1">Annual CTC (INR)</label>
            <input type="number" value={ctc} onChange={e => setCtc(e.target.value)} className="w-full text-2xl font-black p-4 bg-gray-50 border-none rounded-[1.2rem] focus:ring-4 focus:ring-primary-100 transition-all outline-none" placeholder="00,00,000" />
          </div>
          <Button onClick={handleAssignCTC} className="w-full py-5 text-lg font-black tracking-tight shadow-xl shadow-primary-500/20">Apply New Package</Button>
        </div>
      </Modal>

      <Modal isOpen={showLoanModal} onClose={() => setShowLoanModal(false)} title="Loan Sanction Request">
        <div className="space-y-4">
          <select onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === e.target.value))} className="w-full p-4 bg-gray-50 border-none rounded-[1rem] outline-none font-bold text-sm">
            <option>Select Beneficiary...</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input placeholder="Principal Amount" type="number" onChange={e => setNewLoan({ ...newLoan, amount: e.target.value })} className="w-full p-4 bg-gray-50 border-none rounded-[1rem] outline-none font-bold" />
          <input placeholder="Duration (Months)" type="number" value={newLoan.duration} onChange={e => setNewLoan({ ...newLoan, duration: e.target.value })} className="w-full p-4 bg-gray-50 border-none rounded-[1rem] outline-none font-bold" />
          <Button onClick={handleAddLoan} className="w-full py-4 font-black mt-4">Execute Loan Contract</Button>
        </div>
      </Modal>

      <Modal isOpen={showReimbursementModal} onClose={() => setShowReimbursementModal(false)} title="Log Payout Request">
        <div className="space-y-4">
          <select onChange={(e) => setSelectedEmployee(employees.find(emp => emp.id === e.target.value))} className="w-full p-4 bg-gray-50 border-none rounded-[1rem] outline-none font-bold text-sm">
            <option>Select Employee...</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <input placeholder="Total Claim Amount" type="number" onChange={e => setNewClaim({ ...newClaim, amount: e.target.value })} className="w-full p-4 bg-gray-50 border-none rounded-[1rem] outline-none font-bold" />
          <select onChange={e => setNewClaim({ ...newClaim, type: e.target.value })} className="w-full p-4 bg-gray-50 border-none rounded-[1rem] outline-none font-bold text-sm">
            <option>Travel Expense</option><option>Medical Reimb.</option><option>Connectivity/Mobile</option>
          </select>
          <Button onClick={handleAddClaim} className="w-full py-4 font-black">Post to Approvals</Button>
        </div>
      </Modal>

      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Customize Earnings Structure">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">

          {/* New Component Form */}
          <div className="p-4 bg-gray-900 rounded-2xl space-y-3">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Custom Earning Section</p>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="e.g. Wellness" value={newComp.name} onChange={e => setNewComp({ ...newComp, name: e.target.value })} className="p-2.5 bg-white/10 border-none rounded-xl text-white text-xs font-bold outline-none" />
              <input placeholder="Percentage %" type="number" value={newComp.value} onChange={e => setNewComp({ ...newComp, value: e.target.value })} className="p-2.5 bg-white/10 border-none rounded-xl text-white text-xs font-bold outline-none" />
              <Button onClick={handleAddComponent} className="col-span-2 bg-primary-600 text-white border-none py-2 text-xs font-black">Append to Template</Button>
            </div>
          </div>

          <div className="space-y-3">
            {Object.keys(template).map(k => (
              <div key={k} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                <div className="flex flex-col">
                  <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest">
                    {k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <input type="number" value={template[k]} onChange={e => setTemplate({ ...template, [k]: parseFloat(e.target.value) })} className="w-12 bg-transparent border-none p-0 font-black text-primary-600 focus:ring-0 text-lg" />
                    <span className="text-gray-300 font-bold">% of CTC</span>
                  </div>
                </div>
                {k !== 'basic' && (
                  <button onClick={() => handleDeleteComponent(k)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                    <TrendingDown size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <Button onClick={handleSaveTemplate} className="w-full mt-4 py-4 font-black shadow-xl shadow-primary-500/20">Lock Distribution Strategy</Button>
        </div>
      </Modal>

      <Modal isOpen={showHistoryModal} onClose={() => setShowHistoryModal(false)} title="Employee Financial Adjustments" size="lg">
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900 p-6 rounded-[1.5rem]">
            <input placeholder="Adjustment Amount" type="number" value={adjustmentData.amount} onChange={e => setAdjustmentData({ ...adjustmentData, amount: e.target.value })} className="p-3 bg-white/10 border-none rounded-xl text-white outline-none font-bold" />
            <select value={adjustmentData.type} onChange={e => setAdjustmentData({ ...adjustmentData, type: e.target.value })} className="p-3 bg-white/10 border-none rounded-xl text-white outline-none font-bold"><option className="text-black">Bonus</option><option className="text-black">Increment</option></select>
            <input placeholder="Specific Reason / Notes" value={adjustmentData.reason} onChange={e => setAdjustmentData({ ...adjustmentData, reason: e.target.value })} className="col-span-2 p-3 bg-white/10 border-none rounded-xl text-white outline-none font-bold" />
            <Button onClick={handleAddAdjustment} className="col-span-2 bg-primary-600 text-white border-none py-3 font-black">Commit Adjustments</Button>
          </div>
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Ledger History</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {history.length === 0 ? <p className="text-center py-10 text-gray-400 italic text-sm">Empty financial ledger.</p> : history.map(h => (
                <div key={h.id} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center hover:border-primary-100 transition-all">
                  <div><p className="font-black text-gray-900">{h.type}: ₹{h.amount}</p><p className="text-[10px] text-gray-400 mt-0.5">{h.reason}</p></div>
                  <div className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">{new Date(h.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default Payroll;
