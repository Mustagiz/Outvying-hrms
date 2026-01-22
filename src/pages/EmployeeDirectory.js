import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Table, Input, Select, Modal, Button } from '../components/UI';
import { departments } from '../data/mockData';
import { filterData } from '../utils/helpers';
import { Mail, Phone, MapPin, Briefcase, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';

const EmployeeDirectory = () => {
  const { allUsers, currentUser, updateUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const employees = allUsers.filter(u => u.role === 'employee' || u.role === 'hr');

  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(e => e.department === selectedDepartment);
    }

    if (searchTerm) {
      filtered = filterData(filtered, searchTerm, ['name', 'employeeId', 'designation', 'email']);
    }

    return filtered;
  }, [employees, searchTerm, selectedDepartment]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return {
      data: filteredEmployees.slice(startIndex, startIndex + itemsPerPage),
      totalPages: Math.ceil(filteredEmployees.length / itemsPerPage),
      totalItems: filteredEmployees.length
    };
  }, [filteredEmployees, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDepartment]);

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...departments.map(d => ({ value: d, label: d }))
  ];

  const columns = [
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    {
      header: 'Status',
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      )
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedEmployee(row);
              setEditForm(row);
              setIsEditing(false);
              setShowModal(true);
            }}
            variant="secondary"
            className="text-xs py-1 px-3"
          >
            View Details
          </Button>
          {(currentUser.role === 'Admin' || currentUser.role === 'admin') && (
            <Button
              onClick={() => {
                setSelectedEmployee(row);
                setEditForm(row);
                setIsEditing(true);
                setShowModal(true);
              }}
              variant="primary"
              className="text-xs py-1 px-3"
            >
              <Edit2 size={14} className="inline mr-1" />Edit
            </Button>
          )}
        </div>
      )
    }
  ];

  const departmentGroups = useMemo(() => {
    const groups = {};
    employees.forEach(emp => {
      if (!groups[emp.department]) {
        groups[emp.department] = [];
      }
      groups[emp.department].push(emp);
    });
    return groups;
  }, [employees]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Employee Directory</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Employees</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{employees.length}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Departments</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{Object.keys(departmentGroups).length}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Engineering</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            {departmentGroups['Engineering']?.length || 0}
          </p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">HR Team</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">
            {departmentGroups['Human Resources']?.length || 0}
          </p>
        </Card>
      </div>

      <Card title="Employee List">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name, ID, designation, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            options={departmentOptions}
          />
        </div>

        <Table columns={columns} data={paginatedEmployees.data} />

        {paginatedEmployees.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, paginatedEmployees.totalItems)} of {paginatedEmployees.totalItems} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2"
              >
                <ChevronLeft size={20} />
              </Button>
              <div className="flex items-center gap-1">
                {[...Array(paginatedEmployees.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button
                variant="secondary"
                onClick={() => setCurrentPage(prev => Math.min(paginatedEmployees.totalPages, prev + 1))}
                disabled={currentPage === paginatedEmployees.totalPages}
                className="p-2"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <Card title="Department-wise Distribution">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(departmentGroups).map(([dept, emps]) => (
              <div key={dept} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{dept}</h4>
                <p className="text-2xl font-bold text-primary-600">{emps.length}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">employees</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setIsEditing(false); }} title={isEditing ? 'Edit Employee' : 'Employee Details'} size="lg">
        {selectedEmployee && (
          <div className="space-y-6">
            {!isEditing ? (
              <>
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedEmployee.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedEmployee.designation}</p>
                    <p className="text-sm text-gray-500">{selectedEmployee.employeeId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Mail className="text-gray-400 mt-1" size={18} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-sm text-gray-800 dark:text-white">{selectedEmployee.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Phone className="text-gray-400 mt-1" size={18} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-sm text-gray-800 dark:text-white">{selectedEmployee.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Briefcase className="text-gray-400 mt-1" size={18} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Department</p>
                        <p className="text-sm text-gray-800 dark:text-white">{selectedEmployee.department}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="text-gray-400 mt-1" size={18} />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                        <p className="text-sm text-gray-800 dark:text-white">{selectedEmployee.address}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date of Joining</p>
                      <p className="text-sm text-gray-800 dark:text-white">{selectedEmployee.dateOfJoining}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Reporting To</p>
                      <p className="text-sm text-gray-800 dark:text-white">{selectedEmployee.reportingTo}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Blood Group</p>
                      <p className="text-sm text-gray-800 dark:text-white">{selectedEmployee.bloodGroup}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Emergency Contact</p>
                  <p className="text-sm text-gray-800 dark:text-white">{selectedEmployee.emergencyContact}</p>
                </div>

                {(currentUser.role === 'Admin' || currentUser.role === 'admin') && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => setIsEditing(true)} variant="primary">
                      <Edit2 size={16} className="inline mr-2" />Edit Employee
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      type="text"
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation</label>
                    <input
                      type="text"
                      value={editForm.designation || ''}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                    <select
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</label>
                    <input
                      type="text"
                      value={editForm.bloodGroup || ''}
                      onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reporting To</label>
                    <input
                      type="text"
                      value={editForm.reportingTo || ''}
                      onChange={(e) => setEditForm({ ...editForm, reportingTo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={editForm.emergencyContact || ''}
                      onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button onClick={() => setIsEditing(false)} variant="secondary">Cancel</Button>
                  <Button
                    onClick={() => {
                      updateUser(selectedEmployee.id, editForm);
                      setSelectedEmployee(editForm);
                      setIsEditing(false);
                      alert('Employee information updated successfully');
                    }}
                    variant="primary"
                  >
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployeeDirectory;
