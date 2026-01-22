import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Select, Table, Modal } from '../components/UI';
import { Download, FileText, Calendar, DollarSign, Eye, EyeOff, Settings } from 'lucide-react';
import jsPDF from 'jspdf';
import { getYearOptions } from '../utils/helpers';

const Payslips = () => {
  const { currentUser, attendance, allUsers } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser.id);
  const [statusFilter, setStatusFilter] = useState('all');
  const [releasedPayslips, setReleasedPayslips] = useState(
    JSON.parse(localStorage.getItem('releasedPayslips') || '[]')
  );
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const [customDeduction, setCustomDeduction] = useState(0);
  const [deductionReason, setDeductionReason] = useState('LOP (Loss of Pay)');

  const [showViewOptions, setShowViewOptions] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    grossPay: true,
    deductions: true,
    netPay: true
  });

  const deductionReasons = [
    'LOP (Loss of Pay)', 'Income Tax / TDS', 'Professional Tax', 'Provident Fund',
    'Advance Recovery', 'Loan EMI', 'Other'
  ];

  // Configuration State for Salary Slip Components
  const [payslipConfig, setPayslipConfig] = useState(() => {
    const saved = localStorage.getItem('payslipConfig');
    // Migration: If we have old config structure, we might want to reset or migrate it.
    // For now, let's assume if it has the new structure we use it, otherwise default.
    const isNewStructure = saved && JSON.parse(saved).customComponents?.earnings?.some(e => e.name === 'House Rent Allowance (HRA)');

    if (saved && isNewStructure) {
      return JSON.parse(saved);
    }

    return {
      visibility: { grossPay: true, deductions: true, netPay: true },
      components: {
        header: {
          employeeId: true, designation: true, department: true, dateOfJoining: true,
          location: true, bankName: true, bankAccount: true, ifscCode: true,
          pfNo: false, uanNo: false, esiNo: true, panNumber: true
        }
      },
      customComponents: {
        earnings: [
          { id: 'hra', name: 'House Rent Allowance (HRA)', active: true, type: 'fixed', value: 0 },
          { id: 'medical', name: 'Medical Allowance', active: true, type: 'fixed', value: 0 },
          { id: 'transport', name: 'Transportation Allowance (TA)', active: true, type: 'fixed', value: 0 },
          { id: 'shift', name: 'Shift Allowance', active: true, type: 'fixed', value: 0 },
          { id: 'attendance_allowance', name: 'Attendance Allowance', active: true, type: 'fixed', value: 0 }
        ],
        deductions: [
          { id: 'pt', name: 'Professional TAX', active: true, type: 'fixed', value: 200 },
          { id: 'pf', name: 'Provident Fund (PF)', active: false, type: 'percentage_basic', value: 12 }, // Defaulting PF to 12% of Basic as per standard
          { id: 'esi', name: 'ESI', active: true, type: 'fixed', value: 0 }
        ]
      }
    };
  });

  const [showSettings, setShowSettings] = useState(false);
  const [tempConfig, setTempConfig] = useState(null);

  const saveConfig = () => {
    if (tempConfig) {
      setPayslipConfig(tempConfig);
      localStorage.setItem('payslipConfig', JSON.stringify(tempConfig));
      setShowSettings(false);
    }
  };

  const openSettings = () => {
    setTempConfig(JSON.parse(JSON.stringify(payslipConfig)));
    setShowSettings(true);
  };

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

    const workingDays = monthAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;

    // Standard Gross components (simplified for now as basic salary)
    // In a real scenario, HRA, Medical etc would proceed from CTC structure.
    // Here we assume Base Salary IS the standard Gross before custom additions.
    let earnedBasic = dailyRate * workingDays;

    // Calculate Custom Earnings
    let totalCustomEarnings = 0;
    const computedCustomEarnings = payslipConfig.customComponents.earnings
      .filter(e => e.active)
      .map(e => {
        let amount = 0;
        const val = parseFloat(e.value || 0);
        if (e.type === 'percentage_basic') {
          // Percentage of Base Salary (CTC/12)
          amount = (val / 100) * empBaseSalary;
        } else {
          // Fixed Amount
          amount = val;
        }
        totalCustomEarnings += amount;
        return { ...e, amount: amount.toFixed(2) };
      });

    const grossPay = earnedBasic + totalCustomEarnings;

    // Tax is no longer hardcoded. Admin can add it as a custom deduction (% of Gross or Fixed)
    const tax = 0;

    // PF is now in computedCustomDeductions
    // const pf = ... (Removed legacy hardcode)

    let extraDeduction = releaseInfo?.customDeduction || (employeeId === selectedEmployee ? customDeduction : 0);

    // Calculate Custom Deductions
    let totalCustomDeductions = 0;
    const computedCustomDeductions = payslipConfig.customComponents.deductions
      .filter(d => d.active)
      .map(d => {
        let amount = 0;
        const val = parseFloat(d.value || 0);
        if (d.type === 'percentage_basic') {
          amount = (val / 100) * empBaseSalary;
        } else if (d.type === 'percentage_gross') {
          amount = (val / 100) * grossPay;
        } else {
          amount = val;
        }
        totalCustomDeductions += amount;
        return { ...d, amount: amount.toFixed(2) };
      });

    const extraDeductionTotal = parseFloat(extraDeduction || 0) + totalCustomDeductions;

    const totalDeductions = extraDeductionTotal;
    const netPay = grossPay - totalDeductions;

    return {
      employee,
      month,
      year,
      daysInMonth,
      workingDaysInMonth,
      workingDays,
      dailyRate: dailyRate.toFixed(2),
      baseSalary: empBaseSalary,
      earnedBasic: earnedBasic.toFixed(2),
      grossPay: grossPay.toFixed(2),
      tax: '0.00', // Explicitly zero as it's removed
      pf: '0.00', // Legacy field, now handled in custom deductions
      customDeduction: parseFloat(extraDeduction || 0).toFixed(2),
      deductionReason: releaseInfo?.deductionReason || (employeeId === selectedEmployee ? deductionReason : ''),
      totalDeductions: totalDeductions.toFixed(2),
      netPay: netPay.toFixed(2),
      released: !!releaseInfo,
      computedCustomEarnings,
      computedCustomDeductions
    };
  };

  const currentPayslip = useMemo(() => {
    const empId = currentUser.role === 'employee' ? currentUser.id : selectedEmployee;
    return calculatePayslip(empId, selectedMonth, selectedYear);
  }, [selectedEmployee, selectedMonth, selectedYear, attendance, currentUser, releasedPayslips, payslipConfig]);

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
    doc.text('Outvying Media Solution Pvt Ltd.', 105, 15, { align: 'center' });

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
      { key: 'employeeId', label: 'Employee ID', value: payslipData.employee.employeeId },
      { key: 'name', label: 'Employee Name', value: payslipData.employee.name, alwaysShow: true },
      { key: 'designation', label: 'Designation', value: payslipData.employee.designation },
      { key: 'department', label: 'Business Unit', value: payslipData.employee.department },
      { key: 'dateOfJoining', label: 'Date Of Joining', value: payslipData.employee.dateOfJoining },
      { key: 'location', label: 'Location', value: 'Pune' },
      { key: 'bankName', label: 'Bank Name', value: payslipData.employee.bankName || 'Federal Bank' },
      { key: 'bankAccount', label: 'Bank Account No.', value: payslipData.employee.bankAccount || 'XXXXXXXXXXXX' },
      { key: 'ifscCode', label: 'IFSC Code', value: payslipData.employee.ifscCode || '-' },
      { key: 'pfNo', label: 'PF No.', value: '-' },
      { key: 'uanNo', label: 'UAN No.', value: '-' },
      { key: 'esiNo', label: 'ESI No.', value: '-' },
      { key: 'panNumber', label: 'PAN Number', value: payslipData.employee.panNumber || 'FTZPBXXXXN' },
    ];

    let currentY = 45;
    let isRightSide = false;

    headerFields.forEach(field => {
      if (field.alwaysShow || payslipConfig.components.header[field.key] !== false) { // Default true if not found/custom keys
        if (!isRightSide) {
          doc.setFont(undefined, 'bold');
          doc.text(field.label, 20, currentY);
          doc.setFont(undefined, 'normal');
          doc.text(field.value || '', 60, currentY);
        } else {
          doc.setFont(undefined, 'bold');
          doc.text(field.label, 110, currentY);
          doc.setFont(undefined, 'normal');
          doc.text(field.value || '', 150, currentY);
          currentY += 6; // Move to next row after right side
        }
        isRightSide = !isRightSide;
      }
    });

    // Ensure yPos is updated if loop ended on left side
    if (isRightSide) currentY += 6;
    let yPos = currentY;
    doc.setFont(undefined, 'bold');
    doc.text('Days In Month', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.daysInMonth.toString(), 60, yPos);

    doc.setFont(undefined, 'bold');
    doc.text('Effective Work Days', 110, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.workingDays.toString(), 150, yPos);

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

    // Earnings
    const earnings = [
      { key: 'basic', label: 'Basic Salary (BS)', full: payslipData.baseSalary, arrear: '0.00', actual: payslipData.earnedBasic }
    ];

    // Add Custom Earnings
    payslipData.computedCustomEarnings.forEach(ce => {
      earnings.push({
        key: `custom_${ce.id}`,
        label: ce.name,
        full: '0.00',
        arrear: '0.00',
        actual: ce.amount
      });
    });

    const activeEarnings = earnings;

    const deductions = [
      { key: 'tax', label: 'Tax (TDS)', amount: payslipData.tax },
    ];

    // Add Custom Deductions
    payslipData.computedCustomDeductions.forEach(cd => {
      deductions.push({
        key: `custom_${cd.id}`,
        label: cd.name,
        amount: cd.amount
      });
    });

    const activeDeductions = deductions;

    if (parseFloat(payslipData.customDeduction) > 0) {
      activeDeductions.push({ key: 'adhoc', label: payslipData.deductionReason || 'Other Deduction', amount: payslipData.customDeduction });
    }

    const maxRows = Math.max(activeEarnings.length, activeDeductions.length);

    for (let i = 0; i < maxRows; i++) {
      const earn = activeEarnings[i];
      const ded = activeDeductions[i];

      if (earn) {
        doc.text(earn.label, 20, yPos);
        doc.text(earn.full.toString(), 70, yPos, { align: 'right' });
        doc.text(earn.arrear, 85, yPos, { align: 'right' });
        doc.text(earn.actual.toString(), 100, yPos, { align: 'right' });
      }

      if (ded) {
        doc.text(ded.label, 110, yPos);
        doc.text(ded.amount.toString(), 185, yPos, { align: 'right' });
      }
      yPos += 5;
    }

    yPos += 2;
    doc.line(15, yPos, 195, yPos);

    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Total Earnings', 20, yPos);
    if (payslipConfig.visibility?.grossPay !== false) {
      doc.text(payslipData.grossPay, 100, yPos, { align: 'right' });
    }
    doc.text('Total Deduction', 110, yPos);
    if (payslipConfig.visibility?.deductions !== false) {
      doc.text(payslipData.totalDeductions, 185, yPos, { align: 'right' });
    }

    yPos += 2;
    doc.line(15, yPos, 195, yPos);

    yPos += 8;
    if (payslipConfig.visibility?.netPay !== false) {
      doc.setFontSize(10);
      doc.text('Net Pay for the month (Total Earnings - Total Dedutions):', 20, yPos);
      doc.text('₹' + payslipData.netPay, 185, yPos, { align: 'right' });
    }

    yPos += 2;
    doc.line(15, yPos, 195, yPos);

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.text('This is a system generated statement and it does not require any signatures', 105, 280, { align: 'center' });

    doc.save(`Payslip_${payslipData.employee.employeeId}_${monthNames[payslipData.month]}_${payslipData.year}.pdf`);
  };

  const handlePreview = () => {
    setPreviewData(currentPayslip);
    setShowPreview(true);
  };

  const payslipHistory = useMemo(() => {
    const history = [];
    const empId = currentUser.role === 'employee' ? currentUser.id : selectedEmployee;
    for (let i = 0; i < 6; i++) {
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
  }, [selectedEmployee, selectedMonth, selectedYear, currentUser, releasedPayslips, statusFilter]);

  const columns = [
    {
      header: 'Month',
      render: (row) => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[row.month]} ${row.year}`;
      }
    },
    { header: 'Working Days', accessor: 'workingDays' },
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
        <div className="relative">
          {currentUser.role === 'admin' && (
            <Button variant="secondary" onClick={openSettings}>
              <Settings size={18} className="inline mr-2" />
              Settings
            </Button>
          )}

          {showViewOptions && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 p-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2 uppercase">Toggle Visibility</p>
              {['grossPay', 'deductions', 'netPay'].map(key => (
                <label key={key} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={privacySettings[key]}
                    onChange={() => setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Working Days</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{currentPayslip.workingDays}</p>
            </div>
            <Calendar className="text-primary-600" size={32} />
          </div>
        </Card>

        {payslipConfig.visibility?.grossPay !== false && privacySettings.grossPay && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gross Pay</p>
                <p className="text-3xl font-bold text-green-600">₹{currentPayslip.grossPay}</p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </Card>
        )}

        {payslipConfig.visibility?.deductions !== false && privacySettings.deductions && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deductions</p>
                <p className="text-3xl font-bold text-red-600">₹{currentPayslip.totalDeductions}</p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-0.5">
                  <div className="flex justify-between w-full gap-4">
                    {/* Tax Display Removed */}
                  </div>

                  {currentPayslip.computedCustomDeductions.map(cd => (
                    <div key={cd.name} className="flex justify-between w-full gap-4">
                      <span>{cd.name}:</span>
                      <span>₹{cd.amount}</span>
                    </div>
                  ))}
                  <div className="flex justify-between w-full gap-4 text-red-500 font-medium">
                    <span>{currentPayslip.deductionReason || 'Other'}:</span>
                    <span>₹{currentPayslip.customDeduction}</span>
                  </div>

                </div>
              </div>
              <DollarSign className="text-red-600" size={32} />
            </div>
          </Card>
        )}

        {payslipConfig.visibility?.netPay !== false && privacySettings.netPay && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Pay</p>
                <p className="text-3xl font-bold text-blue-600">₹{currentPayslip.netPay}</p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </Card>
        )}
      </div>

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
              onChange={(e) => setSelectedEmployee(parseInt(e.target.value))}
              options={employeeOptions}
            />
          )}
        </div>

        {currentUser.role === 'employee' ? (
          <div className="mb-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Working Days</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{currentPayslip.workingDays} / {currentPayslip.workingDaysInMonth}</p>
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
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Daily Rate</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">₹{currentPayslip.dailyRate}</p>
            </div>
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
        <Table columns={columns} data={payslipHistory} />
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
                (key === 'name' || payslipConfig.components.header[key] !== false) && (
                  <div key={key}>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{field.label}</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{field.value}</p>
                  </div>
                )
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
                  <span className="font-semibold text-gray-800 dark:text-white">{previewData.workingDays}</span>
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

                {/* Custom Earnings in Preview */}
                {previewData.computedCustomEarnings?.map((ce, idx) => (
                  <div key={ce?.id || idx} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{ce?.name || 'Unknown'}</span>
                    <span className="font-semibold text-gray-800 dark:text-white">₹{ce?.amount || '0.00'}</span>
                  </div>
                ))}

                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gross Pay ({previewData.workingDays} days)</span>
                  <span className="font-semibold text-green-600">₹{previewData.grossPay}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Deductions</h3>
              <div className="space-y-2 text-sm">
                {/* Deductions */}
                {/* Tax removed from hardcoded list */}

                {previewData.computedCustomDeductions?.map((cd, idx) => (
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

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Payslip Configuration" size="lg">
        {tempConfig && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">

            {/* Header Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Header Fields</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(tempConfig.components.header).map(([key, active]) => (
                  <label key={key} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setTempConfig(prev => ({
                        ...prev,
                        components: {
                          ...prev.components,
                          header: { ...prev.components.header, [key]: e.target.checked }
                        }
                      }))}
                      className="rounded text-primary-600"
                    />
                    <span className="capitalize text-sm">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Earnings Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Earnings</h3>

              <div className="space-y-4">
                <p className="text-sm font-medium">Earnings Components</p>
                {tempConfig.customComponents.earnings.map((ce, idx) => (
                  <div key={ce.id} className="flex gap-2 items-center flex-wrap md:flex-nowrap border p-2 rounded">
                    <input
                      type="text"
                      value={ce.name}
                      onChange={(e) => {
                        const newEarnings = [...tempConfig.customComponents.earnings];
                        newEarnings[idx].name = e.target.value;
                        setTempConfig({ ...tempConfig, customComponents: { ...tempConfig.customComponents, earnings: newEarnings } });
                      }}
                      className="border p-1 rounded text-sm flex-1 min-w-[120px]"
                      placeholder="Earning Name"
                    />
                    <select
                      value={ce.type || 'fixed'}
                      onChange={(e) => {
                        const newEarnings = [...tempConfig.customComponents.earnings];
                        newEarnings[idx].type = e.target.value;
                        setTempConfig({ ...tempConfig, customComponents: { ...tempConfig.customComponents, earnings: newEarnings } });
                      }}
                      className="border p-1 rounded text-sm w-32"
                    >
                      <option value="fixed">Fixed (₹)</option>
                      <option value="percentage_basic">% of Basic</option>
                    </select>
                    <input
                      type="number"
                      value={ce.value || 0}
                      onChange={(e) => {
                        const newEarnings = [...tempConfig.customComponents.earnings];
                        newEarnings[idx].value = e.target.value;
                        setTempConfig({ ...tempConfig, customComponents: { ...tempConfig.customComponents, earnings: newEarnings } });
                      }}
                      className="border p-1 rounded text-sm w-20"
                      placeholder="Value"
                    />
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={ce.active}
                        onChange={(e) => {
                          const newEarnings = [...tempConfig.customComponents.earnings];
                          newEarnings[idx].active = e.target.checked;
                          setTempConfig({ ...tempConfig, customComponents: { ...tempConfig.customComponents, earnings: newEarnings } });
                        }}
                      />
                      <span className="text-xs">Active</span>
                    </label>
                    <Button
                      variant="danger"
                      className="p-1 px-2 text-xs"
                      onClick={() => {
                        const newEarnings = tempConfig.customComponents.earnings.filter((_, i) => i !== idx);
                        setTempConfig({ ...tempConfig, customComponents: { ...tempConfig.customComponents, earnings: newEarnings } });
                      }}
                    >X</Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => {
                    setTempConfig({
                      ...tempConfig,
                      customComponents: {
                        ...tempConfig.customComponents,
                        earnings: [...tempConfig.customComponents.earnings, { id: Date.now(), name: 'New Earning', active: true, type: 'fixed', value: 0 }]
                      }
                    });
                  }}
                >+ Add Custom Earning</Button>
              </div>
            </div>

            {/* Deductions Section */}
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Deductions</h3>

              <div className="space-y-2">
                <p className="text-sm font-medium">Deductions Components</p>
                {tempConfig.customComponents.deductions.map((cd, idx) => (
                  <div key={cd.id} className="flex gap-2 items-center flex-wrap md:flex-nowrap border p-2 rounded">
                    <input
                      type="text"
                      value={cd.name}
                      onChange={(e) => {
                        const newDeductions = [...tempConfig.customComponents.deductions];
                        newDeductions[idx].name = e.target.value;
                        setTempConfig({ ...tempConfig, customComponents: { ...tempConfig.customComponents, deductions: newDeductions } });
                      }}
                      className="border p-1 rounded text-sm flex-1 min-w-[120px]"
                      placeholder="Deduction Name"
                    />
                    <select
                      value={cd.type || 'fixed'}
                      onChange={(e) => {
                        const newDeductions = [...tempConfig.customComponents.deductions];
                        newDeductions[idx].type = e.target.value;
                        setTempConfig({ ...tempConfig, customComponents: { ...tempConfig.customComponents, deductions: newDeductions } });
                      }}
                      className="border p-1 rounded text-sm w-32"
                    >
                      <option value="fixed">Fixed (₹)</option>
                      <option value="percentage_basic">% of Basic</option>
                      <option value="percentage_gross">% of Gross</option>
                    </select>
                    <input
                      type="number"
                      value={cd.value || 0}
                      onChange={(e) => {
                        const newDeductions = [...tempConfig.customComponents.deductions];
                        newDeductions[idx].value = e.target.value;
                        setTempConfig({ ...tempConfig, customComponents: { ...tempConfig.customComponents, deductions: newDeductions } });
                      }}
                      className="border p-1 rounded text-sm w-20"
                      placeholder="Value"
                    />
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={cd.active}
                        onChange={(e) => {
                          const newDeductions = [...tempConfig.customComponents.deductions];
                          newDeductions[idx].active = e.target.checked;
                          setTempConfig({ ...tempConfig, customComponents: { ...tempConfig.customComponents, deductions: newDeductions } });
                        }}
                      />
                      <span className="text-xs">Active</span>
                    </label>
                    <Button
                      variant="danger"
                      className="p-1 px-2 text-xs"
                      onClick={() => {
                        const newDeductions = tempConfig.customComponents.deductions.filter((_, i) => i !== idx);
                        setTempConfig({ ...tempConfig, customComponents: { ...tempConfig.customComponents, deductions: newDeductions } });
                      }}
                    >X</Button>
                  </div>
                ))}
                <Button
                  variant="secondary"
                  className="w-full text-xs"
                  onClick={() => {
                    setTempConfig({
                      ...tempConfig,
                      customComponents: {
                        ...tempConfig.customComponents,
                        deductions: [...tempConfig.customComponents.deductions, { id: Date.now(), name: 'New Deduction', active: true, type: 'fixed', value: 0 }]
                      }
                    });
                  }}
                >+ Add Custom Deduction</Button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button onClick={saveConfig}>Save Configuration</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payslips;
