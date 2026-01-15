import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table } from '../components/UI';
import { UserPlus, Trash2, Key, RefreshCw, Search } from 'lucide-react';

const UserManagement = () => {
  const { allUsers, addUser, deleteUser, updateUser } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', email: '', employeeId: '', designation: '', department: '', role: 'employee', userId: '', password: ''
  });

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = () => {
    addUser({ ...formData, id: Date.now() });
    setShowAddModal(false);
    setFormData({ name: '', email: '', employeeId: '', designation: '', department: '', role: 'employee', userId: '', password: '' });
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(userId);
    }
  };

  const handleResetUserId = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.userId)) {
      alert('User ID must be a valid email address');
      return;
    }
    updateUser(selectedUser.id, { userId: formData.userId });
    setShowResetModal(false);
    setSelectedUser(null);
  };

  const handleResetPassword = () => {
    const alphanumericRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(formData.password)) {
      alert('Password must be alphanumeric (contain both letters and numbers)');
      return;
    }
    updateUser(selectedUser.id, { password: formData.password });
    setShowResetModal(false);
    setSelectedUser(null);
  };

  const openResetModal = (user, type) => {
    setSelectedUser({ ...user, resetType: type });
    setFormData({ ...formData, userId: user.userId || '', password: '' });
    setShowResetModal(true);
  };

  const columns = [
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Department', accessor: 'department' },
    { header: 'Role', render: (row) => <span className="capitalize">{row.role}</span> },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
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
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">User Management</h1>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} className="inline mr-2" />
            Add User
          </Button>
        </div>

        <Table columns={columns} data={filteredUsers} />
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
            <option value="hr">HR Manager</option>
            <option value="admin">Admin</option>
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
            {selectedUser?.resetType === 'userId' ? 'Enter new User ID (email format) for' : 'Enter new password for'} <strong>{selectedUser?.name}</strong>
          </p>
          {selectedUser?.resetType === 'userId' && (
            <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              Note: User ID must be official email address
            </p>
          )}
          {selectedUser?.resetType === 'password' && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
              Note: Password must be alphanumeric (contain both letters and numbers)
            </p>
          )}
          {selectedUser?.resetType === 'userId' ? (
            <input
              type="text"
              placeholder="New User ID"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          ) : (
            <input
              type="password"
              placeholder="New Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          )}
          <Button onClick={selectedUser?.resetType === 'userId' ? handleResetUserId : handleResetPassword} className="w-full">
            {selectedUser?.resetType === 'userId' ? 'Reset User ID' : 'Reset Password'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
