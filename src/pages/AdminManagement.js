import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table, Badge } from '../components/UI';
import { Plus, Shield, Eye, EyeOff, Trash2, UserX } from 'lucide-react';

const AdminManagement = () => {
  const { currentUser, allUsers, addUser, deleteUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    employeeId: '',
    department: '',
    role: 'Admin',
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
      const nextId = `EMP${String(allUsers.length + 1).padStart(3, '0')}`;
      setFormData({ ...formData, employeeId: nextId, department: currentUser.department });
    }
  }, [showModal]);

  const handlePermissionChange = (key) => {
    const newPermissions = { ...formData.permissions, [key]: !formData.permissions[key] };
    if (key === 'superAdmin' && newPermissions.superAdmin) {
      Object.keys(newPermissions).forEach(k => newPermissions[k] = true);
    }
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handleCreateAdmin = () => {
    if (!formData.name || !formData.email) {
      alert('Please fill all required fields');
      return;
    }

    const newAdmin = {
      ...formData,
      id: allUsers.length + 1,
      userId: formData.email,
      dateOfJoining: new Date().toISOString().split('T')[0],
      phone: '',
      address: '',
      designation: formData.permissions.superAdmin ? 'Super Admin' : 'Admin',
      reportingTo: currentUser.name,
      bloodGroup: '',
      emergencyContact: ''
    };

    addUser(newAdmin);
    
    const auditLog = JSON.parse(localStorage.getItem('adminAuditLog') || '[]');
    auditLog.push({
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action: 'Created Admin',
      target: formData.name,
      details: `Permissions: ${Object.keys(formData.permissions).filter(k => formData.permissions[k]).join(', ')}`
    });
    localStorage.setItem('adminAuditLog', JSON.stringify(auditLog));

    alert(`Admin ${formData.name} created successfully!\n\nLogin Email: ${formData.email}\nPassword: ${formData.password}\n\nPlease save these credentials securely.`);
    window.location.reload();
  };

  const handleDeleteAdmin = (userId) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      deleteUser(userId);
      const auditLog = JSON.parse(localStorage.getItem('adminAuditLog') || '[]');
      auditLog.push({
        timestamp: new Date().toISOString(),
        actor: currentUser.name,
        actorRole: currentUser.role,
        action: 'Deleted Admin',
        target: allUsers.find(u => u.id === userId)?.name,
        details: 'Admin account removed'
      });
      localStorage.setItem('adminAuditLog', JSON.stringify(auditLog));
    }
  };

  const admins = allUsers.filter(u => u.role === 'Admin' || u.role === 'admin');

  const columns = [
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
        <Button 
          onClick={() => handleDeleteAdmin(row.id)} 
          variant="danger" 
          className="text-xs py-1 px-2"
          disabled={row.id === currentUser.id}
        >
          <Trash2 size={14} className="inline mr-1" />Delete
        </Button>
      )
    }
  ];

  if (currentUser.role !== 'Admin' && currentUser.role !== 'admin') {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Access denied. Admin only.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Management</h1>
        <Button onClick={() => setShowModal(true)} variant="primary">
          <Plus size={16} className="inline mr-2" />Create New Admin
        </Button>
      </div>

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

      <Card title="Admin Users">
        <Table columns={columns} data={admins} />
      </Card>

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
            <Button onClick={() => setShowModal(false)} variant="secondary">Cancel</Button>
            <Button onClick={handleCreateAdmin} variant="primary">
              <Shield size={16} className="inline mr-2" />Create Admin
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminManagement;
