import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Select, Alert, Badge } from '../components/UI';
import { onboardingTasks as defaultTasks, departments, designations } from '../data/mockData';
import { CheckCircle, Circle, UserPlus, Upload, LayoutGrid, List, Plus, Trash2, Calendar, FileText, ExternalLink, XCircle, MessageSquare, Download } from 'lucide-react';
import OnboardingQueue from '../components/Hiring/OnboardingQueue';
import { db } from '../config/firebase';
import { doc, updateDoc, onSnapshot, arrayUnion, arrayRemove, collection, query } from 'firebase/firestore';
import { showToast } from '../utils/toast';
import { logAuditAction } from '../utils/auditLogger';
import Papa from 'papaparse';

const Onboarding = () => {
  const { addEmployee, currentUser } = useAuth();
  const [alert, setAlert] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Checklist & Documents State
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist' or 'documents'
  const [checklistTasks, setChecklistTasks] = useState([]);
  const [candidateDocs, setCandidateDocs] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');

  const [departmentsList, setDepartmentsList] = useState(() => {
    const saved = localStorage.getItem('departments');
    return saved ? JSON.parse(saved).map(d => d.name) : departments;
  });

  // Form Data State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', employeeId: '', email: '', phone: '',
    department: 'Engineering', customDepartment: '', designation: 'Research Analyst', customDesignation: '',
    reportingTo: '', addressLine1: '', city: '', state: '', country: '', zipCode: '',
    emergencyContact: '', bloodGroup: 'O+', userId: '', password: '',
    panNumber: '', bankName: '', bankAccount: '', ifscCode: '', role: 'employee'
  });

  // Sync checklist & documents when candidate is selected
  useEffect(() => {
    if (!selectedCandidate) {
      setChecklistTasks([]);
      setCandidateDocs([]);
      return;
    }

    // 1. Listen to Checklist (in main doc)
    const unsubscribeChecklist = onSnapshot(doc(db, 'offers', selectedCandidate.id), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (!data.onboardingChecklist) {
          initializeChecklist(selectedCandidate.id);
        } else {
          setChecklistTasks(data.onboardingChecklist);
        }
      }
    });

    // 2. Listen to Documents (subcollection)
    const q = query(collection(db, 'offers', selectedCandidate.id, 'documents'));
    const unsubscribeDocs = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCandidateDocs(docs);
    });

    return () => {
      unsubscribeChecklist();
      unsubscribeDocs();
    };
  }, [selectedCandidate]);

  const handleVerifyDoc = async (docId) => {
    try {
      await updateDoc(doc(db, 'offers', selectedCandidate.id, 'documents', docId), {
        status: 'Verified',
        notes: ''
      });
      showToast.success("Document verified");
    } catch (e) {
      showToast.error("Verification failed");
    }
  };

  const handleRejectDoc = async (docId) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason) return;

    try {
      await updateDoc(doc(db, 'offers', selectedCandidate.id, 'documents', docId), {
        status: 'Rejected',
        notes: reason
      });
      showToast.success("Document rejected");
    } catch (e) {
      showToast.error("Rejection failed");
    }
  };

  const initializeChecklist = async (offerId) => {
    try {
      const initialChecklist = defaultTasks.map(t => ({ ...t, updatedAt: new Date().toISOString() }));
      await updateDoc(doc(db, 'offers', offerId), {
        onboardingChecklist: initialChecklist
      });
    } catch (error) {
      console.error("Error initializing checklist:", error);
    }
  };

  const handleToggleTask = async (taskId) => {
    if (!selectedCandidate) return;

    const updatedTasks = checklistTasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t
    );

    try {
      await updateDoc(doc(db, 'offers', selectedCandidate.id), {
        onboardingChecklist: updatedTasks
      });
    } catch (error) {
      showToast.error("Failed to update task");
    }
  };

  const handleAddTask = async () => {
    if (!newTaskText.trim() || !selectedCandidate) return;

    const newTask = {
      id: Date.now(),
      task: newTaskText,
      completed: false,
      updatedAt: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, 'offers', selectedCandidate.id), {
        onboardingChecklist: arrayUnion(newTask)
      });
      setNewTaskText('');
      showToast.success("Task added");
    } catch (error) {
      showToast.error("Failed to add task");
    }
  };

  const handleDeleteTask = async (taskToDelete) => {
    if (!selectedCandidate) return;
    if (!window.confirm("Remove this task?")) return;

    try {
      await updateDoc(doc(db, 'offers', selectedCandidate.id), {
        onboardingChecklist: arrayRemove(taskToDelete)
      });
      showToast.success("Task removed");
    } catch (error) {
      showToast.error("Failed to remove task");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updates = { ...prev, [name]: value };
      if (name === 'email') updates.userId = value;
      return updates;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const employeeData = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`,
      department: formData.department === 'Other' ? formData.customDepartment : formData.department,
      designation: formData.designation === 'Other' ? formData.customDesignation : formData.designation,
      address: `${formData.addressLine1}, ${formData.city}, ${formData.state}, ${formData.country} - ${formData.zipCode}`
    };

    const result = await addEmployee(employeeData);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });

    if (result.success) {
      setShowForm(false);
      // Reset logic here if needed
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handlePromote = (joiner) => {
    const [firstName, ...lastNameParts] = joiner.candidateName.split(' ');
    setFormData({
      ...formData,
      firstName: firstName,
      lastName: lastNameParts.join(' '),
      email: joiner.candidateEmail,
      userId: joiner.candidateEmail,
      department: joiner.department,
      designation: joiner.jobTitle,
      password: 'Welcome@123',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Bulk Upload Handlers (kept same as before, simplified for brevity)
  const downloadTemplate = () => {
    const headers = [
      'firstName', 'lastName', 'email', 'phone', 'employeeId', 'department',
      'designation', 'reportingTo', 'role', 'password', 'addressLine1',
      'city', 'state', 'country', 'zipCode', 'panNumber', 'bankName',
      'bankAccount', 'ifscCode', 'bloodGroup'
    ];
    const sampleData = [
      'John', 'Doe', 'john.doe@example.com', '9876543210', 'EMP101', 'Engineering',
      'Developer', 'Admin', 'employee', 'Welcome@123', 'Street 1',
      'City', 'State', 'Country', '123456', 'ABCDE1234F', 'Bank Name',
      '1234567890', 'IFSC001', 'O+'
    ];

    const csv = [headers.join(','), sampleData.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_onboarding_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAlert({ type: 'info', message: 'Processing bulk upload...' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const employees = results.data;
        let successCount = 0;
        let errorCount = 0;

        for (const emp of employees) {
          try {
            const employeeData = {
              firstName: emp.firstName || emp.firstName,
              lastName: emp.lastName || emp.lastName,
              name: `${emp.firstName} ${emp.lastName}`,
              email: emp.email,
              phone: emp.phone,
              employeeId: emp.employeeId,
              department: emp.department,
              designation: emp.designation,
              reportingTo: emp.reportingTo || 'Admin',
              role: (emp.role || 'employee').toLowerCase(),
              password: emp.password || 'Welcome@123',
              userId: emp.email,
              address: `${emp.addressLine1 || ''}, ${emp.city || ''}, ${emp.state || ''}, ${emp.country || ''} - ${emp.zipCode || ''}`,
              panNumber: emp.panNumber,
              bankName: emp.bankName,
              bankAccount: emp.bankAccount,
              ifscCode: emp.ifscCode,
              bloodGroup: emp.bloodGroup || 'O+'
            };

            if (!employeeData.email || !employeeData.firstName) {
              errorCount++;
              continue;
            }

            const result = await addEmployee(employeeData);
            if (result.success) {
              successCount++;
              logAuditAction({
                action: 'BULK_ONBOARDING',
                category: 'EMPLOYEE',
                performedBy: { name: 'Admin' }, // Fallback if currentUser not available
                targetId: employeeData.employeeId,
                targetName: employeeData.name,
                details: { method: 'CSV_UPLOAD' }
              });
            } else {
              errorCount++;
            }
          } catch (err) {
            console.error("Bulk upload error for row:", emp, err);
            errorCount++;
          }
        }

        setAlert({
          type: errorCount === 0 ? 'success' : 'warning',
          message: `Bulk Onboarding Complete: ${successCount} added, ${errorCount} failed.`
        });
        setShowBulkUpload(false);
        setTimeout(() => setAlert(null), 5000);
      }
    });
  };

  const completedCount = checklistTasks.filter(t => t.completed).length;
  const progress = checklistTasks.length > 0 ? (completedCount / checklistTasks.length) * 100 : 0;

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Onboarding Hub</h1>
          <p className="text-gray-500 mt-1">Manage joiners, checklists, and orientation</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => setShowBulkUpload(!showBulkUpload)} variant="secondary">
            <Upload size={18} className="inline mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <UserPlus size={18} className="inline mr-2" />
            {showForm ? 'Hide Form' : 'Add Employee'}
          </Button>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Queue */}
        <div className="lg:col-span-7 space-y-6">
          <OnboardingQueue
            onPromote={handlePromote}
            onSelect={setSelectedCandidate}
            selectedCandidateId={selectedCandidate?.id}
          />

          {/* Keep Bulk Upload & New Employee Form below queue when visible */}
          {showBulkUpload && (
            <Card title="Bulk Employee Upload" className="mb-6">
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload a CSV file with employee details. Download the template below for the required format.
                </p>
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <FileText className="text-primary-600" size={24} />
                    <div>
                      <p className="text-sm font-medium">CSV Template</p>
                      <p className="text-xs text-gray-500">Includes all required fields</p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={downloadTemplate}>
                    <Download size={14} className="mr-1" /> Template
                  </Button>
                </div>

                <div className="relative group">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="bulk-upload-input"
                  />
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-10 text-center group-hover:border-primary-400 group-hover:bg-primary-50/10 transition-all">
                    <Upload className="mx-auto text-gray-400 group-hover:text-primary-500 mb-3 transition-colors" size={40} />
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Click to browse or drag and drop CSV file
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Maximum file size: 5MB</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setShowBulkUpload(false)}>Close</Button>
                </div>
              </div>
            </Card>
          )}

          {showForm && (
            <Card title="New Employee Registration" className="mb-6">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-4 border-b pb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                    <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                    <Input label="Email Address" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                    <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleInputChange} required />
                    <Input label="Employee ID (Optional)" name="employeeId" value={formData.employeeId} onChange={handleInputChange} placeholder="Auto-generated if empty" />
                    <Select
                      label="Blood Group"
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleInputChange}
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ value: bg, label: bg }))}
                    />
                  </div>
                </div>

                {/* Job Details */}
                <div>
                  <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-4 border-b pb-2">Employment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Department"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      options={[...departmentsList.map(d => ({ value: d, label: d })), { value: 'Other', label: 'Other/Custom' }]}
                    />
                    {formData.department === 'Other' && (
                      <Input label="Custom Department" name="customDepartment" value={formData.customDepartment} onChange={handleInputChange} required />
                    )}
                    <Select
                      label="Designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleInputChange}
                      options={[...designations.map(d => ({ value: d, label: d })), { value: 'Other', label: 'Other/Custom' }]}
                    />
                    {formData.designation === 'Other' && (
                      <Input label="Custom Designation" name="customDesignation" value={formData.customDesignation} onChange={handleInputChange} required />
                    )}
                    <Select
                      label="Reporting To"
                      name="reportingTo"
                      value={formData.reportingTo}
                      onChange={handleInputChange}
                      options={[
                        { value: 'Admin', label: 'Admin' },
                        ...departmentsList.map(d => ({ value: `${d} Head`, label: `${d} Head` }))
                      ]}
                    />
                    <Select
                      label="Access Role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      options={[
                        { value: 'employee', label: 'Employee' },
                        { value: 'hr', label: 'HR Admin' },
                        { value: 'manager', label: 'Manager' }
                      ]}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-4 border-b pb-2">Address Details</h3>
                  <div className="space-y-4">
                    <Input label="Address Line 1" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Input label="City" name="city" value={formData.city} onChange={handleInputChange} required />
                      <Input label="State" name="state" value={formData.state} onChange={handleInputChange} required />
                      <Input label="Country" name="country" value={formData.country} onChange={handleInputChange} required />
                      <Input label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>

                {/* Bank & Financial */}
                <div>
                  <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-4 border-b pb-2">Financial & ID Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleInputChange} required />
                    <Input label="Bank Name" name="bankName" value={formData.bankName} onChange={handleInputChange} required />
                    <Input label="Account Number" name="bankAccount" value={formData.bankAccount} onChange={handleInputChange} required />
                    <Input label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} required />
                  </div>
                </div>

                {/* Security */}
                <div>
                  <h3 className="text-sm font-bold text-primary-600 uppercase tracking-wider mb-4 border-b pb-2">Login Credentials</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Login Password" type="password" name="password" value={formData.password} onChange={handleInputChange} required />
                    <div className="flex items-center text-xs text-gray-500 italic pt-8">
                      User ID will be set to: {formData.email || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" className="px-8 shadow-lg shadow-primary-500/30">
                    <UserPlus size={18} className="mr-2" />
                    Complete Registration
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>

        {/* Right Panel: Checklist */}
        <div className="lg:col-span-5">
          <Card className="sticky top-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
              {selectedCandidate ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{selectedCandidate.candidateName}</h3>
                      <p className="text-xs text-gray-500">{selectedCandidate.jobTitle}</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">Joining: {selectedCandidate.joiningDate}</Badge>
                  </div>

                  {/* Tabs */}
                  <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-2">
                    <button
                      onClick={() => setActiveTab('checklist')}
                      className={`flex-1 py-1 text-sm font-medium rounded-md transition-all ${activeTab === 'checklist' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Checklist
                    </button>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className={`flex-1 py-1 text-sm font-medium rounded-md transition-all ${activeTab === 'documents' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Documents
                    </button>
                  </div>

                  {activeTab === 'checklist' && (
                    <>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-bold">{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-primary-600'}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <List size={32} className="mx-auto mb-2 opacity-20" />
                  <p>Select a candidate to view details</p>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedCandidate ? (
                activeTab === 'checklist' ? (
                  // CHECKLIST VIEW
                  checklistTasks.length > 0 ? (
                    checklistTasks.map(task => (
                      <div
                        key={task.id}
                        className={`group flex items-start gap-3 p-3 rounded-lg border transition-all ${task.completed
                          ? 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30'
                          : 'bg-white border-gray-100 hover:border-primary-200 dark:bg-gray-800 dark:border-gray-700'
                          }`}
                      >
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className={`mt-0.5 transition-colors ${task.completed ? 'text-green-600' : 'text-gray-300 hover:text-primary-500'}`}
                        >
                          {task.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                        </button>
                        <span className={`flex-1 text-sm ${task.completed ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                          {task.task}
                        </span>
                        <button
                          onClick={() => handleDeleteTask(task)}
                          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-gray-400 py-10">Initializing checklist...</div>
                  )
                ) : (
                  // DOCUMENTS VIEW
                  candidateDocs.length > 0 ? (
                    candidateDocs.map(doc => (
                      <div key={doc.id} className="border rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-primary-600" />
                            <span className="font-semibold text-gray-800 text-sm">{doc.name}</span>
                          </div>
                          <Badge className={`
                            ${doc.status === 'Verified' ? 'bg-green-100 text-green-700' : ''}
                            ${doc.status === 'Rejected' ? 'bg-red-100 text-red-700' : ''}
                            ${doc.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                          `}>
                            {doc.status}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-500 mt-2 border-t pt-2">
                          <span>{doc.fileName}</span>
                          <div className="flex gap-2">
                            <button onClick={() => window.open(doc.url, '_blank')} className="text-blue-600 hover:underline flex items-center gap-1">
                              <ExternalLink size={12} /> View
                            </button>
                          </div>
                        </div>

                        {doc.status === 'Pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="secondary" className="flex-1 h-8 text-xs text-green-700 bg-green-50 hover:bg-green-100" onClick={() => handleVerifyDoc(doc.id)}>
                              <CheckCircle size={12} className="mr-1" /> Verify
                            </Button>
                            <Button size="sm" variant="secondary" className="flex-1 h-8 text-xs text-red-700 bg-red-50 hover:bg-red-100" onClick={() => handleRejectDoc(doc.id)}>
                              <XCircle size={12} className="mr-1" /> Reject
                            </Button>
                          </div>
                        )}

                        {doc.notes && (
                          <div className="mt-2 text-xs bg-gray-50 p-2 rounded text-gray-600 italic">
                            Note: {doc.notes}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Upload size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                      <p className="text-xs text-gray-400">Candidate can upload via their offer portal.</p>
                    </div>
                  )
                )
              ) : (
                // Empty State Placeholder content
                <div className="space-y-4 opacity-40 grayscale pointer-events-none select-none">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 p-3 border rounded-lg">
                      <Circle size={20} />
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedCandidate && activeTab === 'checklist' && (
              <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                    placeholder="Add new task..."
                    className="flex-1 text-sm border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 focus:outline-none px-3 py-2"
                  />
                  <Button size="sm" onClick={handleAddTask} disabled={!newTaskText.trim()}>
                    <Plus size={16} />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};


export default Onboarding;
