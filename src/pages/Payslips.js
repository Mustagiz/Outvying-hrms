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

  const template = useMemo(() => {
    const saved = localStorage.getItem('salarySlipTemplate');
    return saved ? JSON.parse(saved) : {
      visibility: { grossPay: true, deductions: true, netPay: true }
    };
  }, []);

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
    if (currentUser.role === 'admin' || currentUser.role === 'hr') return true;
    return isPayslipReleased(month, year);
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

    const grossPay = dailyRate * workingDays;
    const tax = grossPay * 0.1;
    const pf = grossPay * 0.12;
    const extraDeduction = releaseInfo?.customDeduction || (employeeId === selectedEmployee ? customDeduction : 0);
    const totalDeductions = tax + pf + parseFloat(extraDeduction || 0);
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
      grossPay: grossPay.toFixed(2),
      tax: tax.toFixed(2),
      pf: pf.toFixed(2),
      customDeduction: parseFloat(extraDeduction || 0).toFixed(2),
      deductionReason: releaseInfo?.deductionReason || (employeeId === selectedEmployee ? deductionReason : ''),
      totalDeductions: totalDeductions.toFixed(2),
      netPay: netPay.toFixed(2),
      released: !!releaseInfo
    };
  };

  const currentPayslip = useMemo(() => {
    const empId = currentUser.role === 'employee' ? currentUser.id : selectedEmployee;
    return calculatePayslip(empId, selectedMonth, selectedYear);
  }, [selectedEmployee, selectedMonth, selectedYear, attendance, currentUser, releasedPayslips]);

  const downloadPDF = (payslipData) => {
    if (!canViewPayslip(payslipData.month, payslipData.year)) {
      alert('This payslip has not been released yet. Please wait for admin to release it.');
      return;
    }

    const template = JSON.parse(localStorage.getItem('salarySlipTemplate') || '{}');
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
    let yPos = 45;

    // Left Column
    doc.setFont(undefined, 'bold');
    doc.text('Employee ID', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.employee.employeeId, 60, yPos);

    doc.setFont(undefined, 'bold');
    doc.text('Employee Name', 110, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.employee.name, 150, yPos);

    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Designation', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.employee.designation, 60, yPos);

    doc.setFont(undefined, 'bold');
    doc.text('Business Unit', 110, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.employee.department, 150, yPos);

    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Date Of Joining', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.employee.dateOfJoining || 'N/A', 60, yPos);

    doc.setFont(undefined, 'bold');
    doc.text('Location', 110, yPos);
    doc.setFont(undefined, 'normal');
    doc.text('Pune', 150, yPos);

    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Bank Name', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.employee.bankName || 'Federal Bank', 60, yPos);

    doc.setFont(undefined, 'bold');
    doc.text('Bank Account No.', 110, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.employee.bankAccount || 'XXXXXXXXXXXX', 150, yPos);

    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('IFSC Code', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.employee.ifscCode || '-', 60, yPos);
    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('PF No.', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text('-', 60, yPos);

    doc.setFont(undefined, 'bold');
    doc.text('UAN No.', 110, yPos);
    doc.setFont(undefined, 'normal');
    doc.text('-', 150, yPos);

    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('ESI No.', 20, yPos);
    doc.setFont(undefined, 'normal');
    doc.text('-', 60, yPos);

    doc.setFont(undefined, 'bold');
    doc.text('PAN Number', 110, yPos);
    doc.setFont(undefined, 'normal');
    doc.text(payslipData.employee.panNumber || 'FTZPBXXXXN', 150, yPos);

    yPos += 6;
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
      ['Basic Salary (BS)', payslipData.baseSalary, '0.00', payslipData.grossPay],
      ['House Rent Allowance (HRA)', '0.00', '0.00', '0.00'],
      ['Medical Allowance', '0.00', '0.00', '0.00'],
      ['Transportation Allowance (TA)', '0.00', '0.00', '0.00'],
      ['Shift Allowance', '0.00', '0.00', '0.00'],
      ['Attendence Allowence', '0.00', '0.00', '0.00']
    ];

    const deductions = [
      ['Professional TAX', '200.00'],
      ['ESI', '0.00'],
      ['PF', payslipData.pf]
    ];

    if (parseFloat(payslipData.customDeduction) > 0) {
      deductions.push([payslipData.deductionReason || 'Other Deduction', payslipData.customDeduction]);
    }

    earnings.forEach((item, idx) => {
      doc.text(item[0], 20, yPos);
      doc.text(item[1].toString(), 70, yPos, { align: 'right' });
      doc.text(item[2], 85, yPos, { align: 'right' });
      doc.text(item[3].toString(), 100, yPos, { align: 'right' });

      if (deductions[idx]) {
        doc.text(deductions[idx][0], 110, yPos);
        doc.text(deductions[idx][1], 185, yPos, { align: 'right' });
      }
      yPos += 5;
    });

    yPos += 2;
    doc.line(15, yPos, 195, yPos);

    yPos += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Total Earnings', 20, yPos);
    if (template.visibility?.grossPay !== false) {
      doc.text(payslipData.grossPay, 100, yPos, { align: 'right' });
    }
    doc.text('Total Deduction', 110, yPos);
    if (template.visibility?.deductions !== false) {
      doc.text(payslipData.totalDeductions, 185, yPos, { align: 'right' });
    }

    yPos += 2;
    doc.line(15, yPos, 195, yPos);

    yPos += 8;
    if (template.visibility?.netPay !== false) {
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
      if (currentUser.role === 'employee' && !payslip.released) continue;
      if (statusFilter === 'released' && !payslip.released) continue;
      if (statusFilter === 'pending' && payslip.released) continue;
      history.push(payslip);
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

  const employeeOptions = currentUser.role === 'employee'
    ? [{ value: currentUser.id, label: currentUser.name }]
    : allUsers.filter(u => u.role === 'employee' || u.role === 'hr').map(u => ({ value: u.id, label: `${u.name} (${u.employeeId})` }));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Salary Slips</h1>
        <div className="relative">
          <Button variant="secondary" onClick={() => setShowViewOptions(!showViewOptions)}>
            <Eye size={18} className="inline mr-2" />
            View Options
          </Button>

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

        {template.visibility?.grossPay !== false && privacySettings.grossPay && (
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

        {template.visibility?.deductions !== false && privacySettings.deductions && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Deductions</p>
                <p className="text-3xl font-bold text-red-600">₹{currentPayslip.totalDeductions}</p>
              </div>
              <DollarSign className="text-red-600" size={32} />
            </div>
          </Card>
        )}

        {template.visibility?.netPay !== false && privacySettings.netPay && (
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
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Employee Name</p>
                <p className="font-semibold text-gray-800 dark:text-white">{previewData.employee.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Employee ID</p>
                <p className="font-semibold text-gray-800 dark:text-white">{previewData.employee.employeeId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Designation</p>
                <p className="font-semibold text-gray-800 dark:text-white">{previewData.employee.designation}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                <p className="font-semibold text-gray-800 dark:text-white">{previewData.employee.department}</p>
              </div>
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
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Base Salary</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{previewData.baseSalary}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gross Pay ({previewData.workingDays} days)</span>
                  <span className="font-semibold text-green-600">₹{previewData.grossPay}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Deductions</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{previewData.tax}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Provident Fund (12%)</span>
                  <span className="font-semibold text-gray-800 dark:text-white">₹{previewData.pf}</span>
                </div>
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
