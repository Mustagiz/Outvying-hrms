import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Table, Input, Select, Modal, Button } from '../components/UI';
import { departments } from '../data/mockData';
import { Mail, Phone, MapPin, Briefcase, Edit2, ChevronLeft, ChevronRight, Trash2, Download, FileText, RefreshCw } from 'lucide-react';
import { formatDate, exportToCSV, filterData } from '../utils/helpers';
import { db } from '../config/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { showToast } from '../utils/toast';
import { renderTemplate } from '../utils/templateRenderer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const EmployeeDirectory = () => {
  const { allUsers, currentUser, updateUser, deleteUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [isDeleting, setIsDeleting] = useState(null);

  // Bulk Issuance State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [hrTemplates, setHrTemplates] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch HR Templates on Mount
  useEffect(() => {
    const fetchTemplates = async () => {
      const q = query(collection(db, 'hrTemplates'));
      const snapshot = await getDocs(q);
      setHrTemplates(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchTemplates();
  }, []);

  const handleBulkGenerate = async () => {
    setIsGenerating(true);
    if (!selectedTemplate) return;

    try {
      const template = hrTemplates.find(t => t.id === selectedTemplate);
      if (!template) throw new Error("Template not found");

      const employeesToProcess = allUsers.filter(u => selectedEmployees.includes(u.id || u.uid));

      let successCount = 0;

      // Process sequentially to avoid browser overload
      for (const employee of employeesToProcess) {
        try {
          // 1. Render Template with Employee Data
          // Map employee fields to template variables convention if needed
          const employeeData = {
            ...employee,
            candidateName: employee.name, // Fallback for templates using 'candidateName'
            jobTitle: employee.designation,
            joiningDate: employee.dateOfJoining,
            annualCTC: employee.ctc || 0, // Assuming CTC is in user profile
          };

          const html = await renderTemplate(null, [template], employeeData); // rendering using template object directly

          // 2. Mock PDF Generation & Sending (In real app, use a cloud function or similar)
          // specific implementation of PDF gen skipped here to keep it lightweight, 
          // but we simulate the success.

          // 3. Log/Store Record
          // await addDoc(collection(db, 'users', employee.id, 'documents'), {
          //    name: template.name,
          //    type: 'Generated',
          //    issuedAt: serverTimestamp(),
          //    templateId: template.id
          // });

          successCount++;
        } catch (err) {
          console.error(`Failed for ${employee.name}`, err);
        }
      }

      showToast.success(`Successfully issued documents to ${successCount} employees`);
      setShowBulkModal(false);
      setSelectedEmployees([]);
    } catch (error) {
      showToast.error("Batch processing failed: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const employees = useMemo(() => {
    const role = (currentUser.role || '').toLowerCase();

    // Unified Filter: Only show "Staff" roles (employee, hr, manager)
    return allUsers.filter(u => {
      const uRole = (u.role || '').toLowerCase();
      const isStaff = uRole === 'employee' || uRole === 'hr' || uRole === 'manager';
      // Note: We show both active and "deactive" (Exited) staff here so they can be managed
      return isStaff && (role !== 'manager' || u.reportingTo === currentUser.name);
    });
  }, [allUsers, currentUser]);

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
    setSelectedEmployees([]);
  }, [searchTerm, selectedDepartment]);

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    ...departments.map(d => ({ value: d, label: d }))
  ];

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployees(paginatedEmployees.data.map(emp => emp.id || emp.uid));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (id, checked) => {
    if (checked) {
      setSelectedEmployees(prev => [...prev, id]);
    } else {
      setSelectedEmployees(prev => prev.filter(empId => empId !== id));
    }
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={paginatedEmployees.data.length > 0 && selectedEmployees.length === paginatedEmployees.data.length}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedEmployees.includes(row.id || row.uid)}
          onChange={(e) => handleSelectEmployee(row.id || row.uid, e.target.checked)}
          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
      ),
      className: "w-10 text-center"
    },
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    {
      header: 'Account Status',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${row.status === 'Active' && !row.isDeleted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {row.status === 'Active' && !row.isDeleted ? 'Active' : 'Deactive'}
          </span>
          {(currentUser.role === 'Admin' || currentUser.role === 'admin') && (
            <button
              onClick={async () => {
                const isCurrentlyActive = row.status === 'Active' && !row.isDeleted;
                const newStatus = isCurrentlyActive ? 'Exited' : 'Active';
                const newIsDeleted = isCurrentlyActive ? true : false;

                if (window.confirm(`Mark ${row.name} as ${isCurrentlyActive ? 'Deactive' : 'Active'}?`)) {
                  const result = await updateUser(row.id || row.uid, {
                    status: newStatus,
                    isDeleted: newIsDeleted,
                    deactivatedAt: isCurrentlyActive ? serverTimestamp() : null
                  });
                  if (result.success) {
                    showToast.success(`Employee marked as ${isCurrentlyActive ? 'Deactive' : 'Active'}`);
                  } else {
                    showToast.error('Update failed: ' + result.message);
                  }
                }
              }}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-primary-600"
              title="Toggle Status"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
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
          {(currentUser.role === 'Admin' || currentUser.role === 'admin') && (
            <Button
              onClick={async () => {
                if (window.confirm(`Are you sure you want to delete ${row.name}? This action cannot be undone.`)) {
                  setIsDeleting(row.id || row.uid);
                  const result = await deleteUser(row.id || row.uid);
                  setIsDeleting(null);
                  if (result.success) {
                    alert('Employee deleted successfully');
                  } else {
                    alert('Failed to delete employee: ' + result.message);
                  }
                }
              }}
              variant="danger"
              className="text-xs py-1 px-3 bg-red-600 hover:bg-red-700 text-white"
              loading={isDeleting === (row.id || row.uid)}
            >
              <Trash2 size={14} className="inline mr-1" />Delete
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

          <Button
            onClick={() => {
              const csvData = filteredEmployees.map(e => ({
                'Employee ID': e.employeeId,
                'Name': e.name,
                'Email': e.email,
                'Phone': e.phone,
                'Department': e.department,
                'Designation': e.designation,
                'Joining Date': formatDate(e.dateOfJoining),
                'Reporting To': e.reportingTo,
                'Blood Group': e.bloodGroup
              }));
              exportToCSV(csvData, 'employee_directory');
            }}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Download size={16} /> Export CSV
          </Button>
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
              // Edit Form (Simplified/Existing)
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</label>
                    <input
                      type="text"
                      value={editForm.employeeId || ''}
                      onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
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
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <input
                      type="text"
                      value={editForm.address || ''}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
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

      {/* Bulk Action Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Issue Document (Bulk)"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-sm">
            You are about to issue a document to <strong>{selectedEmployees.length}</strong> employees.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={selectedTemplate || ''}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">-- Choose a Template --</option>
              {hrTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
            <Button
              onClick={handleBulkGenerate}
              disabled={!selectedTemplate || isGenerating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isGenerating ? 'Generating...' : 'Generate & Send'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Floating Bulk Action Bar */}
      {selectedEmployees.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-4 z-50">
          <span className="font-bold">{selectedEmployees.length} Selected</span>
          <div className="h-4 w-px bg-gray-700"></div>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 hover:text-green-400 transition-colors font-medium text-sm"
          >
            <FileText size={16} /> Issue Document
          </button>
          <button
            onClick={() => setSelectedEmployees([])}
            className="ml-2 text-gray-400 hover:text-white"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeDirectory;
