import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Select, Table, Modal, Pagination } from '../components/UI';
import { Download, FileText, Calendar, DollarSign, Eye, EyeOff, Settings } from 'lucide-react';
import jsPDF from 'jspdf';
import { getYearOptions } from '../utils/helpers';
import { logAuditAction } from '../utils/auditLogger';


const Payslips = () => {
  const { currentUser, attendance, allUsers, payrollSettings, allBankAccounts } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser.id);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [releasedPayslips, setReleasedPayslips] = useState(
    JSON.parse(localStorage.getItem('releasedPayslips') || '[]')
  );
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const [customDeduction, setCustomDeduction] = useState(0);
  const [deductionReason, setDeductionReason] = useState('LOP (Loss of Pay)');


  const deductionReasons = [
    'LOP (Loss of Pay)', 'Income Tax / TDS', 'Professional Tax', 'Provident Fund',
    'Advance Recovery', 'Loan EMI', 'Other'
  ];

  // Using centralized payrollSettings instead of local state

  // Using centralized payrollSettings instead of local state
  const [showSettings, setShowSettings] = useState(false);
  const [showCards, setShowCards] = useState(true);

  const isPayslipReleased = (month, year, employeeId) => {
    return releasedPayslips.some(p => p.month === month && p.year === year && (p.employeeId === employeeId || p.allReleased));
  };

  const releasePayslip = () => {
    const empId = currentUser.role === 'employee' ? currentUser.id : selectedEmployee;
    const newRelease = {
      month: selectedMonth,
      year: selectedYear,
      employeeId: empId,
      customDeduction,
      deductionReason,
      releasedOn: new Date().toISOString()
    };
    const updated = [...releasedPayslips, newRelease];
    setReleasedPayslips(updated);
    localStorage.setItem('releasedPayslips', JSON.stringify(updated));

    // Log the action
    const targetEmployee = allUsers.find(u => u.id === empId);
    logAuditAction({
      action: 'RELEASE_PAYSLIP',
      category: 'PAYROLL',
      performedBy: currentUser,
      targetId: targetEmployee?.employeeId || empId,
      targetName: targetEmployee?.name || 'Unknown',
      details: { month: selectedMonth, year: selectedYear, netPay: currentPayslip.netPay }
    });

    alert('Payslip released successfully');
  };

  const releaseAllPayslips = () => {
    const newRelease = {
      month: selectedMonth,
      year: selectedYear,
      allReleased: true,
      releasedOn: new Date().toISOString()
    };
    const updated = [...releasedPayslips, newRelease];
    setReleasedPayslips(updated);
    localStorage.setItem('releasedPayslips', JSON.stringify(updated));

    // Log the action
    logAuditAction({
      action: 'RELEASE_ALL_PAYSLIPS',
      category: 'PAYROLL',
      performedBy: currentUser,
      targetId: 'ALL',
      targetName: `All Employees - ${selectedMonth}/${selectedYear}`,
      details: { month: selectedMonth, year: selectedYear }
    });

    alert('All payslips released successfully');
  };

  const canViewPayslip = (month, year) => {
    if (currentUser.role === 'admin' || currentUser.role === 'hr' || currentUser.role === 'super_admin') return true;

    // Allow employees to view last 3 months regardless of release status
    const currentDate = new Date();
    const payslipDate = new Date(year, month, 1);
    const monthsDiff = (currentDate.getFullYear() - payslipDate.getFullYear()) * 12 + (currentDate.getMonth() - payslipDate.getMonth());

    if (monthsDiff >= 0 && monthsDiff < 3) return true;

    // For older months, check if released
    return isPayslipReleased(month, year, currentUser.id);
  };

  const calculatePayslip = (employeeId, month, year) => {
    const employee = allUsers.find(u => u.id === employeeId);
    const releaseInfo = releasedPayslips.find(p =>
      p.month === month && p.year === year && (p.employeeId === employeeId || p.allReleased)
    );

    // Fetch Bank Details
    const bankDetails = allBankAccounts?.find(b => String(b.employeeId) === String(employeeId) || String(b.id) === String(employeeId)) || {};

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // ... rest of working days logic ...
    let workingDaysInMonth = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      if (date.getDay() !== 0 && date.getDay() !== 6) workingDaysInMonth++;
    }

    const empBaseSalary = employee?.ctc ? (employee.ctc / 12) : 50000;
    const dailyRate = empBaseSalary / workingDaysInMonth;

    const monthAttendance = attendance.filter(a => {
      const date = new Date(a.date);
      return a.employeeId === employeeId && date.getMonth() === month && date.getFullYear() === year;
    });

    const statistics = {
      effectiveDays: monthAttendance.reduce((sum, rec) => {
        if (rec.status === 'Present' || rec.status === 'Late') return sum + 1;
        if (rec.status === 'Half Day') return sum + 0.5;
        return sum;
      }, 0),
      totalDays: workingDaysInMonth
    };

    // Use common pro-ratio
    const ratio = statistics.effectiveDays / statistics.totalDays;

    // Map components from central template
    const template = payrollSettings?.template || { basic: 40, hra: 16 };
    let grossEarningsFull = 0;
    let grossEarningsActual = 0;

    const computedEarnings = Object.keys(template).map(key => {
      const fullVal = empBaseSalary * (template[key] / 100);
      const actualVal = fullVal * ratio;
      grossEarningsFull += fullVal;
      grossEarningsActual += actualVal;
      return {
        id: key,
        name: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        full: fullVal.toFixed(2),
        actual: actualVal.toFixed(2)
      };
    });

    // 2. STATUTORY DEDUCTIONS (Matched with Payroll.js logic)
    const taxRules = payrollSettings?.tax || { pfEmployee: 12, esiEmployee: 0.75, pfCeiling: 15000, esiCeiling: 21000, professionalTax: 200 };

    // PF 
    const basicEarned = parseFloat(computedEarnings.find(e => e.id === 'basic')?.actual || 0);
    const pfBasic = Math.min(basicEarned, taxRules.pfCeiling);
    const pfVal = (employee?.deductionToggles?.pf !== false) ? (pfBasic * (taxRules.pfEmployee / 100)) : 0;

    // ESI
    const esiApplicable = grossEarningsActual <= taxRules.esiCeiling;
    const esiVal = (employee?.deductionToggles?.esi !== false && esiApplicable) ? (grossEarningsActual * (taxRules.esiEmployee / 100)) : 0;

    // PT
    const ptVal = (employee?.deductionToggles?.pt !== false) ? taxRules.professionalTax : 0;

    const computedDeductions = [
      { id: 'pf', name: 'Provident Fund (PF)', amount: pfVal.toFixed(2) },
      { id: 'esi', name: 'ESI', amount: esiVal.toFixed(2) },
      { id: 'pt', name: 'Professional Tax', amount: ptVal.toFixed(2) }
    ].filter(d => parseFloat(d.amount) > 0);

    const extraDeduction = releaseInfo?.customDeduction || (employeeId === selectedEmployee ? customDeduction : 0);
    const totalDeductions = parseFloat(extraDeduction || 0) + computedDeductions.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const netPay = grossEarningsActual - totalDeductions;
    return {
      employee,
      month,
      year,
      daysInMonth,
      workingDaysInMonth,
      effectiveDays: statistics.effectiveDays,
      dailyRate: dailyRate.toFixed(2),
      baseSalary: empBaseSalary,
      grossPay: grossEarningsActual.toFixed(2),
      customDeduction: parseFloat(extraDeduction || 0).toFixed(2),
      deductionReason: releaseInfo?.deductionReason || (employeeId === selectedEmployee ? deductionReason : ''),
      totalDeductions: totalDeductions.toFixed(2),
      netPay: netPay.toFixed(2),
      released: !!releaseInfo,
      computedEarnings,
      computedDeductions,
      // Merge Bank Details explicitly
      bankName: bankDetails.bankName || employee.bankName || '-',
      bankAccount: bankDetails.accountNumber || employee.bankAccount || '-',
      ifscCode: bankDetails.ifscCode || employee.ifscCode || '-',
      panNumber: bankDetails.panNumber || employee.panNumber || '-' // Although PAN usually in user profile
    };
  };

  const currentPayslip = useMemo(() => {
    const empId = currentUser.role === 'employee' ? currentUser.id : selectedEmployee;
    return calculatePayslip(empId, selectedMonth, selectedYear);
  }, [selectedEmployee, selectedMonth, selectedYear, attendance, currentUser, releasedPayslips, payrollSettings, allBankAccounts]);

  const downloadPDF = (payslipData) => {
    if (!canViewPayslip(payslipData.month, payslipData.year)) {
      alert('This payslip has not been released yet. Please wait for admin to release it.');
      return;
    }


    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const doc = new jsPDF();

    // Company Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Outvying Media', 105, 15, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('A-106, 1st floor, Town Square, New Airport Road, Viman Nagar, Pune, Maharashtra 411014', 105, 20, { align: 'center' });
    doc.text('Email: hr@outvying.com | Website: www.Outvying.com', 105, 25, { align: 'center' });

    // Payslip Title
    doc.setFillColor(220, 220, 220);
    doc.rect(15, 30, 180, 8, 'F');
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(`Payslip For The Month Of ${monthNames[payslipData.month]}-${payslipData.year}`, 105, 35, { align: 'center' });

    // Employee Details Section
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    // Dynamic Header Fields based on Config
    const headerFields = [
      { label: 'Employee ID', value: payslipData.employee?.employeeId || '-' },
      { label: 'Employee Name', value: payslipData.employee?.name || '-' },
      { label: 'Designation', value: payslipData.employee?.designation || '-' },
      { label: 'Business Unit', value: payslipData.employee?.department || '-' },
      { label: 'Date Of Joining', value: payslipData.employee?.dateOfJoining || '-' },
      { label: 'Location', value: 'Pune' },
      { label: 'Bank Name', value: payslipData.bankName },
      { label: 'Bank Account No.', value: payslipData.bankAccount },
      { label: 'IFSC Code', value: payslipData.ifscCode },
      { label: 'ESI No.', value: payslipData.employee?.esiNumber || '-' },
      { label: 'PF Number', value: payslipData.employee?.pfNumber || '-' },
      { label: 'UAN Number', value: payslipData.employee?.uanNumber || '-' },
      { label: 'PAN Number', value: payslipData.employee?.panNumber || '-' },
      { label: '', value: '' }, // Spacer
      { label: 'Days In Month', value: payslipData.daysInMonth.toString() },
      { label: 'Effective Work Days', value: payslipData.effectiveDays.toString() },
    ];

    let currentY = 45;
    let isRightSide = false;

    headerFields.forEach(field => {
      if (!isRightSide) {
        doc.setFont(undefined, 'bold');
        doc.text(field.label, 20, currentY);
        doc.setFont(undefined, 'normal');
        doc.text(field.value || '-', 60, currentY);
      } else {
        doc.setFont(undefined, 'bold');
        doc.text(field.label, 110, currentY);
        doc.setFont(undefined, 'normal');
        doc.text(field.value || '-', 150, currentY);
        currentY += 6;
      }
      isRightSide = !isRightSide;
    });

    let yPos = currentY + 4;

    yPos += 10;

    // Earnings and Deductions Table
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, 195, yPos);

    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('EARNINGS', 30, yPos);
    doc.text('DEDUCTIONS', 130, yPos);

    yPos += 2;
    doc.line(15, yPos, 195, yPos);

    yPos += 6;
    doc.setFontSize(8);
    doc.text('Description', 20, yPos);
    doc.text('Full', 70, yPos, { align: 'right' });
    doc.text('Arrear', 85, yPos, { align: 'right' });
    doc.text('Actual', 100, yPos, { align: 'right' });
    doc.text('Description', 110, yPos);
    doc.text('Amount', 185, yPos, { align: 'right' });

    yPos += 2;
    doc.line(15, yPos, 195, yPos);

    yPos += 5;
    doc.setFont(undefined, 'normal');

    // Earnings loop
    payslipData.computedEarnings.forEach(earn => {
      doc.text(earn.name, 20, yPos);
      doc.text(earn.full, 70, yPos, { align: 'right' });
      doc.text('0.00', 85, yPos, { align: 'right' }); // Arrear stays 0 for now
      doc.text(earn.actual, 100, yPos, { align: 'right' });

      // Find matching deduction for same row if it exists
      const ded = payslipData.computedDeductions[payslipData.computedEarnings.indexOf(earn)];
      if (ded) {
        doc.text(ded.name, 110, yPos);
        doc.text(ded.amount, 185, yPos, { align: 'right' });
      }
      yPos += 5;
    });

    // Pick up any leftover deductions
    if (payslipData.computedDeductions.length > payslipData.computedEarnings.length) {
      for (let i = payslipData.computedEarnings.length; i < payslipData.computedDeductions.length; i++) {
        const ded = payslipData.computedDeductions[i];
        doc.text(ded.name, 110, yPos);
        doc.text(ded.amount, 185, yPos, { align: 'right' });
        yPos += 5;
      }
    }

    if (parseFloat(payslipData.customDeduction) > 0) {
      doc.text(payslipData.deductionReason || 'Adhoc Deduction', 110, yPos);
      doc.text(payslipData.customDeduction, 185, yPos, { align: 'right' });
      yPos += 5;
    }

    yPos += 2;
    doc.line(15, yPos, 195, yPos);

    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Total Earnings', 20, yPos);
    doc.text(payslipData.grossPay, 100, yPos, { align: 'right' });
    doc.text('Total Deduction', 110, yPos);
    doc.text(payslipData.totalDeductions, 185, yPos, { align: 'right' });

    yPos += 2;
    doc.line(15, yPos, 195, yPos);

    yPos += 8;
    doc.setFontSize(10);
    doc.text('Net Pay for the month (Total Earnings - Total Dedutions):', 20, yPos);
    doc.text('₹' + payslipData.netPay, 185, yPos, { align: 'right' });

    yPos += 2;
    doc.line(15, yPos, 195, yPos);

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.text('This is a system generated statement and it does not require any signatures', 105, 280, { align: 'center' });

    doc.save(`Payslip_${payslipData.employee.employeeId}_${monthNames[payslipData.month]}_${payslipData.year}.pdf`);
  };

  const handlePreview = () => {
    // Current Payslip state already has computedEarnings/Deductions
    // We need to map it to the structure expected by the modal
    const data = {
      ...currentPayslip,
      earnedBasic: (currentPayslip.computedEarnings.find(e => e.id === 'basic')?.actual || '0.00'),
    };
    setPreviewData(data);
    setShowPreview(true);
  };


  const payslipHistory = useMemo(() => {
    const history = [];
    const empId = currentUser.role === 'employee' ? currentUser.id : selectedEmployee;
    for (let i = 0; i < 24; i++) {
      const date = new Date(selectedYear, selectedMonth - i, 1);
      const payslip = calculatePayslip(empId, date.getMonth(), date.getFullYear());

      // For employees: show last 3 months regardless of release status, then only released ones
      if (currentUser.role === 'employee') {
        if (i < 3) {
          // Always show last 3 months for employees
          history.push(payslip);
        } else if (payslip.released) {
          // Show older months only if released
          history.push(payslip);
        }
      } else {
        // For admins/HR: apply status filter
        if (statusFilter === 'released' && !payslip.released) continue;
        if (statusFilter === 'pending' && payslip.released) continue;
        history.push(payslip);
      }
    }
    return history;
  }, [selectedEmployee, selectedMonth, selectedYear, currentUser, releasedPayslips, statusFilter, allBankAccounts]);

  const columns = [
    {
      header: 'Month',
      render: (row) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[row.month]} ${row.year}`;
      }
    },
    { header: 'Working Days', render: (row) => row.effectiveDays },
    { header: 'Gross Pay', render: (row) => `₹${row.grossPay}` },
    { header: 'Deductions', render: (row) => `₹${row.totalDeductions}` },
    { header: 'Net Pay', render: (row) => `₹${row.netPay}` },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.released ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
          {row.released ? 'Released' : 'Pending'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <Button
          onClick={() => downloadPDF(row)}
          variant="secondary"
          className="text-xs py-1 px-2"
        >
          <Download size={14} className="inline mr-1" />
          Download
        </Button>
      )
    }
  ];

  const monthOptions = [
    { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
    { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
    { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
    { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' }
  ];

  const yearOptions = getYearOptions();

  const employeeOptions = useMemo(() => {
    return currentUser.role === 'employee'
      ? [{ value: currentUser.id, label: currentUser.name }]
      : allUsers.filter(u => u.role === 'employee' || u.role === 'hr').map(u => ({ value: u.id, label: `${u.name} (${u.employeeId})` }));
  }, [currentUser, allUsers]);

  // Effect to set default selected employee for Admin/HR if not already set or invalid
  React.useEffect(() => {
    if (currentUser.role !== 'employee' && employeeOptions.length > 0) {
      // If current selection is not in the options (e.g. initally set to Admin's own ID), pick the first one
      const isSelectedValid = employeeOptions.some(opt => opt.value === selectedEmployee);
      if (!isSelectedValid) {
        setSelectedEmployee(employeeOptions[0].value);
      }
    }
  }, [currentUser, employeeOptions, selectedEmployee]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Salary Slips</h1>
        <Button
          variant="secondary"
          onClick={() => setShowCards(!showCards)}
          className="flex items-center gap-2"
        >
          {showCards ? <EyeOff size={18} /> : <Eye size={18} />}
          {showCards ? 'Hide Cards' : 'Show Cards'}
        </Button>
      </div>

      {showCards && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Working Days</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{currentPayslip.effectiveDays}</p>
              </div>
              <Calendar className="text-primary-600" size={32} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gross Pay</p>
                <p className="text-3xl font-bold text-green-600">₹{currentPayslip.grossPay}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deductions</p>
                <p className="text-3xl font-bold text-red-600">₹{currentPayslip.totalDeductions}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-0.5">
                  {currentPayslip.computedDeductions
                    .map(cd => (
                      <div key={cd.id} className="flex justify-between w-full gap-4 text-gray-600 dark:text-gray-300">
                        <span>{cd.name}:</span>
                        <span>₹{cd.amount}</span>
                      </div>
                    ))}

                  {parseFloat(currentPayslip.customDeduction) > 0 && (
                    <div className="flex justify-between w-full gap-4 text-red-500 font-medium">
                      <span>{currentPayslip.deductionReason || 'Manual Deduction'}:</span>
                      <span>₹{currentPayslip.customDeduction}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Pay</p>
                <p className="text-3xl font-bold text-blue-600">₹{currentPayslip.netPay}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card title="Current Month Payslip" className="mb-6">
        <div className="flex gap-4 mb-4">
          <Select
            label="Month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            options={monthOptions}
          />
          <Select
            label="Year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            options={yearOptions}
          />
          {currentUser.role !== 'employee' && (
            <Select
              label="Employee"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              options={employeeOptions}
            />
          )}
        </div>

        {currentUser.role === 'employee' ? (
          <div className="mb-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Working Days</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{currentPayslip.effectiveDays} / {currentPayslip.workingDaysInMonth}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Calendar Days</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{currentPayslip.daysInMonth}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Working Days (excl. weekends)</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{currentPayslip.workingDaysInMonth}</p>
            </div>
            {showCards && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">Daily Rate</p>
                <p className="text-xl font-bold text-gray-800 dark:text-white">₹{currentPayslip.dailyRate}</p>
              </div>
            )}
          </div>
        )}

        {currentUser.role === 'admin' && !currentPayslip.released && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Add Deductions / Adjustments</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Deduction Reason</label>
                <select
                  value={deductionReason}
                  onChange={(e) => setDeductionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                >
                  {deductionReasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={customDeduction}
                  onChange={(e) => setCustomDeduction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          {currentUser.role === 'admin' && !currentPayslip.released && (
            <>
              <Button onClick={releasePayslip} variant="success">
                Release Payslip
              </Button>
              <Button onClick={releaseAllPayslips} variant="success">
                Release All Payslips
              </Button>
            </>
          )}
          {canViewPayslip(selectedMonth, selectedYear) ? (
            <>
              <Button onClick={handlePreview} variant="secondary">
                <FileText size={18} className="inline mr-2" />
                Preview
              </Button>
              <Button onClick={() => downloadPDF(currentPayslip)}>
                <Download size={18} className="inline mr-2" />
                Download Payslip
              </Button>
            </>
          ) : (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Payslip will be available after 5th of the month when released by admin.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Payslip History">
        <div className="mb-4">
          <Select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'released', label: 'Released' },
              { value: 'pending', label: 'Pending' }
            ]}
          />
        </div>


        {/* Pagination Logic */}
        {
          (() => {
            const totalPages = Math.ceil(payslipHistory.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedHistory = payslipHistory.slice(startIndex, startIndex + itemsPerPage);

            return (
              <>
                <Table columns={columns} data={paginatedHistory} />
                {payslipHistory.length > itemsPerPage && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            );
          })()
        }
      </Card>

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Payslip Preview" size="lg">
        {previewData && (
          <div className="space-y-4">
            <div className="text-center border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">SALARY SLIP</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {monthOptions[previewData.month].label} {previewData.year}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Dynamic Preview Fields */}
              {Object.entries({
                name: { label: 'Employee Name', value: previewData.employee?.name || 'Unknown' },
                employeeId: { label: 'Employee ID', value: previewData.employee?.employeeId || 'N/A' },
                designation: { label: 'Designation', value: previewData.employee?.designation || 'N/A' },
                department: { label: 'Department', value: previewData.employee?.department || 'N/A' }
              }).map(([key, field]) => (
                <div key={key}>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{field.label}</p>
                  <p className="font-semibold text-gray-800 dark:text-white">{field.value}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Salary Calculation</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Calendar Days</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{previewData.daysInMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Working Days (excl. weekends)</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{previewData.workingDaysInMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Actual Working Days</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{previewData.effectiveDays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Daily Rate</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{previewData.dailyRate}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Earnings</h3>
              <div className="space-y-2 text-sm">
                {/* Standard Earnings */}
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Basic Salary (Earned)</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{previewData.earnedBasic}</span>
                </div>

                {/* Earnings in Preview */}
                {previewData.computedEarnings?.map((ce, idx) => (
                  <div key={ce?.id || idx} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{ce?.name || 'Unknown'}</span>
                    <span className="font-semibold text-gray-800 dark:text-white">₹{ce?.actual || '0.00'}</span>
                  </div>
                ))}

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gross Pay ({previewData.effectiveDays} days)</span>
                  <span className="font-semibold text-green-600">₹{previewData.grossPay}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Deductions</h3>
              <div className="space-y-2 text-sm">
                {/* Deductions */}
                {/* Tax removed from hardcoded list */}

                {previewData.computedDeductions?.map((cd, idx) => (
                  <div key={cd?.id || idx} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{cd?.name || 'Unknown'}</span>
                    <span className="font-semibold text-gray-800 dark:text-white">₹{cd?.amount || '0.00'}</span>
                  </div>
                ))}

                <div className="flex justify-between font-semibold">
                  <span className="text-gray-600 dark:text-gray-400">Total Deductions</span>
                  <span className="text-red-600">₹{previewData.totalDeductions}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-800 dark:text-white">Net Pay</span>
                <span className="text-blue-600">₹{previewData.netPay}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Generated on: {new Date().toLocaleDateString()}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payslips;
