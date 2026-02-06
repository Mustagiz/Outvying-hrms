import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table } from '../components/UI';
import { deboardingTasks } from '../data/mockData';
import { CheckCircle, Circle, UserMinus, Eye, Edit2, Trash2, Star, CheckSquare } from 'lucide-react';

const Deboarding = () => {
  const { allUsers, updateUser } = useAuth();
  const [tasks, setTasks] = useState(deboardingTasks);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);

  const exitedEmployees = allUsers.filter(u => u.status === 'Exited' || u.isDeleted === true);

  const [formData, setFormData] = useState({
    selectedUserId: '',
    lastWorkingDay: '',
    exitReason: '',
    exitInterview: '',
    finalSettlement: '',
    exitStatus: 'Resigned',
    rehireEligible: true,
    experienceRating: 5,
    clearance: {
      it: false,
      finance: false,
      operations: false,
      hr: false
    }
  });

  const toggleTask = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const progress = (completedTasks / tasks.length) * 100;

  const handleEdit = (record) => {
    setEditingRecordId(record.id);
    setIsEditing(true);
    setFormData({
      selectedUserId: record.id,
      lastWorkingDay: record.lastWorkingDay || '',
      exitReason: record.exitReason || '',
      exitInterview: record.exitInterview || '',
      finalSettlement: record.finalSettlement || '',
      exitStatus: record.exitStatus || 'Resigned',
      rehireEligible: record.rehireEligible !== undefined ? record.rehireEligible : true,
      experienceRating: record.experienceRating || 5,
      clearance: record.clearance || { it: false, finance: false, operations: false, hr: false }
    });
    setShowModal(true);
  };

  const handleDelete = (recordId, employeeId) => {
    if (!window.confirm('Are you sure you want to delete this exit record? This will restore the employee to active status.')) return;

    updateUser(recordId, {
      isDeleted: false,
      status: 'Active',
      exitStatus: null,
      lastWorkingDay: null,
      exitReason: null,
      exitInterview: null,
      finalSettlement: null,
      rehireEligible: null,
      experienceRating: null,
      clearance: null
    }).then(() => {
      alert('Employee restored to active status successfully');
    });
  };

  const handleSubmit = () => {
    if (!formData.selectedUserId) {
      alert('Please select an employee');
      return;
    }

    // Update Firestore to mark user as deleted/deboarded with all details
    updateUser(formData.selectedUserId, {
      isDeleted: true,
      status: 'Exited',
      exitStatus: formData.exitStatus,
      lastWorkingDay: formData.lastWorkingDay,
      exitReason: formData.exitReason,
      exitInterview: formData.exitInterview,
      finalSettlement: formData.finalSettlement,
      rehireEligible: formData.rehireEligible,
      experienceRating: formData.experienceRating,
      clearance: formData.clearance
    }).then(() => {
      setShowModal(false);
      resetForm();
      alert(isEditing ? 'Exit record updated successfully' : 'Employee exit record saved successfully');
    });
  };

  const resetForm = () => {
    setFormData({
      selectedUserId: '',
      lastWorkingDay: '',
      exitReason: '',
      exitInterview: '',
      finalSettlement: '',
      exitStatus: 'Resigned',
      rehireEligible: true,
      experienceRating: 5,
      clearance: { it: false, finance: false, operations: false, hr: false }
    });
    setIsEditing(false);
    setEditingRecordId(null);
  };

  const viewDetails = (emp) => {
    setSelectedEmployee(emp);
    setShowDetailsModal(true);
  };

  const getClearanceCount = (clearance) => {
    if (!clearance) return '0/4';
    const count = Object.values(clearance).filter(v => v).length;
    return `${count}/4`;
  };

  const columns = [
    { header: 'Employee ID', accessor: 'employeeId' },
    { header: 'Name', accessor: 'name' },
    { header: 'Department', accessor: 'department' },
    {
      header: 'Clearance',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${getClearanceCount(row.clearance) === '4/4' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
          {getClearanceCount(row.clearance)} Cleared
        </span>
      )
    },
    {
      header: 'Re-hire',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.rehireEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
          }`}>
          {row.rehireEligible ? 'Eligible' : 'Not Eligible'}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.exitStatus === 'Resigned' ? 'bg-blue-100 text-blue-800' :
          row.exitStatus === 'Terminated' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
          {row.exitStatus}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button onClick={() => viewDetails(row)} variant="secondary" className="text-[10px] py-1 px-2 uppercase font-bold tracking-tighter">
            <Eye size={12} className="mr-1 inline" /> View
          </Button>
          <Button onClick={() => handleEdit(row)} variant="secondary" className="text-[10px] py-1 px-2 bg-indigo-50 text-indigo-700 border-indigo-100 uppercase font-bold tracking-tighter">
            <Edit2 size={12} className="mr-1 inline" /> Edit
          </Button>
          <Button onClick={() => handleDelete(row.id, row.employeeId)} variant="secondary" className="text-[10px] py-1 px-2 bg-red-50 text-red-700 border-red-100 uppercase font-bold tracking-tighter">
            <Trash2 size={12} className="mr-1 inline" /> Del
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Employee Deboarding</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee exits, clearance checklists, and offboarding formalities.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="shadow-lg shadow-primary-500/20">
          <UserMinus size={18} className="inline mr-2" />
          Process New Exit
        </Button>
      </div>

      <Card title="Exited Employees Management" className="mb-8 overflow-hidden border-none shadow-xl ring-1 ring-black/5 dark:ring-white/5">
        <Table columns={columns} data={exitedEmployees} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Universal Exit Checklist" className="lg:col-span-1">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</span>
              <span className="text-sm font-black text-primary-600">
                {completedTasks} / {tasks.length}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {tasks.map(task => (
              <div
                key={task.id}
                className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all border ${task.completed
                  ? 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/20'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50 hover:border-primary-200'
                  }`}
                onClick={() => toggleTask(task.id)}
              >
                {task.completed ? (
                  <CheckCircle className="text-green-600 flex-shrink-0" size={18} />
                ) : (
                  <Circle className="text-gray-300 flex-shrink-0" size={18} />
                )}
                <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}>
                  {task.task}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Offboarding Metrics & Guidelines" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
              <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-2">Notice Period</h3>
              <p className="text-2xl font-black text-indigo-900 dark:text-white">30 Days</p>
              <p className="text-[10px] text-indigo-600/60 mt-1 italic font-medium">Standard contractual obligation</p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
              <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2">Pending Clearances</h3>
              <p className="text-2xl font-black text-emerald-900 dark:text-white">
                {exitedEmployees.filter(r => getClearanceCount(r.clearance) !== '4/4').length} Records
              </p>
              <p className="text-[10px] text-emerald-600/60 mt-1 italic font-medium">Awaiting departmental signs</p>
            </div>
          </div>

          <div className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-800 space-y-6">
            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-primary-500"></div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Phase 1: Resignation & Handover</p>
              <p className="text-xs text-gray-500 leading-relaxed">Document knowledge transfer and cross-train replacement early in the notice period.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-indigo-500"></div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Phase 2: Departmental Clearance</p>
              <p className="text-xs text-gray-500 leading-relaxed">Ensure IT assets, finance settlements, and admin keys are collected and logged.</p>
            </div>
            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-emerald-500"></div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Phase 3: Exit Interview & Release</p>
              <p className="text-xs text-gray-500 leading-relaxed">Gather feedback on organization culture and provide experience certificates.</p>
            </div>
          </div>
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={isEditing ? 'Modify Exit Record' : 'Process Employee Exit'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest pl-1">Target Employee</label>
              <select
                disabled={isEditing}
                value={formData.selectedUserId}
                onChange={(e) => setFormData({ ...formData, selectedUserId: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50"
              >
                <option value="">Select an employee</option>
                {allUsers.filter(u => {
                  return (u.role === 'employee' || u.role === 'hr') && (!u.isDeleted || (isEditing && String(u.id) === String(formData.selectedUserId)));
                }).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId || emp.id})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest pl-1">Exit Nature</label>
                <select
                  value={formData.exitStatus}
                  onChange={(e) => setFormData({ ...formData, exitStatus: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-medium"
                >
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                  <option value="Absconded">Absconded</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest pl-1">LWD Date</label>
                <input
                  type="date"
                  value={formData.lastWorkingDay}
                  onChange={(e) => setFormData({ ...formData, lastWorkingDay: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest pl-1">Reason for Separation</label>
              <textarea
                value={formData.exitReason}
                onChange={(e) => setFormData({ ...formData, exitReason: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-medium min-h-[80px]"
                placeholder="Briefly describe the reason..."
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800/50">
              <label className="block text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest">Advanced parameters</label>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Re-hire Eligibility</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.rehireEligible}
                    onChange={(e) => setFormData({ ...formData, rehireEligible: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">Exit Experience Rating</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setFormData({ ...formData, experienceRating: star })}
                      className={`p-1 transition-transform active:scale-95 ${formData.experienceRating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                    >
                      <Star size={20} fill={formData.experienceRating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
              <label className="flex items-center gap-2 text-[10px] font-black text-blue-700 dark:text-blue-400 mb-4 uppercase tracking-[0.2em]">
                <CheckSquare size={14} /> Departmental Clearances
              </label>
              <div className="grid grid-cols-1 gap-3">
                {Object.keys(formData.clearance).map(dept => (
                  <div
                    key={dept}
                    onClick={() => setFormData({
                      ...formData,
                      clearance: { ...formData.clearance, [dept]: !formData.clearance[dept] }
                    })}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${formData.clearance[dept]
                      ? 'bg-white dark:bg-gray-800 border-blue-200 shadow-sm'
                      : 'bg-transparent border-dashed border-gray-200 dark:border-gray-700'
                      }`}
                  >
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">{dept} Clearance</span>
                    {formData.clearance[dept] ? (
                      <CheckCircle size={18} className="text-blue-500" />
                    ) : (
                      <Circle size={18} className="text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest pl-1">Final Settlement Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  value={formData.finalSettlement}
                  onChange={(e) => setFormData({ ...formData, finalSettlement: e.target.value })}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-black focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest pl-1">Confidential Interview Notes</label>
              <textarea
                value={formData.exitInterview}
                onChange={(e) => setFormData({ ...formData, exitInterview: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm font-medium min-h-[100px]"
                placeholder="Internal notes from the HR interview..."
              />
            </div>

            <Button onClick={handleSubmit} className="w-full py-3 h-auto font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-500/20">
              {isEditing ? 'Update Exit Record' : 'Finalize Employee Exit'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Comprehensive Exit Profile" size="lg">
        {selectedEmployee && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex items-center gap-4 p-5 bg-gray-50 dark:bg-gray-900/40 rounded-3xl border border-gray-100 dark:border-gray-800/50">
              <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-black">
                {selectedEmployee.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white capitalize">{selectedEmployee.name}</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{selectedEmployee.designation} • {selectedEmployee.department}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${selectedEmployee.exitStatus === 'Resigned' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {selectedEmployee.exitStatus}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {selectedEmployee.employeeId}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Working Day</p>
                    <p className="text-sm font-black text-gray-800 dark:text-white">{selectedEmployee.lastWorkingDay || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">System Exit Date</p>
                    <p className="text-sm font-black text-gray-800 dark:text-white">{selectedEmployee.exitDate}</p>
                  </div>
                </div>

                <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Departmental Status</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedEmployee.clearance || {}).map(([dept, cleared]) => (
                      <div key={dept} className="flex items-center gap-3">
                        {cleared ? <CheckCircle size={16} className="text-emerald-500" /> : <Circle size={16} className="text-gray-200" />}
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">{dept}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Re-hire Verdict</h4>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${selectedEmployee.rehireEligible ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'}`}>
                      {selectedEmployee.rehireEligible ? <CheckSquare size={20} /> : <UserMinus size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-800 dark:text-white">
                        {selectedEmployee.rehireEligible ? 'Recommended for Re-hire' : 'Not Recommended'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium">As per final HR exit assessment</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100/50 dark:border-indigo-900/20">
                  <h4 className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-[0.2em] mb-4">Financial Overview</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-bold text-indigo-400">$</span>
                    <p className="text-3xl font-black text-indigo-900 dark:text-white">{selectedEmployee.finalSettlement || '0.00'}</p>
                  </div>
                  <p className="text-[10px] text-indigo-600/60 mt-1 font-bold uppercase">Final Payout Amount</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-1">Exit Reason</h4>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 italic leading-relaxed">
                      "{selectedEmployee.exitReason || 'No reason provided.'}"
                    </div>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 pl-1">HR Interview Insights</h4>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {selectedEmployee.exitInterview || 'No interview notes recorded.'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Experience:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={12} fill={selectedEmployee.experienceRating >= star ? 'currentColor' : 'none'} className={selectedEmployee.experienceRating >= star ? 'text-yellow-400' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={() => setShowDetailsModal(false)} className="w-full">Close Documentation</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Deboarding;
