/**
 * Final Settlement Calculator
 * Calculates all dues for exiting employees
 */

/**
 * Calculate final settlement for exiting employee
 */
export const calculateFinalSettlement = (employee, exitDate, attendance = [], leaves = [], leaveBalances = {}) => {
  const joiningDate = new Date(employee.dateOfJoining || employee.joiningDate);
  const lastDay = new Date(exitDate);
  const monthlySalary = (employee.ctc || 0) / 12;
  
  // 1. Pro-rata salary for current month
  const currentMonth = lastDay.getMonth();
  const currentYear = lastDay.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const workedDays = lastDay.getDate();
  const proRataSalary = (monthlySalary / daysInMonth) * workedDays;

  // 2. Unused leave encashment
  const balance = leaveBalances[employee.id] || leaveBalances[employee.uid] || {};
  const plAvailable = balance.paidLeave?.available || 0;
  const clAvailable = balance.casualLeave?.available || 0;
  const totalUnusedLeaves = plAvailable + clAvailable;
  const dailyRate = monthlySalary / 30;
  const leaveEncashment = totalUnusedLeaves * dailyRate;

  // 3. Notice period recovery (if applicable)
  const noticePeriodDays = 30;
  const actualNoticeDays = calculateNoticeDays(employee.resignationDate, exitDate);
  const shortfallDays = Math.max(0, noticePeriodDays - actualNoticeDays);
  const noticePeriodRecovery = shortfallDays * dailyRate;

  // 4. Pending reimbursements (if any)
  const pendingReimbursements = employee.pendingReimbursements || 0;

  // 5. Gratuity (if eligible - 5+ years)
  const tenureYears = (lastDay - joiningDate) / (1000 * 60 * 60 * 24 * 365);
  const gratuity = tenureYears >= 5 ? (monthlySalary * 15 * tenureYears) / 26 : 0;

  // 6. Bonus (pro-rated if applicable)
  const annualBonus = employee.annualBonus || 0;
  const monthsWorked = currentMonth + 1;
  const proRatedBonus = (annualBonus / 12) * monthsWorked;

  // Total calculations
  const grossAmount = proRataSalary + leaveEncashment + gratuity + proRatedBonus + pendingReimbursements;
  const deductions = noticePeriodRecovery;
  const netSettlement = grossAmount - deductions;

  return {
    breakdown: {
      proRataSalary: parseFloat(proRataSalary.toFixed(2)),
      leaveEncashment: parseFloat(leaveEncashment.toFixed(2)),
      gratuity: parseFloat(gratuity.toFixed(2)),
      proRatedBonus: parseFloat(proRatedBonus.toFixed(2)),
      pendingReimbursements: parseFloat(pendingReimbursements.toFixed(2)),
      noticePeriodRecovery: parseFloat(noticePeriodRecovery.toFixed(2))
    },
    summary: {
      grossAmount: parseFloat(grossAmount.toFixed(2)),
      totalDeductions: parseFloat(deductions.toFixed(2)),
      netSettlement: parseFloat(netSettlement.toFixed(2))
    },
    details: {
      workedDays,
      daysInMonth,
      unusedLeaves: totalUnusedLeaves,
      tenureYears: parseFloat(tenureYears.toFixed(2)),
      noticePeriodShortfall: shortfallDays
    }
  };
};

/**
 * Calculate notice period days
 */
const calculateNoticeDays = (resignationDate, exitDate) => {
  if (!resignationDate) return 30; // Assume full notice if no resignation date
  const start = new Date(resignationDate);
  const end = new Date(exitDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Generate settlement breakdown report
 */
export const generateSettlementReport = (employee, settlement) => {
  return {
    employeeId: employee.employeeId || employee.id,
    employeeName: employee.name,
    department: employee.department,
    designation: employee.designation,
    joiningDate: employee.dateOfJoining || employee.joiningDate,
    exitDate: settlement.exitDate,
    tenure: `${settlement.details.tenureYears} years`,
    breakdown: settlement.breakdown,
    summary: settlement.summary,
    generatedAt: new Date().toISOString()
  };
};

export default {
  calculateFinalSettlement,
  generateSettlementReport
};
