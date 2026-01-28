import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// PDF Export Utilities
export const exportToPDF = {
    // Export attendance report
    attendanceReport: (data, options = {}) => {
        const doc = new jsPDF();
        const {
            title = 'Attendance Report',
            employeeName = '',
            month = '',
            year = '',
        } = options;

        // Add company logo/header
        doc.setFontSize(20);
        doc.setTextColor(59, 130, 246); // primary-600
        doc.text('HRMS Pro', 14, 20);

        // Add title
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(title, 14, 35);

        // Add metadata
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        if (employeeName) doc.text(`Employee: ${employeeName}`, 14, 45);
        if (month && year) doc.text(`Period: ${month} ${year}`, 14, 50);
        doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 55);

        // Prepare table data
        const tableData = data.map((row) => [
            format(new Date(row.date), 'dd/MM/yyyy'),
            row.clockIn || '-',
            row.clockOut || '-',
            row.workHours || '-',
            row.status || '-',
        ]);

        // Add table
        doc.autoTable({
            startY: 65,
            head: [['Date', 'Clock In', 'Clock Out', 'Work Hours', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250],
            },
        });

        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Page ${i} of ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        // Save the PDF
        doc.save(`attendance-report-${Date.now()}.pdf`);
    },

    // Export payslip
    payslip: (employeeData, payrollData, options = {}) => {
        const doc = new jsPDF();
        const { month, year } = options;

        // Header
        doc.setFontSize(20);
        doc.setTextColor(59, 130, 246);
        doc.text('HRMS Pro', 14, 20);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Salary Slip', 14, 35);

        // Employee details
        doc.setFontSize(10);
        doc.text(`Employee Name: ${employeeData.firstName} ${employeeData.lastName}`, 14, 50);
        doc.text(`Employee ID: ${employeeData.employeeId}`, 14, 56);
        doc.text(`Department: ${employeeData.department}`, 14, 62);
        doc.text(`Designation: ${employeeData.designation}`, 14, 68);
        doc.text(`Month/Year: ${month}/${year}`, 14, 74);

        // Earnings table
        const earningsData = [
            ['Basic Salary', payrollData.basicSalary?.toFixed(2) || '0.00'],
            ['Allowances', payrollData.allowances?.toFixed(2) || '0.00'],
        ];

        doc.autoTable({
            startY: 85,
            head: [['Earnings', 'Amount (₹)']],
            body: earningsData,
            theme: 'grid',
            headStyles: { fillColor: [34, 197, 94] },
            styles: { fontSize: 10 },
        });

        // Deductions table
        const deductionsData = [
            ['Tax', payrollData.tax?.toFixed(2) || '0.00'],
            ['Other Deductions', payrollData.deductions?.toFixed(2) || '0.00'],
        ];

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Deductions', 'Amount (₹)']],
            body: deductionsData,
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68] },
            styles: { fontSize: 10 },
        });

        // Net salary
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(
            `Net Salary: ₹${payrollData.netSalary?.toFixed(2) || '0.00'}`,
            14,
            doc.lastAutoTable.finalY + 20
        );

        doc.save(`payslip-${employeeData.employeeId}-${month}-${year}.pdf`);
    },

    // Export employee list
    employeeList: (employees, options = {}) => {
        const doc = new jsPDF('landscape');
        const { title = 'Employee Directory' } = options;

        // Header
        doc.setFontSize(20);
        doc.setTextColor(59, 130, 246);
        doc.text('HRMS Pro', 14, 20);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(title, 14, 35);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 45);
        doc.text(`Total Employees: ${employees.length}`, 14, 51);

        // Prepare table data
        const tableData = employees.map((emp) => [
            emp.employeeId || '-',
            `${emp.firstName} ${emp.lastName}`,
            emp.email || '-',
            emp.department || '-',
            emp.designation || '-',
            emp.phone || '-',
        ]);

        // Add table
        doc.autoTable({
            startY: 60,
            head: [['ID', 'Name', 'Email', 'Department', 'Designation', 'Phone']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            styles: {
                fontSize: 8,
                cellPadding: 2,
            },
        });

        doc.save(`employee-directory-${Date.now()}.pdf`);
    },

    // Generic table export
    table: (data, columns, options = {}) => {
        const doc = new jsPDF(options.orientation || 'portrait');
        const {
            title = 'Report',
            subtitle = '',
        } = options;

        // Header
        doc.setFontSize(20);
        doc.setTextColor(59, 130, 246);
        doc.text('HRMS Pro', 14, 20);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(title, 14, 35);

        if (subtitle) {
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(subtitle, 14, 45);
        }

        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, subtitle ? 51 : 45);

        // Prepare table
        const headers = columns.map((col) => col.header);
        const tableData = data.map((row) =>
            columns.map((col) => row[col.key] || '-')
        );

        doc.autoTable({
            startY: subtitle ? 60 : 55,
            head: [headers],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
        });

        doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`);
    },
};

export default exportToPDF;
