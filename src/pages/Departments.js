import React, { useState } from 'react';
import { Card, Button, Modal, Table } from '../components/UI';
import { Plus, Edit, Trash2 } from 'lucide-react';

const Departments = () => {
  const [departments, setDepartments] = useState(() => {
    const saved = localStorage.getItem('departments');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Engineering', headCount: 0, manager: 'TBD' },
      { id: 2, name: 'Sales', headCount: 0, manager: 'TBD' },
      { id: 3, name: 'Marketing', headCount: 0, manager: 'TBD' },
      { id: 4, name: 'HR', headCount: 0, manager: 'TBD' },
      { id: 5, name: 'Finance', headCount: 0, manager: 'TBD' }
    ];
  });

  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', headCount: '', manager: '' });

  const saveDepartments = (depts) => {
    setDepartments(depts);
    localStorage.setItem('departments', JSON.stringify(depts));
  };

  const handleSubmit = () => {
    if (editingDept) {
      const updated = departments.map(d => d.id === editingDept.id ? { ...d, ...formData } : d);
      saveDepartments(updated);
    } else {
      const newDept = { id: Date.now(), ...formData, headCount: parseInt(formData.headCount) };
      saveDepartments([...departments, newDept]);
    }
    setShowModal(false);
    setEditingDept(null);
    setFormData({ name: '', headCount: '', manager: '' });
  };

  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormData({ name: dept.name, headCount: dept.headCount, manager: dept.manager });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      saveDepartments(departments.filter(d => d.id !== id));
    }
  };

  const openAddModal = () => {
    setEditingDept(null);
    setFormData({ name: '', headCount: '', manager: '' });
    setShowModal(true);
  };

  const columns = [
    { header: 'Department Name', accessor: 'name' },
    { header: 'Head Count', accessor: 'headCount' },
    { header: 'Manager', accessor: 'manager' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button onClick={() => handleEdit(row)} variant="secondary" className="text-xs py-1 px-2">
            <Edit size={14} className="inline mr-1" /> Edit
          </Button>
          <Button onClick={() => handleDelete(row.id)} variant="danger" className="text-xs py-1 px-2">
            <Trash2 size={14} className="inline mr-1" /> Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Departments</h1>
        <Button onClick={openAddModal}>
          <Plus size={18} className="inline mr-2" />
          Add Department
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={departments} />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDept ? 'Edit Department' : 'Add Department'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter department name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Head Count</label>
            <input
              type="number"
              value={formData.headCount}
              onChange={(e) => setFormData({ ...formData, headCount: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter head count"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Manager</label>
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter manager name"
            />
          </div>
          <Button onClick={handleSubmit} className="w-full">
            {editingDept ? 'Update Department' : 'Add Department'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Departments;
