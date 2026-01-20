import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Select, Alert } from '../components/UI';
import { onboardingTasks, departments, designations } from '../data/mockData';
import { CheckCircle, Circle, UserPlus, Upload } from 'lucide-react';

const Onboarding = () => {
  const { addEmployee } = useAuth();
  const [alert, setAlert] = useState(null);
  const [tasks, setTasks] = useState(onboardingTasks);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [departmentsList, setDepartmentsList] = useState(() => {
    const saved = localStorage.getItem('departments');
    return saved ? JSON.parse(saved).map(d => d.name) : departments;
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: '',
    email: '',
    phone: '',
    department: 'Engineering',
    customDepartment: '',
    designation: 'Research Analyst',
    customDesignation: '',
    reportingTo: '',
    addressLine1: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
    emergencyContact: '',
    bloodGroup: 'O+',
    userId: '',
    password: '',
    panNumber: '',
    bankName: '',
    bankAccount: '',
    ifscCode: '',
    role: 'employee'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updates = { ...prev, [name]: value };
      if (name === 'email') {
        updates.userId = value;
      }
      return updates;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const employeeData = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`,
      department: formData.department === 'Other' ? formData.customDepartment : formData.department,
      designation: formData.designation === 'Other' ? formData.customDesignation : formData.designation,
      address: `${formData.addressLine1}, ${formData.city}, ${formData.state}, ${formData.country} - ${formData.zipCode}`
    };
    const result = addEmployee(employeeData);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    if (result.success) {
      setShowForm(false);
      setFormData({
        firstName: '',
        lastName: '',
        employeeId: '',
        email: '',
        phone: '',
        department: 'Engineering',
        customDepartment: '',
        designation: 'Research Analyst',
        customDesignation: '',
        reportingTo: '',
        addressLine1: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        emergencyContact: '',
        bloodGroup: 'O+',
        userId: '',
        password: '',
        panNumber: '',
        bankName: '',
        bankAccount: '',
        ifscCode: '',
        role: 'employee'
      });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const downloadTemplate = () => {
    const headers = [
      'firstName', 'lastName', 'employeeId', 'email', 'phone', 'department',
      'designation', 'reportingTo', 'bloodGroup', 'emergencyContact', 'userId',
      'password', 'panNumber', 'bankName', 'bankAccount', 'ifscCode',
      'addressLine1', 'city', 'state', 'country', 'zipCode'
    ];
    const sampleData = [
      'John', 'Doe', 'EMP001', 'john.doe@outvying.com', '9876543210', 'Engineering',
      'Research Analyst', 'Manager Name', 'O+', '9876543211', 'john.doe',
      'Pass@123', 'ABCDE1234F', 'Federal Bank', '12345678901234', 'FDRL0001234',
      'Address Line 1', 'Pune', 'Maharashtra', 'India', '411014'
    ];

    const csv = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_bulk_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert('Bulk upload functionality will process the CSV file');
    }
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = (completedTasks / tasks.length) * 100;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Employee Onboarding</h1>
        <div className="flex space-x-3">
          <Button onClick={() => setShowBulkUpload(!showBulkUpload)} variant="secondary">
            <Upload size={18} className="inline mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <UserPlus size={18} className="inline mr-2" />
            {showForm ? 'Hide Form' : 'Add New Employee'}
          </Button>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {showBulkUpload && (
        <Card title="Bulk Employee Upload" className="mb-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload a CSV file with employee details. Download the template to see the required format.
            </p>
            <div className="flex space-x-3">
              <Button variant="secondary" onClick={downloadTemplate}>Download Template</Button>
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">CSV file (Max 5MB)</p>
              <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" id="bulkUpload" />
              <label htmlFor="bulkUpload" className="cursor-pointer inline-block mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                Choose File
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowBulkUpload(false)}>Cancel</Button>
              <Button>Upload Employees</Button>
            </div>
          </div>
        </Card>
      )}

      {showForm && (
        <Card title="New Employee Registration" className="mb-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Employee ID (Optional)"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                placeholder="Auto-generated if empty"
              />

              <Input
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />

              <Select
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                options={[...departmentsList.map(d => ({ value: d, label: d })), { value: 'Other', label: 'Other (Add Manually)' }]}
              />

              {formData.department === 'Other' && (
                <Input
                  label="Custom Department"
                  name="customDepartment"
                  value={formData.customDepartment}
                  onChange={handleInputChange}
                  placeholder="Enter department name"
                  required
                />
              )}

              <Select
                label="Designation"
                name="designation"
                value={formData.designation}
                onChange={handleInputChange}
                options={[...designations.map(d => ({ value: d, label: d })), { value: 'Other', label: 'Other (Add Manually)' }]}
              />

              {formData.designation === 'Other' && (
                <Input
                  label="Custom Designation"
                  name="customDesignation"
                  value={formData.customDesignation}
                  onChange={handleInputChange}
                  placeholder="Enter designation"
                  required
                />
              )}

              <Input
                label="Reporting To"
                name="reportingTo"
                value={formData.reportingTo}
                onChange={handleInputChange}
                required
              />

              <Input
                label="Blood Group"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleInputChange}
              />

              <Input
                label="Emergency Contact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleInputChange}
                required
              />

              <Input
                label="User ID (for login)"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                placeholder="e.g., john.doe"
                required
              />

              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create password"
                required
              />

              <Input
                label="PAN Number"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                placeholder="e.g., ABCDE1234F"
                maxLength="10"
                required
              />
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Bank Name"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  placeholder="e.g., Federal Bank"
                  required
                />

                <Input
                  label="Bank Account Number"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  placeholder="Enter account number"
                  required
                />

                <Input
                  label="IFSC Code"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleInputChange}
                  placeholder="e.g., FDRL0001234"
                  maxLength="11"
                  required
                />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Address Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Address Line 1"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                />

                <Input
                  label="Zip Code"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Employee</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Onboarding Checklist">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                {completedTasks} / {tasks.length} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => toggleTask(task.id)}
              >
                {task.completed ? (
                  <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
                ) : (
                  <Circle className="text-gray-400 flex-shrink-0" size={20} />
                )}
                <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-white'}`}>
                  {task.task}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Onboarding Timeline">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Day 1: Welcome & Orientation</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Introduction to company culture and policies</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Day 2-3: Documentation</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Complete all required paperwork and document submission</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Week 1: Training</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">System access, tools training, and team introduction</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Week 2: Project Assignment</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Assignment to projects and responsibilities</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Month 1: Review</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">First month performance review and feedback</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
