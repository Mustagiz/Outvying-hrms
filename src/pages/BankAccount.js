import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Alert } from '../components/UI';
import { CreditCard, Building, Search, Download } from 'lucide-react';

const BankAccount = () => {
  const { currentUser, bankAccounts, updateBankAccount, allUsers } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser.role === 'employee' ? currentUser.id : null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const myBankAccount = useMemo(() => {
    const empId = currentUser.role === 'employee' ? currentUser.id : selectedEmployee;
    return bankAccounts.find(b => b.employeeId === empId) || {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountType: 'Savings',
      branch: ''
    };
  }, [bankAccounts, currentUser, selectedEmployee]);

  useEffect(() => {
    setFormData(myBankAccount);
  }, [myBankAccount]);

  const [formData, setFormData] = useState(myBankAccount);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const empId = currentUser.role === 'employee' ? currentUser.id : selectedEmployee;
    const result = updateBankAccount(empId, formData);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setIsEditing(false);
    setTimeout(() => setAlert(null), 3000);
  };

  const downloadCSV = () => {
    const filteredEmployees = allUsers.filter(u => {
      if (u.role !== 'employee' && u.role !== 'hr') return false;
      if (searchTerm && !u.name.toLowerCase().includes(searchTerm.toLowerCase()) && !u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (departmentFilter !== 'all' && u.department !== departmentFilter) return false;
      return true;
    });

    const headers = ['Employee ID', 'Employee Name', 'Department', 'Bank Name', 'Account Number', 'IFSC Code', 'Account Type', 'Branch'];
    const rows = filteredEmployees.map(emp => {
      const bankAcc = bankAccounts.find(b => b.employeeId === emp.id) || {};
      return [
        emp.employeeId || '',
        emp.name || '',
        emp.department || '',
        bankAcc.bankName || '',
        bankAcc.accountNumber || '',
        bankAcc.ifscCode || '',
        bankAcc.accountType || '',
        bankAcc.branch || ''
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bank_accounts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bank Account Details</h1>
        <div className="flex gap-2">
          {currentUser.role === 'admin' && (
            <Button onClick={downloadCSV} variant="secondary">
              <Download size={18} className="inline mr-2" />
              Download CSV
            </Button>
          )}
          {!isEditing && currentUser.role === 'employee' && (
            <Button onClick={() => setIsEditing(true)}>Edit Details</Button>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {currentUser.role === 'admin' && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Employee</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Joined Date</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
                <option value="last6Months">Last 6 Months</option>
                <option value="thisYear">This Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Employee</label>
              <select
                value={selectedEmployee || ''}
                onChange={(e) => {
                  setSelectedEmployee(parseInt(e.target.value));
                  setIsEditing(false);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select an employee</option>
                {allUsers.filter(u => {
                  if (u.role !== 'employee' && u.role !== 'hr') return false;
                  if (searchTerm && !u.name.toLowerCase().includes(searchTerm.toLowerCase()) && !u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) return false;
                  if (departmentFilter !== 'all' && u.department !== departmentFilter) return false;
                  if (dateFilter !== 'all' && u.dateOfJoining) {
                    const joinDate = new Date(u.dateOfJoining);
                    const now = new Date();
                    if (dateFilter === 'thisMonth' && (joinDate.getMonth() !== now.getMonth() || joinDate.getFullYear() !== now.getFullYear())) return false;
                    if (dateFilter === 'lastMonth') {
                      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                      if (joinDate.getMonth() !== lastMonth.getMonth() || joinDate.getFullYear() !== lastMonth.getFullYear()) return false;
                    }
                    if (dateFilter === 'last3Months' && joinDate < new Date(now.setMonth(now.getMonth() - 3))) return false;
                    if (dateFilter === 'last6Months' && joinDate < new Date(now.setMonth(now.getMonth() - 6))) return false;
                    if (dateFilter === 'thisYear' && joinDate.getFullYear() !== new Date().getFullYear()) return false;
                  }
                  return true;
                }).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedEmployee && (
          <Card title="Account Information">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <Input
                  label="Bank Name"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Account Number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="IFSC Code"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Account Type"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  required
                />

                <div className="flex justify-end space-x-3 mt-4">
                  <Button type="button" variant="secondary" onClick={() => {
                    setIsEditing(false);
                    setFormData(myBankAccount);
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Building className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bank Name</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {myBankAccount.bankName || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CreditCard className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Account Number</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {myBankAccount.accountNumber || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">IFSC Code</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {myBankAccount.ifscCode || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Account Type</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {myBankAccount.accountType || 'Not provided'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Branch</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {myBankAccount.branch || 'Not provided'}
                  </p>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default BankAccount;
