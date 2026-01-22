export const users = [
  {
    id: 1,
    email: 'john.doe@hrmspro.com',
    password: 'Employee@123',
    role: 'employee',
    employeeId: 'EMP001',
    name: 'John Doe',
    department: 'Engineering',
    designation: 'Senior Software Engineer',
    phone: '+1-555-0101',
    dateOfJoining: '2022-01-15',
    reportingTo: 'Sarah Smith',
    address: '123 Main St, New York, NY 10001',
    emergencyContact: '+1-555-0102',
    bloodGroup: 'O+',
    profileImage: null
  },
  {
    id: 2,
    email: 'sarah.smith@hrmspro.com',
    password: 'HRManager@123',
    role: 'hr',
    employeeId: 'HR001',
    name: 'Sarah Smith',
    department: 'Human Resources',
    designation: 'HR Manager',
    phone: '+1-555-0201',
    dateOfJoining: '2020-03-10',
    reportingTo: 'Admin',
    address: '456 Oak Ave, New York, NY 10002',
    emergencyContact: '+1-555-0202',
    bloodGroup: 'A+',
    profileImage: null
  },
  {
    id: 3,
    email: 'admin@hrmspro.com',
    password: 'Ironman@123$',
    role: 'admin',
    employeeId: 'ADM001',
    name: 'Admin User',
    department: 'Administration',
    designation: 'System Administrator',
    phone: '+1-555-0301',
    dateOfJoining: '2019-01-01',
    reportingTo: 'CEO',
    address: '789 Pine Rd, New York, NY 10003',
    emergencyContact: '+1-555-0302',
    bloodGroup: 'B+',
    profileImage: null
  },
  {
    id: 4,
    email: 'jane.wilson@hrmspro.com',
    password: 'Employee@123',
    role: 'employee',
    employeeId: 'EMP002',
    name: 'Jane Wilson',
    department: 'Marketing',
    designation: 'Marketing Manager',
    phone: '+1-555-0401',
    dateOfJoining: '2021-06-20',
    reportingTo: 'Sarah Smith',
    address: '321 Elm St, New York, NY 10004',
    emergencyContact: '+1-555-0402',
    bloodGroup: 'AB+',
    profileImage: null
  },
  {
    id: 5,
    email: 'mike.johnson@hrmspro.com',
    password: 'Employee@123',
    role: 'employee',
    employeeId: 'EMP003',
    name: 'Mike Johnson',
    department: 'Engineering',
    designation: 'Frontend Developer',
    phone: '+1-555-0501',
    dateOfJoining: '2023-02-01',
    reportingTo: 'John Doe',
    address: '654 Maple Dr, New York, NY 10005',
    emergencyContact: '+1-555-0502',
    bloodGroup: 'O-',
    profileImage: null
  },
  {
    id: 6,
    email: 'emily.brown@hrmspro.com',
    password: 'Employee@123',
    role: 'employee',
    employeeId: 'EMP004',
    name: 'Emily Brown',
    department: 'Finance',
    designation: 'Financial Analyst',
    phone: '+1-555-0601',
    dateOfJoining: '2022-08-15',
    reportingTo: 'Sarah Smith',
    address: '987 Cedar Ln, New York, NY 10006',
    emergencyContact: '+1-555-0602',
    bloodGroup: 'A-',
    profileImage: null
  }
];

export const leaveTypes = [
  { id: 1, name: 'Paid Leave', code: 'PL', maxDays: 12 },
  { id: 2, name: 'Casual Leave', code: 'CL', maxDays: 6 }
];

export const generateAttendanceData = () => {
  const attendance = [];
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);

  users.forEach(user => {
    for (let d = new Date(sixMonthsAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const isPresent = Math.random() > 0.1;
        const clockIn = isPresent ? `09:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null;
        const clockOut = isPresent ? `18:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : null;

        attendance.push({
          id: `${user.id}-${d.toISOString().split('T')[0]}`,
          employeeId: user.id,
          date: d.toISOString().split('T')[0],
          clockIn,
          clockOut,
          status: isPresent ? (clockIn > '09:15' ? 'Late' : 'Present') : 'LWP',
          workHours: isPresent ? (Math.random() * 2 + 8).toFixed(2) : 0,
          overtime: isPresent && Math.random() > 0.8 ? (Math.random() * 2).toFixed(2) : 0
        });
      }
    }
  });

  return attendance;
};

export const generateLeaveData = () => {
  const leaves = [];
  const statuses = ['Pending', 'Approved', 'Rejected'];

  users.forEach((user, idx) => {
    for (let i = 0; i < 5; i++) {
      const startDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);

      leaves.push({
        id: `L${idx}${i}${Date.now()}`,
        employeeId: user.id,
        employeeName: user.name,
        leaveType: leaveTypes[Math.floor(Math.random() * leaveTypes.length)].name,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
        reason: 'Personal reasons',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        appliedDate: new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        approvedBy: user.role === 'employee' ? 'Sarah Smith' : null
      });
    }
  });

  return leaves;
};

export const leaveBalances = users.map(user => ({
  employeeId: user.id,
  paidLeave: { total: 12, used: Math.floor(Math.random() * 5), available: 12 - Math.floor(Math.random() * 5) },
  casualLeave: { total: 6, used: Math.floor(Math.random() * 3), available: 6 - Math.floor(Math.random() * 3) },
  lwp: { total: 0, used: Math.floor(Math.random() * 3), available: 0 },
  upl: { total: 0, used: Math.floor(Math.random() * 2), available: 0 }
}));

export const documents = [
  { id: 1, employeeId: 1, name: 'Resume.pdf', type: 'Resume', uploadDate: '2022-01-10', status: 'Approved', expiryDate: null },
  { id: 2, employeeId: 1, name: 'ID_Proof.pdf', type: 'ID Proof', uploadDate: '2022-01-10', status: 'Approved', expiryDate: '2025-12-31' },
  { id: 3, employeeId: 1, name: 'Degree_Certificate.pdf', type: 'Certificate', uploadDate: '2022-01-10', status: 'Approved', expiryDate: null },
  { id: 4, employeeId: 2, name: 'Resume.pdf', type: 'Resume', uploadDate: '2020-03-05', status: 'Approved', expiryDate: null },
  { id: 5, employeeId: 4, name: 'Resume.pdf', type: 'Resume', uploadDate: '2021-06-15', status: 'Pending', expiryDate: null }
];

export const bankAccounts = users.map(user => ({
  employeeId: user.id,
  accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
  bankName: ['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank'][Math.floor(Math.random() * 4)],
  ifscCode: `BANK${Math.floor(100000 + Math.random() * 900000)}`,
  accountType: 'Savings',
  branch: 'New York Main Branch'
}));

export const onboardingTasks = [
  { id: 1, task: 'Complete personal information form', completed: false },
  { id: 2, task: 'Upload required documents', completed: false },
  { id: 3, task: 'Bank account details submission', completed: false },
  { id: 4, task: 'IT equipment assignment', completed: false },
  { id: 5, task: 'Complete orientation training', completed: false },
  { id: 6, task: 'Meet team members', completed: false },
  { id: 7, task: 'Review company policies', completed: false }
];

export const deboardingTasks = [
  { id: 1, task: 'Return laptop and accessories', completed: false },
  { id: 2, task: 'Return ID card and access cards', completed: false },
  { id: 3, task: 'Clear pending work assignments', completed: false },
  { id: 4, task: 'Knowledge transfer completion', completed: false },
  { id: 5, task: 'Exit interview', completed: false },
  { id: 6, task: 'Final settlement calculation', completed: false },
  { id: 7, task: 'Clearance from all departments', completed: false }
];

export const departments = [
  'Engineering',
  'Human Resources',
  'Marketing',
  'Finance',
  'Sales',
  'Operations',
  'Administration',
  'Quality',
  'MIS',
  'Account Management',
  'Customer Success',
  'DNC',
  'Digital Marketing'
];

export const designations = [
  'Admin',
  'Facility',
  'Physical Security',
  'Research Analyst',
  'Sr. Research Analyst',
  'Demand Generation Executive',
  'Sr. Demand Generation Executive',
  'Appointment Generation Executive',
  'Sr. Appointment Generation Executive',
  'Business Development Executive',
  'Sr. Business Development Executive',
  'Quality Analyst',
  'Sr. Quality Analyst',
  'Inside Sales',
  'Team Mentor',
  'Team Leader',
  'Assistant Manager',
  'Manager',
  'Sr. Manager',
  'Director',
  'Head',
  'Vice President',
  'CEO',
  'CFO',
  'CXO'
];
