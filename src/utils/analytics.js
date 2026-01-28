import { format, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays } from 'date-fns';

// Analytics and reporting utilities
export const analytics = {
    // Calculate headcount metrics
    headcount: (employees) => {
        const active = employees.filter((e) => e.status === 'Active').length;
        const inactive = employees.filter((e) => e.status !== 'Active').length;

        return {
            total: employees.length,
            active,
            inactive,
            activePercentage: employees.length > 0 ? (active / employees.length) * 100 : 0,
        };
    },

    // Calculate attrition rate
    attritionRate: (employees, period = 'monthly') => {
        const now = new Date();
        const periodStart = period === 'monthly' ? startOfMonth(now) : new Date(now.getFullYear(), 0, 1);

        const leftEmployees = employees.filter((e) => {
            if (!e.exitDate) return false;
            const exitDate = new Date(e.exitDate);
            return exitDate >= periodStart && exitDate <= now;
        });

        const avgHeadcount = employees.length;
        const attrition = avgHeadcount > 0 ? (leftEmployees.length / avgHeadcount) * 100 : 0;

        return {
            count: leftEmployees.length,
            rate: attrition,
            period,
        };
    },

    // Calculate average tenure
    averageTenure: (employees) => {
        const activeEmployees = employees.filter((e) => e.status === 'Active');

        if (activeEmployees.length === 0) return 0;

        const totalDays = activeEmployees.reduce((sum, emp) => {
            const joinDate = new Date(emp.dateOfJoining);
            const days = differenceInDays(new Date(), joinDate);
            return sum + days;
        }, 0);

        const avgDays = totalDays / activeEmployees.length;
        const avgYears = avgDays / 365;

        return {
            days: Math.round(avgDays),
            months: Math.round(avgDays / 30),
            years: parseFloat(avgYears.toFixed(1)),
        };
    },

    // Department-wise distribution
    departmentDistribution: (employees) => {
        const distribution = {};

        employees.forEach((emp) => {
            const dept = emp.department || 'Unassigned';
            distribution[dept] = (distribution[dept] || 0) + 1;
        });

        return Object.entries(distribution).map(([department, count]) => ({
            department,
            count,
            percentage: (count / employees.length) * 100,
        }));
    },

    // Attendance analytics
    attendanceMetrics: (attendanceData, month, year) => {
        const monthData = attendanceData.filter((record) => {
            const date = new Date(record.date);
            return date.getMonth() + 1 === month && date.getFullYear() === year;
        });

        const present = monthData.filter((r) => r.status === 'Present').length;
        const absent = monthData.filter((r) => r.status === 'Absent').length;
        const late = monthData.filter((r) => r.status === 'Late').length;
        const halfDay = monthData.filter((r) => r.status === 'Half Day').length;

        const total = monthData.length;

        return {
            total,
            present,
            absent,
            late,
            halfDay,
            presentPercentage: total > 0 ? (present / total) * 100 : 0,
            avgWorkHours: monthData.reduce((sum, r) => sum + (r.workHours || 0), 0) / (total || 1),
        };
    },

    // Leave analytics
    leaveMetrics: (leaveData, period = 'monthly') => {
        const now = new Date();
        const periodStart = period === 'monthly' ? startOfMonth(now) : new Date(now.getFullYear(), 0, 1);

        const periodLeaves = leaveData.filter((leave) => {
            const startDate = new Date(leave.startDate);
            return startDate >= periodStart && startDate <= now;
        });

        const byType = {};
        const byStatus = {};

        periodLeaves.forEach((leave) => {
            byType[leave.leaveType] = (byType[leave.leaveType] || 0) + 1;
            byStatus[leave.status] = (byStatus[leave.status] || 0) + 1;
        });

        return {
            total: periodLeaves.length,
            byType,
            byStatus,
            avgDuration: periodLeaves.reduce((sum, l) => sum + (l.days || 0), 0) / (periodLeaves.length || 1),
        };
    },

    // Payroll analytics
    payrollMetrics: (payrollData) => {
        const totalGross = payrollData.reduce((sum, p) => sum + (p.basicSalary || 0) + (p.allowances || 0), 0);
        const totalNet = payrollData.reduce((sum, p) => sum + (p.netSalary || 0), 0);
        const totalTax = payrollData.reduce((sum, p) => sum + (p.tax || 0), 0);
        const totalDeductions = payrollData.reduce((sum, p) => sum + (p.deductions || 0), 0);

        return {
            totalGross,
            totalNet,
            totalTax,
            totalDeductions,
            avgSalary: totalNet / (payrollData.length || 1),
            taxPercentage: totalGross > 0 ? (totalTax / totalGross) * 100 : 0,
        };
    },

    // Recruitment metrics
    recruitmentMetrics: (applicants, jobs) => {
        const totalApplications = applicants.length;
        const hired = applicants.filter((a) => a.stage === 'Hired').length;
        const rejected = applicants.filter((a) => a.stage === 'Rejected').length;
        const inProgress = totalApplications - hired - rejected;

        const avgTimeToHire = applicants
            .filter((a) => a.stage === 'Hired' && a.hiredDate)
            .reduce((sum, a) => {
                const applied = new Date(a.appliedDate);
                const hired = new Date(a.hiredDate);
                return sum + differenceInDays(hired, applied);
            }, 0) / (hired || 1);

        return {
            totalApplications,
            hired,
            rejected,
            inProgress,
            conversionRate: totalApplications > 0 ? (hired / totalApplications) * 100 : 0,
            avgTimeToHire: Math.round(avgTimeToHire),
            openPositions: jobs.filter((j) => j.status === 'Active').length,
        };
    },

    // Training metrics
    trainingMetrics: (enrollments, courses) => {
        const totalEnrollments = enrollments.length;
        const completed = enrollments.filter((e) => e.status === 'Completed').length;
        const inProgress = enrollments.filter((e) => e.status === 'In Progress').length;

        return {
            totalEnrollments,
            completed,
            inProgress,
            completionRate: totalEnrollments > 0 ? (completed / totalEnrollments) * 100 : 0,
            avgCompletionTime: enrollments
                .filter((e) => e.status === 'Completed' && e.completedDate)
                .reduce((sum, e) => {
                    const start = new Date(e.enrolledDate);
                    const end = new Date(e.completedDate);
                    return sum + differenceInDays(end, start);
                }, 0) / (completed || 1),
            activeCourses: courses.filter((c) => c.status === 'Active').length,
        };
    },

    // Expense metrics
    expenseMetrics: (expenses, period = 'monthly') => {
        const now = new Date();
        const periodStart = period === 'monthly' ? startOfMonth(now) : new Date(now.getFullYear(), 0, 1);

        const periodExpenses = expenses.filter((exp) => {
            const date = new Date(exp.date);
            return date >= periodStart && date <= now;
        });

        const byCategory = {};
        const byStatus = {};

        periodExpenses.forEach((exp) => {
            byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
            byStatus[exp.status] = (byStatus[exp.status] || 0) + 1;
        });

        const totalAmount = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
        const approved = periodExpenses.filter((e) => e.status === 'Approved' || e.status === 'Reimbursed');
        const approvedAmount = approved.reduce((sum, e) => sum + e.amount, 0);

        return {
            totalExpenses: periodExpenses.length,
            totalAmount,
            approvedAmount,
            pendingAmount: totalAmount - approvedAmount,
            byCategory,
            byStatus,
            avgExpense: totalAmount / (periodExpenses.length || 1),
        };
    },

    // Generate trend data
    generateTrend: (data, dateField, valueField, period = 'monthly') => {
        const grouped = {};

        data.forEach((item) => {
            const date = new Date(item[dateField]);
            const key = period === 'monthly'
                ? format(date, 'MMM yyyy')
                : format(date, 'yyyy');

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item[valueField]);
        });

        return Object.entries(grouped).map(([period, values]) => ({
            period,
            value: values.reduce((sum, v) => sum + v, 0),
            avg: values.reduce((sum, v) => sum + v, 0) / values.length,
            count: values.length,
        }));
    },
};

export default analytics;
