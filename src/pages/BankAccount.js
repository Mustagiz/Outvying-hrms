import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Alert } from '../components/UI';
import { CreditCard, Building, Search, Download, User, Hash, MapPin } from 'lucide-react';

const BankAccount = () => {
  const { currentUser, bankAccounts, updateBankAccount, allUsers } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(currentUser.role === 'employee' ? String(currentUser.id) : null);

  // Local filter state (UI inputs)
  const [localFilters, setLocalFilters] = useState({
    searchTerm: '',
    departmentFilter: 'all',
    dateFilter: 'all'
  });

  // Applied filter state (actual filtering)
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    departmentFilter: 'all',
    dateFilter: 'all'
  });

  const myBankAccount = useMemo(() => {
    const empId = currentUser.role === 'employee' ? String(currentUser.id) : String(selectedEmployee);
    console.log("BankAccount Debug - Current User Role:", currentUser.role);
    console.log("BankAccount Debug - Targeted EmpId:", empId);
    console.log("BankAccount Debug - Total Bank Accounts:", bankAccounts.length);

    if (!empId || empId === 'null') return {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountType: 'Savings',
      branch: ''
    };

    const emp = allUsers.find(u => String(u.id) === String(empId) || String(u.uid) === String(empId));

    // Try matching by UID first, then by numeric employeeId
    const found = bankAccounts.find(b =>
      String(b.id) === String(empId) ||
      (emp && b.employeeId && String(b.employeeId) === String(emp.employeeId)) ||
      (emp && String(b.id) === String(emp.employeeId))
    );

    console.log("BankAccount Debug - Found Account:", found);
    return found || {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountType: 'Savings',
      branch: ''
    };
  }, [bankAccounts, currentUser, selectedEmployee, allUsers]);

  useEffect(() => {
    setFormData(myBankAccount);
  }, [myBankAccount]);

  const [formData, setFormData] = useState(myBankAccount);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const empId = currentUser.role === 'employee' ? String(currentUser.id) : String(selectedEmployee);
    const result = await updateBankAccount(empId, formData);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    if (result.success) {
      setIsEditing(false);
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const downloadCSV = () => {
    const filteredEmployees = allUsers.filter(u => {
      if (u.role !== 'employee' && u.role !== 'hr') return false;
      if (appliedFilters.searchTerm && !u.name.toLowerCase().includes(appliedFilters.searchTerm.toLowerCase()) && !u.employeeId.toLowerCase().includes(appliedFilters.searchTerm.toLowerCase())) return false;
      if (appliedFilters.departmentFilter !== 'all' && u.department !== appliedFilters.departmentFilter) return false;
      return true;
    });

    const headers = ['Employee ID', 'Employee Name', 'Department', 'Bank Name', 'Account Number', 'IFSC Code', 'Account Type', 'Branch'];
    const rows = filteredEmployees.map(emp => {
      // Try matching by UID first, then by numeric employeeId
      const bankAcc = bankAccounts.find(b =>
        String(b.id) === String(emp.id) ||
        (emp.employeeId && b.employeeId && String(b.employeeId) === String(emp.employeeId)) ||
        String(b.id) === String(emp.employeeId)
      ) || {};
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

  const handleApplyFilters = () => {
    setAppliedFilters(localFilters);
  };

  const handleClearFilters = () => {
    const cleared = {
      searchTerm: '',
      departmentFilter: 'all',
      dateFilter: 'all'
    };
    setLocalFilters(cleared);
    setAppliedFilters(cleared);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bank Account Details</h1>
        <div className="flex gap-2">
          {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
            <Button onClick={downloadCSV} variant="secondary">
              <Download size={18} className="inline mr-2" />
              Download CSV
            </Button>
          )}
          {!isEditing && (currentUser.role === 'employee' || currentUser.role === 'admin' || currentUser.role === 'hr') && selectedEmployee && (
            <Button onClick={() => setIsEditing(true)}>Edit Details</Button>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Employee</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={localFilters.searchTerm}
                  onChange={(e) => setLocalFilters({ ...localFilters, searchTerm: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
              <select
                value={localFilters.departmentFilter}
                onChange={(e) => setLocalFilters({ ...localFilters, departmentFilter: e.target.value })}
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
                value={localFilters.dateFilter}
                onChange={(e) => setLocalFilters({ ...localFilters, dateFilter: e.target.value })}
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
                  setSelectedEmployee(e.target.value);
                  setIsEditing(false);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select an employee</option>
                {allUsers.filter(u => {
                  console.log("BankAccount Debug - Filtering User:", u.name, "Role:", u.role);
                  if (u.role !== 'employee' && u.role !== 'hr') return false;
                  if (appliedFilters.searchTerm && !u.name.toLowerCase().includes(appliedFilters.searchTerm.toLowerCase()) && !u.employeeId.toLowerCase().includes(appliedFilters.searchTerm.toLowerCase())) return false;
                  if (appliedFilters.departmentFilter !== 'all' && u.department !== appliedFilters.departmentFilter) return false;
                  if (appliedFilters.dateFilter !== 'all' && u.dateOfJoining) {
                    const joinDate = new Date(u.dateOfJoining);
                    const now = new Date();
                    if (appliedFilters.dateFilter === 'thisMonth' && (joinDate.getMonth() !== now.getMonth() || joinDate.getFullYear() !== now.getFullYear())) return false;
                    if (appliedFilters.dateFilter === 'lastMonth') {
                      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                      if (joinDate.getMonth() !== lastMonth.getMonth() || joinDate.getFullYear() !== lastMonth.getFullYear()) return false;
                    }
                    if (appliedFilters.dateFilter === 'last3Months' && joinDate < new Date(now.setMonth(now.getMonth() - 3))) return false;
                    if (appliedFilters.dateFilter === 'last6Months' && joinDate < new Date(now.setMonth(now.getMonth() - 6))) return false;
                    if (appliedFilters.dateFilter === 'thisYear' && joinDate.getFullYear() !== new Date().getFullYear()) return false;
                  }
                  return true;
                }).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters} variant="primary" className="flex-1">
              <Search size={16} className="inline mr-2" />
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} variant="secondary">
              Clear
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedEmployee && (
          <Card title="Account Information">
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                {/* Employee Info */}
                <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <User size={18} className="text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider">Employee Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Name</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                          {allUsers.find(u => String(u.id) === String(selectedEmployee))?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <Hash size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Employee ID</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                          {allUsers.find(u => String(u.id) === String(selectedEmployee))?.employeeId || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

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
                {/* Employee Info */}
                <div className="mb-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <User size={18} className="text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider">Employee Information</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <User size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Name</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                          {allUsers.find(u => String(u.id) === String(selectedEmployee))?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <Hash size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Employee ID</p>
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                          {allUsers.find(u => String(u.id) === String(selectedEmployee))?.employeeId || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

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
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">IFSC Code</p>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white pl-6">
                    {myBankAccount.ifscCode || 'Not provided'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard size={16} className="text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account Type</p>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white pl-6">
                    {myBankAccount.accountType || 'Not provided'}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Building size={16} className="text-gray-400" />
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Branch</p>
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white pl-6">
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
