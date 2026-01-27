import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Alert } from '../components/UI';
import { CreditCard, Building, Search, Download, User, Hash, MapPin, Filter, X } from 'lucide-react';
import { exportToCSV } from '../utils/helpers';


const BankAccount = () => {
  const { currentUser, bankAccounts, updateBankAccount, allUsers } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState(null);

  // Initialize with current user if employee, otherwise null
  const [selectedEmployee, setSelectedEmployee] = useState(
    currentUser.role === 'employee' ? String(currentUser.id) : ''
  );

  // Local filter state (UI inputs)
  const [localFilters, setLocalFilters] = useState({
    searchTerm: '',
    departmentFilter: 'all',
  });

  const myBankAccount = useMemo(() => {
    // If Admin hasn't selected anyone, return empty
    if (!selectedEmployee) return {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountType: 'Savings',
      branch: ''
    };

    const empId = String(selectedEmployee);
    // Try matching by ID (UID) or employeeId field
    const found = bankAccounts.find(b =>
      String(b.id) === empId ||
      String(b.employeeId) === empId
    );

    return found || {
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      accountType: 'Savings',
      branch: ''
    };
  }, [bankAccounts, selectedEmployee]);

  // Update form data when selection changes or data is loaded
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
    if (!selectedEmployee) return;

    const result = await updateBankAccount(selectedEmployee, formData); // Pass ID directly
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    if (result.success) {
      setIsEditing(false);
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const downloadCSV = () => {
    // Export logic
    const dataToExport = allUsers.map(emp => {
      const bank = bankAccounts.find(b => String(b.id) === String(emp.id)) || {};
      return {
        'Employee ID': emp.employeeId,
        'Name': emp.name,
        'Department': emp.department,
        'Bank Name': bank.bankName || 'N/A',
        'Account Number': bank.accountNumber ? `'${bank.accountNumber}` : 'N/A', // Escape for Excel
        'IFSC': bank.ifscCode || 'N/A',
        'Branch': bank.branch || 'N/A'
      };
    });
    exportToCSV(dataToExport, 'Employee_Bank_Accounts');
  };

  // Filter Logic for Dropdown
  const filteredEmployees = useMemo(() => {
    return allUsers.filter(u => {
      // Basic role check
      if (u.role !== 'employee' && u.role !== 'hr' && u.role !== 'admin') return false;

      const searchLower = localFilters.searchTerm.toLowerCase();
      const nameMatch = u.name?.toLowerCase().includes(searchLower) || false;
      const idMatch = u.employeeId?.toLowerCase().includes(searchLower) || false;

      if (localFilters.searchTerm && !nameMatch && !idMatch) return false;
      if (localFilters.departmentFilter !== 'all' && u.department !== localFilters.departmentFilter) return false;

      return true;
    });
  }, [allUsers, localFilters]);

  // Selected Employee Details Helper
  const selectedUser = allUsers.find(u => String(u.id) === String(selectedEmployee));

  const clearFilters = () => {
    setLocalFilters({ searchTerm: '', departmentFilter: 'all' });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Bank Accounts</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage employee banking details for payroll</p>
        </div>

        <div className="flex gap-2">
          {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
            <Button onClick={downloadCSV} variant="secondary" className="shadow-sm">
              <Download size={18} className="inline mr-2" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Admin Filters & Selection */}
      {(currentUser.role === 'admin' || currentUser.role === 'hr') && (
        <Card className="bg-white dark:bg-gray-800 border-none shadow-lg rounded-2xl overflow-visible">
          <div className="p-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Search */}
              <div className="md:col-span-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Search Employee</label>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search name or ID..."
                    value={localFilters.searchTerm}
                    onChange={(e) => setLocalFilters({ ...localFilters, searchTerm: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                  />
                  {localFilters.searchTerm && (
                    <button onClick={() => setLocalFilters({ ...localFilters, searchTerm: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Department Filter */}
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Department</label>
                <select
                  value={localFilters.departmentFilter}
                  onChange={(e) => setLocalFilters({ ...localFilters, departmentFilter: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none cursor-pointer"
                >
                  <option value="all">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              {/* Employee Selector used as Result List */}
              <div className="md:col-span-5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                  Select Employee ({filteredEmployees.length})
                </label>
                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => {
                    setSelectedEmployee(e.target.value);
                    setIsEditing(false);
                  }}
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border-2 border-primary-100 dark:border-primary-900/30 rounded-xl focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 text-gray-900 dark:text-white font-medium cursor-pointer shadow-sm hover:border-primary-300 transition-all"
                >
                  <option value="">-- Choose an employee to view details --</option>
                  {filteredEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeId || 'No ID'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Detail View */}
      {selectedEmployee ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">

          {/* Left Column: User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-6">
              <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>

              <div className="px-6 pb-6">
                {/* Avatar Wrapper using negative margin to pull overlapping */}
                <div className="relative -mt-10 mb-4 inline-block">
                  <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-lg">
                    <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-2xl font-black text-indigo-600">
                      {selectedUser?.name?.charAt(0) || 'U'}
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser?.name || 'Unknown User'}</h2>
                  <p className="text-sm text-gray-500 font-medium mb-4">{selectedUser?.designation || 'Employee'}</p>

                  <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 text-sm">
                      <Hash size={16} className="text-gray-400" />
                      <span className="font-mono text-gray-600 dark:text-gray-300">{selectedUser?.employeeId || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Building size={16} className="text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedUser?.department || 'No Dept'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <User size={16} className="text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-300">{selectedUser?.email || 'No Email'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Bank Details Form */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CreditCard size={20} className="text-indigo-600" />
                    Account Information
                  </h3>
                  <p className="text-sm text-gray-500">Official salary account details</p>
                </div>
                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)} variant="secondary" className="text-sm">
                    Edit Details
                  </Button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} required placeholder="e.g. HDFC Bank" />
                    <Input label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} required placeholder="xxxxxxxxxx" />
                    <Input label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} required placeholder="HDFC0001234" />
                    <Input label="Branch Name" name="branch" value={formData.branch} onChange={handleInputChange} required placeholder="Main Branch, City" />
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                      <select
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                      >
                        <option value="Savings">Savings Account</option>
                        <option value="Current">Current Account</option>
                        <option value="Salary">Salary Account</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button type="button" variant="secondary" onClick={() => { setIsEditing(false); setFormData(myBankAccount); }}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  {/* Visual Bank Card */}
                  <div className="relative w-full max-w-sm mx-auto mb-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Building size={100} />
                    </div>
                    <div className="relative z-10">
                      <p className="font-bold text-lg mb-8 tracking-wider">{formData.bankName || 'BANK NAME'}</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-gray-400 uppercase mb-1">Account Number</p>
                          <p className="font-mono text-xl tracking-widest">{formData.accountNumber ? formData.accountNumber.replace(/.(?=.{4})/g, '*') : '**** **** **** 1234'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Account Type</span>
                      <span className="font-semibold text-gray-800 dark:text-white capitalize">{formData.accountType || 'Not set'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">IFSC Code</span>
                      <span className="font-mono font-semibold text-gray-800 dark:text-white">{formData.ifscCode || 'Not set'}</span>
                    </div>
                    <div className="flex flex-col md:col-span-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Branch</span>
                      <span className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <MapPin size={14} className="text-indigo-500" />
                        {formData.branch || 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : (
        /* Empty State for Admin */
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            <Search size={40} className="text-gray-300 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Employee Selected</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm text-center mb-6">
            Use the search bar above to find an employee and view or edit their bank account details.
          </p>
        </div>
      )}
    </div>
  );
};

export default BankAccount;

