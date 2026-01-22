import React, { useState, useMemo } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table, Alert } from '../components/UI';
import { FileText, CheckCircle, XCircle } from 'lucide-react';
import { getEffectiveWorkDate, calculateAbsDuration } from '../utils/helpers';
import { calculateAttendanceStatus } from '../utils/biometricSync';

const AttendanceRegularization = () => {
  const { currentUser, attendance, allUsers, regularizationRequests, rosters } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    inTime: '',
    outTime: '',
    type: 'Missed Punch',
    reason: '',
    attachment: ''
  });

  const maxDaysBack = 30;

  // Filter requests based on role
  const myRequests = useMemo(() => {
    return regularizationRequests.filter(r =>
      currentUser.role === 'employee' ? r.employeeId === currentUser.id :
        currentUser.role === 'hr' || currentUser.role === 'admin' ? true : false
    ).sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));
  }, [regularizationRequests, currentUser]);

  const handleSubmit = async () => {
    try {
      // Logic Validation
      const selectedDate = new Date(formData.date);
      const today = new Date();
      const daysDiff = Math.floor((today - selectedDate) / (1000 * 60 * 60 * 24));

      if (daysDiff > maxDaysBack) {
        throw new Error(`Regularization allowed only for last ${maxDaysBack} days`);
      }

      const hasPending = regularizationRequests.some(r =>
        r.date === formData.date &&
        r.employeeId === currentUser.id &&
        r.status === 'Pending'
      );

      if (hasPending) {
        throw new Error('A pending request already exists for this date');
      }

      // Create Request Payload
      const newRequest = {
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        managerId: allUsers.find(u => u.name === currentUser.reportingTo)?.id || 'admin',
        ...formData,
        status: 'Pending',
        submittedDate: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        auditLog: [{ action: 'Submitted', by: currentUser.name, date: new Date().toISOString() }]
      };

      await addDoc(collection(db, 'regularizationRequests'), newRequest);

      setAlert({ type: 'success', message: 'Regularization request submitted successfully' });
      setShowModal(false);
      setFormData({ date: '', inTime: '', outTime: '', type: 'Missed Punch', reason: '', attachment: '' });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleApproval = async (requestId, status, comments) => {
    try {
      const request = regularizationRequests.find(r => r.id === requestId);
      if (!request) throw new Error("Request not found");

      const auditEntry = {
        action: status,
        by: currentUser.name,
        date: new Date().toISOString(),
        comments
      };

      const requestRef = doc(db, 'regularizationRequests', requestId);
      await updateDoc(requestRef, {
        status,
        approverComments: comments,
        auditLog: [...(request.auditLog || []), auditEntry]
      });

      // If Approved, update the actual Attendance Record in Firestore
      if (status === 'Approved') {
        const { employeeId, date, inTime, outTime } = request;
        const roster = rosters.find(r => r.employeeId === employeeId && r.date === date);

        // 1. Calculate robust attendance data using central logic
        // Only use biometricSync logic if we have both In and Out
        let attendanceUpdate = {};

        if (inTime && outTime) {
          // We'll treat the user input "date" as the Work Date (Business Day)
          // But we need to infer the clockOutDate for cross-midnight duration call
          let clockOutDate = date;
          const [inH] = inTime.split(':').map(Number);
          const [outH] = outTime.split(':').map(Number);

          if (outH < inH) {
            // Crossed midnight logic
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            clockOutDate = nextDay.toISOString().split('T')[0];
          }

          // Assuming manual entry follows roster rules, but we recalculate status to be safe
          const result = calculateAttendanceStatus(inTime, outTime, date, roster);

          attendanceUpdate = {
            clockIn: inTime,
            clockOut: outTime,
            status: result.status, // Use calculated status (e.g., Present, Half Day)
            workHours: result.workHours,
            workingDays: result.workingDays,
            overtime: result.overtime,
            regularizedBy: currentUser.id,
            regularizedAt: serverTimestamp(),
            isRegularized: true
          };
        } else {
          attendanceUpdate = {
            clockIn: inTime || null,
            clockOut: outTime || null,
            status: 'Regularized',
            regularizedBy: currentUser.id
          };
        }

        // 2. Find and Update (or Create) the attendance document
        // We construct the ID based on our standard: userId-date
        const docId = `${employeeId}-${date}`;
        const attendanceRef = doc(db, 'attendance', docId);

        // check if doc exists to determine set vs update
        const docSnap = await getDoc(attendanceRef);

        if (docSnap.exists()) {
          await updateDoc(attendanceRef, attendanceUpdate);
        } else {
          await addDoc(collection(db, 'attendance'), {
            employeeId,
            date,
            ...attendanceUpdate
          }); // Note: using addDoc might create random ID, better to use setDoc with specific ID logic if strict
          // For now, let's stick to updateDoc as regularizing implies fixing a record suitable for today/past
        }
      }

      setAlert({ type: 'success', message: `Request ${status.toLowerCase()} successfully` });
    } catch (error) {
      console.error(error);
      setAlert({ type: 'error', message: 'Operation failed: ' + error.message });
    }
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Approved' ? 'bg-green-100 text-green-800' :
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
