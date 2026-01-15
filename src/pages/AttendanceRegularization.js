import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table, Input, Alert } from '../components/UI';
import { Calendar, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

const AttendanceRegularization = () => {
  const { currentUser, attendance, allUsers } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [requests, setRequests] = useState(() => {
    const saved = localStorage.getItem('regularizationRequests');
    return saved ? JSON.parse(saved) : [];
  });
  const [formData, setFormData] = useState({
    date: '',
    inTime: '',
    outTime: '',
    type: 'Missed Punch',
    reason: '',
    attachment: ''
  });

  const maxDaysBack = 30;

  const myAttendance = useMemo(() => {
    return attendance.filter(a => a.employeeId === currentUser.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [attendance, currentUser]);

  const myRequests = useMemo(() => {
    return requests.filter(r => 
      currentUser.role === 'employee' ? r.employeeId === currentUser.id : 
      currentUser.role === 'hr' || currentUser.role === 'admin' ? true : false
    ).sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
  }, [requests, currentUser]);

  const handleSubmit = () => {
    const selectedDate = new Date(formData.date);
    const today = new Date();
    const daysDiff = Math.floor((today - selectedDate) / (1000 * 60 * 60 * 24));

    if (daysDiff > maxDaysBack) {
      setAlert({ type: 'error', message: `Regularization allowed only for last ${maxDaysBack} days` });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const hasPending = requests.some(r => r.date === formData.date && r.employeeId === currentUser.id && r.status === 'Pending');
    if (hasPending) {
      setAlert({ type: 'error', message: 'A pending request already exists for this date' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const newRequest = {
      id: Date.now(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      managerId: allUsers.find(u => u.name === currentUser.reportingTo)?.id,
      ...formData,
      status: 'Pending',
      submittedDate: new Date().toISOString().split('T')[0],
      auditLog: [{ action: 'Submitted', by: currentUser.name, date: new Date().toISOString() }]
    };

    const updated = [...requests, newRequest];
    setRequests(updated);
    localStorage.setItem('regularizationRequests', JSON.stringify(updated));
    
    setAlert({ type: 'success', message: 'Regularization request submitted successfully' });
    setShowModal(false);
    setFormData({ date: '', inTime: '', outTime: '', type: 'Missed Punch', reason: '', attachment: '' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleApproval = (requestId, status, comments) => {
    const updated = requests.map(r => {
      if (r.id === requestId) {
        const auditEntry = { action: status, by: currentUser.name, date: new Date().toISOString(), comments };
        return { ...r, status, approverComments: comments, auditLog: [...r.auditLog, auditEntry] };
      }
      return r;
    });
    setRequests(updated);
    localStorage.setItem('regularizationRequests', JSON.stringify(updated));
    
    if (status === 'Approved') {
      const request = requests.find(r => r.id === requestId);
      const attendanceData = JSON.parse(localStorage.getItem('attendance') || '[]');
      const updatedAttendance = attendanceData.map(a => {
        if (a.employeeId === request.employeeId && a.date === request.date) {
          return { ...a, clockIn: request.inTime, clockOut: request.outTime, status: 'Regularized' };
        }
        return a;
      });
      localStorage.setItem('attendance', JSON.stringify(updatedAttendance));
    }
    
    setAlert({ type: 'success', message: `Request ${status.toLowerCase()} successfully` });
    setTimeout(() => setAlert(null), 3000);
  };

  const columns = [
    ...(currentUser.role !== 'employee' ? [{ header: 'Employee', accessor: 'employeeName' }] : []),
    { header: 'Date', accessor: 'date' },
    { header: 'Type', accessor: 'type' },
    { header: 'In Time', accessor: 'inTime' },
    { header: 'Out Time', accessor: 'outTime' },
    { header: 'Submitted', accessor: 'submittedDate' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Approved' ? 'bg-green-100 text-green-800' :
          row.status === 'Rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => row.status === 'Pending' && (currentUser.role === 'hr' || currentUser.role === 'admin') ? (
        <div className="flex gap-2">
          <Button onClick={() => handleApproval(row.id, 'Approved', '')} variant="success" className="text-xs py-1 px-2">
            <CheckCircle size={14} className="inline mr-1" /> Approve
          </Button>
          <Button onClick={() => handleApproval(row.id, 'Rejected', '')} variant="danger" className="text-xs py-1 px-2">
            <XCircle size={14} className="inline mr-1" /> Reject
          </Button>
        </div>
      ) : <span className="text-xs text-gray-500">-</span>
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Attendance Regularization</h1>
        {currentUser.role === 'employee' && (
          <Button onClick={() => setShowModal(true)}>
            <FileText size={18} className="inline mr-2" />
            Request Regularization
          </Button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Card title="Regularization Requests">
        <Table columns={columns} data={myRequests} />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Attendance Regularization Request">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="Missed Punch">Missed Punch</option>
              <option value="WFH">Work From Home</option>
              <option value="On-duty">On-duty</option>
              <option value="Half Day">Half Day</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">In Time</label>
              <input
                type="time"
                value={formData.inTime}
                onChange={(e) => setFormData({ ...formData, inTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Out Time</label>
              <input
                type="time"
                value={formData.outTime}
                onChange={(e) => setFormData({ ...formData, outTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason *</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows="3"
              placeholder="Enter reason for regularization"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachment (Optional)</label>
            <input
              type="text"
              value={formData.attachment}
              onChange={(e) => setFormData({ ...formData, attachment: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="File name or URL"
            />
          </div>

          <p className="text-xs text-gray-600 dark:text-gray-400">
            Note: Regularization allowed only for last {maxDaysBack} days
          </p>

          <Button onClick={handleSubmit} className="w-full" disabled={!formData.date || !formData.reason}>
            Submit Request
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceRegularization;
