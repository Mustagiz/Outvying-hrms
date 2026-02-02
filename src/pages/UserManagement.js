import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table, Alert, Pagination } from '../components/UI';
import { UserPlus, Trash2, Key, RefreshCw, Search, Shield, FileSpreadsheet, Upload, Download } from 'lucide-react';
import { logAuditAction } from '../utils/auditLogger';
import { exportToCSV } from '../utils/helpers';

import Papa from 'papaparse';



const UserManagement = () => {
  const { currentUser, allUsers, addUser, deleteUser, updateUser, resetPassword, forceUpdatePassword, updateUserId, repairAdminProfile } = useAuth();
  const [alert, setAlert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', employeeId: '', designation: '', department: '', role: 'employee', userId: '', password: '', newPassword: '', reportingTo: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredUsers = allUsers.filter(u =>
    (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleAddUser = async () => {
    try {
      // Basic Validation & Auto-complete
      let emailToUse = (formData.email || formData.userId || '').trim();

      // If no @ is present, assume it's a username and append @outvying.com
      if (emailToUse && !emailToUse.includes('@')) {
        emailToUse = `${emailToUse}@outvying.com`;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailToUse || !emailRegex.test(emailToUse)) {
        setAlert({ type: 'error', message: 'A valid email address is required. Tip: Type a username and we will auto-add @outvying.com' });
        return;
      }

      if (!formData.password) {
        setAlert({ type: 'error', message: 'Password is required' });
        return;
      }

      // Pre-check if user already exists in the local state
      const existingUser = allUsers.find(u => (u.email || '').toLowerCase() === emailToUse.toLowerCase());
      if (existingUser) {
        setAlert({ type: 'error', message: 'A user with this email already exists in the system.' });
        return;
      }

      // Ensure email is populated for Auth
      const finalData = {
        ...formData,
        email: emailToUse,
        userId: emailToUse
      };

      const result = await addUser(finalData);
      setAlert({ type: result.success ? 'success' : 'error', message: result.message });
      if (result.success) {
        // Log the action
        await logAuditAction({
          action: 'CREATE_EMPLOYEE',
          category: 'EMPLOYEE',
          performedBy: currentUser,
          targetId: finalData.employeeId,
          targetName: finalData.name,
          details: { email: finalData.email, role: finalData.role, designation: finalData.designation }
        });

        setShowAddModal(false);
        setFormData({ name: '', email: '', employeeId: '', designation: '', department: '', role: 'employee', userId: '', password: '', reportingTo: '' });
      }
    } catch (error) {
      console.error("Add User Error:", error);
      setAlert({ type: 'error', message: 'An unexpected error occurred: ' + error.message });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const targetUser = allUsers.find(u => u.id === userId);
      const result = await deleteUser(userId);
      setAlert({ type: result.success ? 'success' : 'error', message: result.message });

      if (result.success && targetUser) {
        await logAuditAction({
          action: 'DELETE_EMPLOYEE',
          category: 'EMPLOYEE',
          performedBy: currentUser,
          targetId: targetUser.employeeId || userId,
          targetName: targetUser.name,
          details: { email: targetUser.email }
        });
      }
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleResetUserId = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.userId)) {
      setAlert({ type: 'error', message: 'User ID must be a valid email address' });
      return;
    }

    if (!formData.password) {
      setAlert({ type: 'error', message: 'Current password is required to update email' });
      return;
    }

    const result = await updateUserId(selectedUser.email, formData.password, formData.userId);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });

    if (result.success) {
      await logAuditAction({
        action: 'UPDATE_USER_ID',
        category: 'EMPLOYEE',
        performedBy: currentUser,
        targetId: selectedUser.employeeId || selectedUser.id,
        targetName: selectedUser.name,
        details: { oldEmail: selectedUser.email, newEmail: formData.userId }
      });
      setShowResetModal(false);
      setSelectedUser(null);
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleRepairPermissions = async () => {
    if (window.confirm('This will attempt to restore your Admin permissions in the database. Continue?')) {
      const result = await repairAdminProfile();
      setAlert({ type: result.success ? 'success' : 'error', message: result.message });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleResetPassword = async () => {
    const result = await resetPassword(selectedUser.email);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });

    if (result.success) {
      await logAuditAction({
        action: 'RESET_PASSWORD_EMAIL',
        category: 'EMPLOYEE',
        performedBy: currentUser,
        targetId: selectedUser.employeeId || selectedUser.id,
        targetName: selectedUser.name,
        details: { email: selectedUser.email }
      });
      setShowResetModal(false);
      setSelectedUser(null);
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleManualPasswordReset = async () => {
    if (!formData.newPassword) {
      setAlert({ type: 'error', message: 'New password is required.' });
      return;
    }

    const result = await forceUpdatePassword(selectedUser.uid || selectedUser.id, formData.newPassword);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });

    if (result.success) {
      await logAuditAction({
        action: 'RESET_PASSWORD_MANUAL',
        category: 'EMPLOYEE',
        performedBy: currentUser,
        targetId: selectedUser.employeeId || selectedUser.id,
        targetName: selectedUser.name,
        details: { email: selectedUser.email }
      });
      setShowResetModal(false);
      setSelectedUser(null);
      setFormData({ ...formData, password: '', newPassword: '' });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleUpdateRole = async () => {
    if (!formData.role) {
      setAlert({ type: 'error', message: 'Please select a role' });
      return;
    }

    const result = await updateUser(selectedUser.id, { role: formData.role });
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });

    if (result.success) {
      await logAuditAction({
        action: 'UPDATE_ROLE',
        category: 'EMPLOYEE',
        performedBy: currentUser,
        targetId: selectedUser.employeeId || selectedUser.id,
        targetName: selectedUser.name,
        details: { oldRole: selectedUser.role, newRole: formData.role }
      });
      setShowRoleModal(false);
      setSelectedUser(null);
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleBulkImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const employees = results.data;
        let successCount = 0;
        let errorCount = 0;

        setAlert({ type: 'info', message: `Processing ${employees.length} employees...` });

        for (const emp of employees) {
          try {
            // Basic map from CSV headers to our schema (case-insensitive)
            const mappedData = {
              name: emp.Name || emp.name,
              email: emp.Email || emp.email,
              employeeId: emp.EmployeeID || emp.employeeId || emp.ID || emp.id,
              designation: emp.Designation || emp.designation,
              department: emp.Department || emp.department,
              role: (emp.Role || emp.role || 'employee').toLowerCase(),
              password: emp.Password || emp.password || 'Welcome@123',
              userId: emp.Email || emp.email
            };

            if (!mappedData.email || !mappedData.name) {
              errorCount++;
              continue;
            }

            const result = await addUser(mappedData);
            if (result.success) {
              successCount++;
              logAuditAction({
                action: 'BULK_IMPORT',
                category: 'EMPLOYEE',
                performedBy: currentUser,
                targetId: mappedData.employeeId,
                targetName: mappedData.name,
                details: { method: 'CSV_IMPORT' }
              });
            } else {
              errorCount++;
            }
          } catch (err) {
            errorCount++;
          }
        }

        setAlert({
          type: errorCount === 0 ? 'success' : 'warning',
          message: `Import Complete: ${successCount} successful, ${errorCount} failed.`
        });
        setTimeout(() => setAlert(null), 5000);
      }
    });
  };

  const openResetModal = (user, type) => {
    setSelectedUser({ ...user, resetType: type });
    setFormData({ ...formData, userId: user.userId || '', password: '', newPassword: '' });
    setShowResetModal(true);
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setFormData({ ...formData, role: user.role });
    setShowRoleModal(true);
  };

  const columns = [
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Department', accessor: 'department' },
    { header: 'Role', render: (row) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{row.role}</span> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button onClick={() => openRoleModal(row)} variant="secondary" className="text-xs py-1 px-2 border-primary-200 text-primary-600">
            <Shield size={14} className="inline mr-1" /> Role
          </Button>
          <Button onClick={() => openResetModal(row, 'userId')} variant="secondary" className="text-xs py-1 px-2">
            <RefreshCw size={14} className="inline mr-1" /> User ID
          </Button>
          <Button onClick={() => openResetModal(row, 'password')} variant="secondary" className="text-xs py-1 px-2">
            <Key size={14} className="inline mr-1" /> Password
          </Button>
          <Button onClick={() => handleDeleteUser(row.id)} variant="danger" className="text-xs py-1 px-2">
            <Trash2 size={14} className="inline mr-1" /> Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">

      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-[0.2em] mb-1">
            <Shield size={14} /> Access Control Center
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">User <span className="text-primary-600">Management</span></h1>
          <p className="text-gray-400 text-sm mt-1">Provision accounts, manage permissions, and oversee system security.</p>
        </div>

        <div className="flex gap-3">
          <input
            type="file"
            id="csv-import"
            className="hidden"
            accept=".csv"
            onChange={handleBulkImport}
          />
          <Button
            onClick={() => {
              const csvData = allUsers.map(u => ({
                'Employee ID': u.employeeId,
                'Name': u.name,
                'Email': u.email,
                'Role': u.role,
                'Designation': u.designation,
                'Department': u.department
              }));
              exportToCSV(csvData, 'system_users_report');
            }}
            variant="secondary"
            className="bg-white hover:shadow-md transition-all"
          >
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
          <Button
            onClick={() => document.getElementById('csv-import').click()}
            variant="secondary"
            className="bg-white hover:shadow-md transition-all"
          >
            <FileSpreadsheet size={16} className="mr-2" /> Bulk Import
          </Button>

          <Button onClick={handleRepairPermissions} variant="secondary" className="bg-white hover:shadow-md transition-all">
            <Shield size={16} className="mr-2" /> Repair My Access
          </Button>
          <Button onClick={() => setShowAddModal(true)} variant="primary" className="shadow-lg shadow-primary-500/20">
            <UserPlus size={16} className="mr-2" /> New Operator
          </Button>
        </div>

      </div>

      {alert && <div className="mb-6"><Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} /></div>}

      <Card className="border-none shadow-xl shadow-gray-200/50">
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              placeholder="Find operators by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-transparent focus:border-primary-200 focus:bg-white rounded-2xl outline-none transition-all"
            />
          </div>
        </div>

        <Table columns={columns} data={paginatedUsers} />

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-[10px] text-gray-500 mt-1 ml-1 italic">
            Tip: You can use a username and we will auto-add @outvying.com
          </p>
          <input
            type="text"
            placeholder="Employee ID"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Designation"
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Department"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="hr">HR Manager</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            value={formData.reportingTo}
            onChange={(e) => setFormData({ ...formData, reportingTo: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select Reporting Manager (Optional)</option>
            {[...allUsers]
              .filter(u => u && u.name)
              .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
              .map(u => (
                <option key={u.id || u.uid} value={u.name}>{u.name} ({u.role || u.designation})</option>
              ))}
          </select>
          <input
            type="text"
            placeholder="User ID"
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <Button onClick={handleAddUser} className="w-full">Add User</Button>
        </div>
      </Modal>

      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} title={selectedUser?.resetType === 'userId' ? 'Reset User ID' : 'Reset Password'}>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {selectedUser?.resetType === 'userId'
              ? `Update User ID (email) for ${selectedUser?.name}`
              : `Send password reset email to ${selectedUser?.name}?`}
          </p>

          {selectedUser?.resetType === 'userId' ? (
            <>
              <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                Note: Updating the User ID requires the user's current password for security.
              </p>
              <input
                type="text"
                placeholder="New User ID (Email)"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="password"
                placeholder="Current Password of User"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <Button onClick={handleResetUserId} className="w-full">
                Update User ID
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                Type a new password for <strong>{selectedUser?.name}</strong>. Admins can override passwords without the old one.
              </p>

              <div className="space-y-4 pt-2 border-t dark:border-gray-700">
                <input
                  type="password"
                  placeholder="NEW Password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-primary-300 dark:border-primary-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-bold"
                />
                <Button onClick={handleManualPasswordReset} className="w-full bg-primary-600">
                  Update Password Immediately
                </Button>
              </div>

              <div className="pt-4 space-y-2 border-t dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 uppercase">Backup Option: Email Reset Link</p>
                <Button onClick={handleResetPassword} variant="secondary" className="w-full">
                  Send Reset Link to {selectedUser?.email}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title="Update User Role">
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center text-primary-600">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 uppercase font-bold tracking-wider">Current User</p>
              <h3 className="font-bold text-gray-900 dark:text-white">{selectedUser?.name}</h3>
              <p className="text-xs text-gray-400">{selectedUser?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase px-1">Select New Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="hr">HR Manager</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800 flex gap-3">
            <Shield size={20} className="text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-relaxed">
              <strong>Warning:</strong> Changing a user's role affects their system permissions immediately. Ensure you have properly authorized this change.
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => setShowRoleModal(false)} variant="secondary" className="flex-1 rounded-xl">Cancel</Button>
            <Button onClick={handleUpdateRole} variant="primary" className="flex-1 rounded-xl shadow-lg shadow-primary-500/20">Update Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
