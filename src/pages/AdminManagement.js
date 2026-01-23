import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table, Badge, Alert } from '../components/UI';
import { Plus, Shield, Eye, EyeOff, Trash2, Key, UserCog, Users } from 'lucide-react';

const AdminManagement = () => {
  const { currentUser, allUsers, addUser, updateUser, deleteUser, forceUpdatePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('admins');
  const [showModal, setShowModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    role: 'admin',
    password: '',
    permissions: {
      viewAllEmployees: true,
      approveLeaves: true,
      manageAttendance: true,
      accessPayroll: true,
      ipManagement: false,
      createAdmin: false,
      deleteRecords: false,
      superAdmin: false
    }
  });

  const [promotePermissions, setPromotePermissions] = useState({
    viewAllEmployees: true,
    approveLeaves: true,
    manageAttendance: true,
    accessPayroll: false,
    ipManagement: false,
    createAdmin: false,
    deleteRecords: false,
    superAdmin: false
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  useEffect(() => {
    if (showModal) {
      generatePassword();
      const nextId = `ADM${String(allUsers.filter(u => u.role === 'admin' || u.role === 'Admin').length + 1).padStart(3, '0')}`;
      setFormData({ ...formData, employeeId: nextId, department: currentUser.department || 'Administration' });
    }
  }, [showModal]);

  const handlePermissionChange = (key, isPromote = false) => {
    if (isPromote) {
      const newPermissions = { ...promotePermissions, [key]: !promotePermissions[key] };
      if (key === 'superAdmin' && newPermissions.superAdmin) {
        Object.keys(newPermissions).forEach(k => newPermissions[k] = true);
      }
      setPromotePermissions(newPermissions);
    } else {
      const newPermissions = { ...formData.permissions, [key]: !formData.permissions[key] };
      if (key === 'superAdmin' && newPermissions.superAdmin) {
        Object.keys(newPermissions).forEach(k => newPermissions[k] = true);
      }
      setFormData({ ...formData, permissions: newPermissions });
    }
  };

  const handleCreateAdmin = async () => {
    if (!formData.name || !formData.email) {
      setAlert({ type: 'error', message: 'Please fill all required fields' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    setIsProcessing(true);
    try {
      const newAdmin = {
        ...formData,
        userId: formData.email,
        dateOfJoining: new Date().toISOString().split('T')[0],
        phone: '',
        address: '',
        designation: formData.permissions.superAdmin ? 'Super Admin' : 'Admin',
        reportingTo: currentUser.name,
        bloodGroup: '',
        emergencyContact: ''
      };

      const result = await addUser(newAdmin);

      if (result.success) {
        setAlert({ type: 'success', message: `Admin created successfully!\n\nLogin Email: ${formData.email}\nPassword: ${formData.password}\n\nPlease save these credentials.` });
        setShowModal(false);
        setFormData({
          name: '',
          email: '',
          employeeId: '',
          department: '',
          role: 'admin',
          password: '',
          permissions: {
            viewAllEmployees: true,
            approveLeaves: true,
            manageAttendance: true,
            accessPayroll: true,
            ipManagement: false,
            createAdmin: false,
            deleteRecords: false,
            superAdmin: false
          }
        });
      } else {
        setAlert({ type: 'error', message: result.message || 'Failed to create admin' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Error creating admin: ' + error.message });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setAlert(null), 8000);
    }
  };

  const handlePromoteEmployee = async () => {
    if (!selectedEmployee) return;

    if (!window.confirm(`Are you sure you want to promote ${selectedEmployee.name} to Admin role?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const updates = {
        role: 'admin',
        designation: promotePermissions.superAdmin ? 'Super Admin' : 'Admin',
        permissions: promotePermissions
      };

      const result = await updateUser(selectedEmployee.id, updates);

      if (result.success) {
        setAlert({ type: 'success', message: `${selectedEmployee.name} has been promoted to Admin successfully!` });
        setShowPromoteModal(false);
        setSelectedEmployee(null);
        setPromotePermissions({
          viewAllEmployees: true,
          approveLeaves: true,
          manageAttendance: true,
          accessPayroll: false,
          ipManagement: false,
          createAdmin: false,
          deleteRecords: false,
          superAdmin: false
        });
      } else {
        setAlert({ type: 'error', message: result.message || 'Failed to promote employee' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Error promoting employee: ' + error.message });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setAlert(null), 5000);
    }
  };

  const handleDeleteAdmin = async (userId) => {
    const admin = allUsers.find(u => u.id === userId);
    if (window.confirm(`Are you sure you want to delete admin: ${admin?.name}?`)) {
      const result = await deleteUser(userId);
      if (result.success) {
        setAlert({ type: 'success', message: 'Admin deleted successfully' });
      } else {
        setAlert({ type: 'error', message: result.message || 'Failed to delete admin' });
      }
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const admins = allUsers.filter(u => u.role === 'Admin' || u.role === 'admin' || u.role === 'super_admin');
  const employees = allUsers.filter(u => u.role === 'employee');

  const adminColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Department', accessor: 'department' },
    {
      header: 'Role',
      render: (row) => (
        <Badge variant={row.designation === 'Super Admin' ? 'success' : 'primary'}>
          {row.designation || 'Admin'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedAdmin(row);
              setShowPasswordModal(true);
            }}
            variant="secondary"
            className="text-xs py-1 px-2"
          >
            <Key size={14} className="inline mr-1" />Password
          </Button>
          <Button
            onClick={() => handleDeleteAdmin(row.id)}
            variant="danger"
            className="text-xs py-1 px-2"
            disabled={row.id === currentUser.id}
          >
            <Trash2 size={14} className="inline mr-1" />Delete
          </Button>
        </div>
      )
    }
  ];

  const employeeColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    {
      header: 'Action',
      render: (row) => (
        <Button
          onClick={() => {
            setSelectedEmployee(row);
            setShowPromoteModal(true);
          }}
          variant="primary"
          className="text-xs py-1 px-3"
        >
          <UserCog size={14} className="inline mr-1" />Promote to Admin
        </Button>
      )
    }
  ];

  if (currentUser.role !== 'Admin' && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Access denied. Admin only.</div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Management</h1>
        <Button onClick={() => setShowModal(true)} variant="primary">
          <Plus size={16} className="inline mr-2" />Create New Admin
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Admins</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{admins.length}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Super Admins</h3>
          <p className="text-3xl font-bold text-green-600">{admins.filter(a => a.designation === 'Super Admin').length}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Regular Admins</h3>
          <p className="text-3xl font-bold text-blue-600">{admins.filter(a => a.designation !== 'Super Admin').length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'admins'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <Shield size={16} className="inline mr-2" />
            Admin Users ({admins.length})
          </button>
          <button
            onClick={() => setActiveTab('promote')}
            className={`px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'promote'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <Users size={16} className="inline mr-2" />
            Promote Employee ({employees.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'admins' ? (
        <Card title="Admin Users">
          <Table columns={adminColumns} data={admins} />
        </Card>
      ) : (
        <Card title="Employees Available for Promotion">
          <Table columns={employeeColumns} data={employees} />
        </Card>
      )}

      {/* Create Admin Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Admin Account" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="john.doe@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</label>
              <input
                type="text"
                value={formData.employeeId}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Shield size={16} className="inline mr-1" />Permissions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {Object.entries({
                viewAllEmployees: 'View All Employee Data',
                approveLeaves: 'Approve Leaves (All Departments)',
                manageAttendance: 'Manage Attendance Rules',
                accessPayroll: 'Access Payroll & Salary Slips',
                ipManagement: 'IP Whitelist Management',
                createAdmin: 'Create Other Admins',
                deleteRecords: 'Delete Employee Records',
                superAdmin: 'Super Admin (All Permissions)'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions[key]}
                    onChange={() => handlePermissionChange(key)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auto-Generated Password</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  readOnly
                  className="w-full px-3 py-2 pr-10 border rounded-lg bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <Button onClick={generatePassword} variant="secondary">Regenerate</Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">User must change password on first login</p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={() => setShowModal(false)} variant="secondary" disabled={isProcessing}>Cancel</Button>
            <Button onClick={handleCreateAdmin} variant="primary" disabled={isProcessing}>
              <Shield size={16} className="inline mr-2" />{isProcessing ? 'Creating...' : 'Create Admin'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Promote Employee Modal */}
      <Modal isOpen={showPromoteModal} onClose={() => setShowPromoteModal(false)} title="Promote Employee to Admin" size="lg">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Employee:</strong> {selectedEmployee?.name} ({selectedEmployee?.employeeId})
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Current Role:</strong> {selectedEmployee?.designation || 'Employee'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Shield size={16} className="inline mr-1" />Admin Permissions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {Object.entries({
                viewAllEmployees: 'View All Employee Data',
                approveLeaves: 'Approve Leaves (All Departments)',
                manageAttendance: 'Manage Attendance Rules',
                accessPayroll: 'Access Payroll & Salary Slips',
                ipManagement: 'IP Whitelist Management',
                createAdmin: 'Create Other Admins',
                deleteRecords: 'Delete Employee Records',
                superAdmin: 'Super Admin (All Permissions)'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promotePermissions[key]}
                    onChange={() => handlePermissionChange(key, true)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={() => setShowPromoteModal(false)} variant="secondary" disabled={isProcessing}>Cancel</Button>
            <Button onClick={handlePromoteEmployee} variant="primary" disabled={isProcessing}>
              <UserCog size={16} className="inline mr-2" />{isProcessing ? 'Promoting...' : 'Promote to Admin'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Password Change Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => {
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }} title="Change Admin Password">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Change password for <strong>{selectedAdmin?.name}</strong>
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            Enter the admin's current password and a new password to update it immediately.
          </p>
          <input
            type="password"
            placeholder="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="password"
            placeholder="New Password (min 6 characters)"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button onClick={() => {
              setShowPasswordModal(false);
              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }} variant="secondary">Cancel</Button>
            <Button onClick={async () => {
              if (passwordData.newPassword !== passwordData.confirmPassword) {
                setAlert({ type: 'error', message: 'New passwords do not match' });
                setTimeout(() => setAlert(null), 3000);
                return;
              }
              if (passwordData.newPassword.length < 6) {
                setAlert({ type: 'error', message: 'Password must be at least 6 characters' });
                setTimeout(() => setAlert(null), 3000);
                return;
              }
              const result = await forceUpdatePassword(selectedAdmin.email, passwordData.currentPassword, passwordData.newPassword);
              setAlert({ type: result.success ? 'success' : 'error', message: result.message });
              if (result.success) {
                setShowPasswordModal(false);
                setSelectedAdmin(null);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }
              setTimeout(() => setAlert(null), 3000);
            }} variant="primary">
              <Key size={16} className="inline mr-2" />Change Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminManagement;
