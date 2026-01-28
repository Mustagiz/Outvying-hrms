import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Excel Export Utilities
export const exportToExcel = {
    // Export attendance data
    attendance: (data, options = {}) => {
        const {
            fileName = 'attendance-report',
            employeeName = '',
            month = '',
            year = '',
        } = options;

        // Prepare worksheet data
        const wsData = [
            ['HRMS Pro - Attendance Report'],
            [],
            ['Employee:', employeeName],
            ['Period:', `${month} ${year}`],
            ['Generated:', format(new Date(), 'PPpp')],
            [],
            ['Date', 'Clock In', 'Clock Out', 'Work Hours', 'Status', 'Notes'],
        ];

        // Add data rows
        data.forEach((row) => {
            wsData.push([
                format(new Date(row.date), 'dd/MM/yyyy'),
                row.clockIn || '-',
                row.clockOut || '-',
                row.workHours || '-',
                row.status || '-',
                row.notes || '',
            ]);
        });

        // Add summary
        wsData.push([]);
        wsData.push(['Summary']);
        wsData.push(['Total Days:', data.length]);
        wsData.push(['Present:', data.filter((r) => r.status === 'Present').length]);
        wsData.push(['Absent:', data.filter((r) => r.status === 'Absent').length]);
        wsData.push(['Late:', data.filter((r) => r.status === 'Late').length]);

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        ws['!cols'] = [
            { wch: 12 },
            { wch: 10 },
            { wch: 10 },
            { wch: 12 },
            { wch: 10 },
            { wch: 30 },
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

        // Save file
        XLSX.writeFile(wb, `${fileName}-${Date.now()}.xlsx`);
    },

    // Export payroll data
    payroll: (data, options = {}) => {
        const { fileName = 'payroll-report', month = '', year = '' } = options;

        const wsData = [
            ['HRMS Pro - Payroll Report'],
            [],
            ['Period:', `${month} ${year}`],
            ['Generated:', format(new Date(), 'PPpp')],
            [],
            [
                'Employee ID',
                'Name',
                'Department',
                'Basic Salary',
                'Allowances',
                'Gross Salary',
                'Tax',
                'Deductions',
                'Net Salary',
            ],
        ];

        // Add data rows
        data.forEach((row) => {
            wsData.push([
                row.employeeId || '-',
                `${row.firstName} ${row.lastName}`,
                row.department || '-',
                row.basicSalary || 0,
                row.allowances || 0,
                (row.basicSalary || 0) + (row.allowances || 0),
                row.tax || 0,
                row.deductions || 0,
                row.netSalary || 0,
            ]);
        });

        // Add totals
        const totalBasic = data.reduce((sum, r) => sum + (r.basicSalary || 0), 0);
        const totalAllowances = data.reduce((sum, r) => sum + (r.allowances || 0), 0);
        const totalTax = data.reduce((sum, r) => sum + (r.tax || 0), 0);
        const totalDeductions = data.reduce((sum, r) => sum + (r.deductions || 0), 0);
        const totalNet = data.reduce((sum, r) => sum + (r.netSalary || 0), 0);

        wsData.push([]);
        wsData.push([
            'TOTAL',
            '',
            '',
            totalBasic,
            totalAllowances,
            totalBasic + totalAllowances,
            totalTax,
            totalDeductions,
            totalNet,
        ]);

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        ws['!cols'] = [
            { wch: 12 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 10 },
            { wch: 12 },
            { wch: 12 },
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Payroll');
        XLSX.writeFile(wb, `${fileName}-${Date.now()}.xlsx`);
    },

    // Export employee directory
    employees: (data, options = {}) => {
        const { fileName = 'employee-directory' } = options;

        const wsData = [
            ['HRMS Pro - Employee Directory'],
            [],
            ['Generated:', format(new Date(), 'PPpp')],
            ['Total Employees:', data.length],
            [],
            [
                'Employee ID',
                'First Name',
                'Last Name',
                'Email',
                'Phone',
                'Department',
                'Designation',
                'Date of Joining',
                'Status',
            ],
        ];

        data.forEach((emp) => {
            wsData.push([
                emp.employeeId || '-',
                emp.firstName || '-',
                emp.lastName || '-',
                emp.email || '-',
                emp.phone || '-',
                emp.department || '-',
                emp.designation || '-',
                emp.dateOfJoining ? format(new Date(emp.dateOfJoining), 'dd/MM/yyyy') : '-',
                emp.status || 'Active',
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws['!cols'] = [
            { wch: 12 },
            { wch: 15 },
            { wch: 15 },
            { wch: 25 },
            { wch: 15 },
            { wch: 15 },
            { wch: 20 },
            { wch: 15 },
            { wch: 10 },
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Employees');
        XLSX.writeFile(wb, `${fileName}-${Date.now()}.xlsx`);
    },

    // Export leave data
    leaves: (data, options = {}) => {
        const { fileName = 'leave-report' } = options;

        const wsData = [
            ['HRMS Pro - Leave Report'],
            [],
            ['Generated:', format(new Date(), 'PPpp')],
            [],
            [
                'Employee ID',
                'Employee Name',
                'Leave Type',
                'Start Date',
                'End Date',
                'Days',
                'Reason',
                'Status',
                'Applied On',
            ],
        ];

        data.forEach((leave) => {
            wsData.push([
                leave.employeeId || '-',
                leave.employeeName || '-',
                leave.leaveType || '-',
                leave.startDate ? format(new Date(leave.startDate), 'dd/MM/yyyy') : '-',
                leave.endDate ? format(new Date(leave.endDate), 'dd/MM/yyyy') : '-',
                leave.days || '-',
                leave.reason || '-',
                leave.status || '-',
                leave.appliedOn ? format(new Date(leave.appliedOn), 'dd/MM/yyyy') : '-',
            ]);
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws['!cols'] = [
            { wch: 12 },
            { wch: 20 },
            { wch: 12 },
            { wch: 12 },
            { wch: 12 },
            { wch: 8 },
            { wch: 30 },
            { wch: 10 },
            { wch: 12 },
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Leaves');
        XLSX.writeFile(wb, `${fileName}-${Date.now()}.xlsx`);
    },

    // Generic table export
    table: (data, columns, options = {}) => {
        const {
            fileName = 'export',
            sheetName = 'Sheet1',
            title = 'Report',
        } = options;

        const wsData = [
            [title],
            [],
            ['Generated:', format(new Date(), 'PPpp')],
            [],
            columns.map((col) => col.header),
        ];

        data.forEach((row) => {
            wsData.push(columns.map((col) => row[col.key] || '-'));
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Auto-size columns
        ws['!cols'] = columns.map(() => ({ wch: 15 }));

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${fileName}-${Date.now()}.xlsx`);
    },

    // Export multiple sheets
    multiSheet: (sheets, options = {}) => {
        const { fileName = 'multi-sheet-export' } = options;

        const wb = XLSX.utils.book_new();

        sheets.forEach((sheet) => {
            const wsData = [
                [sheet.title || 'Data'],
                [],
                ['Generated:', format(new Date(), 'PPpp')],
                [],
                sheet.columns.map((col) => col.header),
            ];

            sheet.data.forEach((row) => {
                wsData.push(sheet.columns.map((col) => row[col.key] || '-'));
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws['!cols'] = sheet.columns.map(() => ({ wch: 15 }));

            XLSX.utils.book_append_sheet(wb, ws, sheet.sheetName || 'Sheet');
        });

        XLSX.writeFile(wb, `${fileName}-${Date.now()}.xlsx`);
    },
};

export default exportToExcel;
