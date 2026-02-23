/**
 * Salary Cycle Management Utility
 * Handles different pay periods and pro-rata calculations
 */

// Salary cycle types
export const SALARY_CYCLES = {
  MONTHLY: 'monthly',
  SEMI_MONTHLY: 'semi_monthly', // 1st-15th, 16th-end
  BI_WEEKLY: 'bi_weekly', // Every 2 weeks
  WEEKLY: 'weekly'
};

// Default cycle configuration
export const DEFAULT_CYCLE_CONFIG = {
  type: SALARY_CYCLES.MONTHLY,
  startDay: 1, // Day of month (1-31)
  endDay: 'last', // 'last' or specific day
  workingDaysPerMonth: 22,
  workingHoursPerDay: 9,
  overtimeMultiplier: 1.5
};

/**
 * Get salary cycle period for a given date
 */
export const getSalaryCyclePeriod = (date, cycleConfig = DEFAULT_CYCLE_CONFIG) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  
  switch (cycleConfig.type) {
    case SALARY_CYCLES.MONTHLY:
      return {
        startDate: new Date(year, month, cycleConfig.startDay).toISOString().split('T')[0],
        endDate: getLastDayOfMonth(year, month, cycleConfig.endDay),
        period: `${getMonthName(month)} ${year}`
      };
      
    case SALARY_CYCLES.SEMI_MONTHLY:
      const day = d.getDate();
      if (day <= 15) {
        return {
          startDate: new Date(year, month, 1).toISOString().split('T')[0],
          endDate: new Date(year, month, 15).toISOString().split('T')[0],
          period: `${getMonthName(month)} 1-15, ${year}`
        };
      } else {
        return {
          startDate: new Date(year, month, 16).toISOString().split('T')[0],
          endDate: getLastDayOfMonth(year, month),
          period: `${getMonthName(month)} 16-End, ${year}`
        };
      }
      
    case SALARY_CYCLES.BI_WEEKLY:
      // Calculate bi-weekly period based on start day
      const startOfYear = new Date(year, 0, 1);
      const daysSinceStart = Math.floor((d - startOfYear) / (1000 * 60 * 60 * 24));
      const weekNumber = Math.floor(daysSinceStart / 14);
      const periodStart = new Date(startOfYear);
      periodStart.setDate(periodStart.getDate() + (weekNumber * 14));
      const periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 13);
      
      return {
        startDate: periodStart.toISOString().split('T')[0],
        endDate: periodEnd.toISOString().split('T')[0],
        period: `Week ${weekNumber * 2 + 1}-${weekNumber * 2 + 2}, ${year}`
      };
      
    case SALARY_CYCLES.WEEKLY:
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay() + 1); // Monday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      
      return {
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0],
        period: `Week of ${startOfWeek.toLocaleDateString()}`
      };
      
    default:
      return getSalaryCyclePeriod(date, { ...cycleConfig, type: SALARY_CYCLES.MONTHLY });
  }
};

/**
 * Calculate working days in a salary cycle
 */
export const getWorkingDaysInCycle = (startDate, endDate, holidays = [], weeklyOffs = [0, 6]) => {
  let workingDays = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    
    // Skip weekly offs and holidays
    if (!weeklyOffs.includes(dayOfWeek) && !holidays.includes(dateStr)) {
      workingDays++;
    }
  }
  
  return workingDays;
};

/**
 * Calculate pro-rata salary based on actual working days
 */
export const calculateProRataSalary = (
  baseSalary,
  actualWorkingDays,
  totalWorkingDays,
  cycleConfig = DEFAULT_CYCLE_CONFIG
) => {
  if (totalWorkingDays === 0) return 0;
  
  const dailyRate = baseSalary / totalWorkingDays;
  return parseFloat((dailyRate * actualWorkingDays).toFixed(2));
};

/**
 * Calculate salary for joining/exit mid-cycle
 */
export const calculateMidCycleSalary = (
  employee,
  cycleStartDate,
  cycleEndDate,
  actualStartDate, // Employee's joining/exit date
  actualEndDate,
  cycleConfig = DEFAULT_CYCLE_CONFIG
) => {
  const start = new Date(Math.max(new Date(cycleStartDate), new Date(actualStartDate)));
  const end = new Date(Math.min(new Date(cycleEndDate), new Date(actualEndDate)));
  
  if (start > end) return 0;
  
  const totalWorkingDays = getWorkingDaysInCycle(cycleStartDate, cycleEndDate);
  const actualWorkingDays = getWorkingDaysInCycle(
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  );
  
  return calculateProRataSalary(
    employee.salary || 0,
    actualWorkingDays,
    totalWorkingDays,
    cycleConfig
  );
};

/**
 * Calculate overtime pay
 */
export const calculateOvertimePay = (
  baseSalary,
  overtimeHours,
  cycleConfig = DEFAULT_CYCLE_CONFIG
) => {
  const totalWorkingHours = cycleConfig.workingDaysPerMonth * cycleConfig.workingHoursPerDay;
  const hourlyRate = baseSalary / totalWorkingHours;
  return parseFloat((hourlyRate * overtimeHours * cycleConfig.overtimeMultiplier).toFixed(2));
};

/**
 * Get all salary cycles for a year
 */
export const getYearlySalaryCycles = (year, cycleConfig = DEFAULT_CYCLE_CONFIG) => {
  const cycles = [];
  
  switch (cycleConfig.type) {
    case SALARY_CYCLES.MONTHLY:
      for (let month = 0; month < 12; month++) {
        const period = getSalaryCyclePeriod(new Date(year, month, 15), cycleConfig);
        cycles.push(period);
      }
      break;
      
    case SALARY_CYCLES.SEMI_MONTHLY:
      for (let month = 0; month < 12; month++) {
        cycles.push(getSalaryCyclePeriod(new Date(year, month, 10), cycleConfig));
        cycles.push(getSalaryCyclePeriod(new Date(year, month, 20), cycleConfig));
      }
      break;
      
    case SALARY_CYCLES.BI_WEEKLY:
      const startDate = new Date(year, 0, 1);
      for (let i = 0; i < 26; i++) { // ~26 bi-weekly periods in a year
        const date = new Date(startDate);
        date.setDate(date.getDate() + (i * 14));
        if (date.getFullYear() === year) {
          cycles.push(getSalaryCyclePeriod(date, cycleConfig));
        }
      }
      break;
      
    case SALARY_CYCLES.WEEKLY:
      const weekStart = new Date(year, 0, 1);
      for (let i = 0; i < 52; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + (i * 7));
        if (date.getFullYear() === year) {
          cycles.push(getSalaryCyclePeriod(date, cycleConfig));
        }
      }
      break;
  }
  
  return cycles;
};

/**
 * Validate salary cycle configuration
 */
export const validateCycleConfig = (config) => {
  const errors = [];
  
  if (!Object.values(SALARY_CYCLES).includes(config.type)) {
    errors.push('Invalid cycle type');
  }
  
  if (config.startDay < 1 || config.startDay > 31) {
    errors.push('Start day must be between 1 and 31');
  }
  
  if (config.workingDaysPerMonth < 1 || config.workingDaysPerMonth > 31) {
    errors.push('Working days per month must be between 1 and 31');
  }
  
  if (config.workingHoursPerDay < 1 || config.workingHoursPerDay > 24) {
    errors.push('Working hours per day must be between 1 and 24');
  }
  
  return { valid: errors.length === 0, errors };
};

// Helper functions
const getLastDayOfMonth = (year, month, endDay = 'last') => {
  if (endDay === 'last') {
    return new Date(year, month + 1, 0).toISOString().split('T')[0];
  }
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(parseInt(endDay), lastDay);
  return new Date(year, month, day).toISOString().split('T')[0];
};

const getMonthName = (month) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month];
};

export default {
  SALARY_CYCLES,
  DEFAULT_CYCLE_CONFIG,
  getSalaryCyclePeriod,
  getWorkingDaysInCycle,
  calculateProRataSalary,
  calculateMidCycleSalary,
  calculateOvertimePay,
  getYearlySalaryCycles,
  validateCycleConfig
};
