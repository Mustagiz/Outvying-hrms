import React, { useState, useMemo, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDoc,
  setDoc,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Modal, Table, Alert } from '../components/UI';
import { FileText, CheckCircle, XCircle, Edit2 } from 'lucide-react';
import { getEffectiveWorkDate, calculateAbsDuration } from '../utils/helpers';
import { calculateAttendanceStatus } from '../utils/biometricSync';

const AttendanceRegularization = () => {
  const { currentUser, attendance, allUsers, regularizationRequests, rosters, createNotification, attendanceRules } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    inTime: '',
    outTime: '',
    type: 'Missed Punch',
    regularizationType: 'Both',
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

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(myRequests.length / itemsPerPage);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return myRequests.slice(startIndex, endIndex);
  }, [myRequests, currentPage, itemsPerPage]);

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [myRequests.length]);

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      date: request.date || '',
      inTime: request.inTime || '',
      outTime: request.outTime || '',
      type: request.type || 'Missed Punch',
      regularizationType: request.regularizationType || 'Both',
      reason: request.reason || '',
      attachment: request.attachment || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      // Logic Validation
      const selectedDate = new Date(formData.date);
      const today = new Date();
      const daysDiff = Math.floor((today - selectedDate) / (1000 * 60 * 60 * 24));

      if (daysDiff > maxDaysBack) {
        throw new Error(`Regularization allowed only for last ${maxDaysBack} days`);
      }

      const existingPending = regularizationRequests.find(r =>
        r.date === formData.date &&
        r.employeeId === currentUser.id &&
        r.status === 'Pending'
      );

      // Removed duplicate check error throw

      if (editingRequest || existingPending) {
        // Update Existing Request (Admin Edit OR Employee Overwrite)
        const targetId = editingRequest ? editingRequest.id : existingPending.id;
        const actionType = editingRequest ? 'Modified' : 'Overwritten';

        const requestRef = doc(db, 'regularizationRequests', targetId);
        await updateDoc(requestRef, {
          ...formData,
          auditLog: [...((editingRequest || existingPending).auditLog || []), { action: actionType, by: currentUser.name, date: new Date().toISOString() }]
        });

        // If editing an APPROVED request, we must immediately update the linked Attendance Record
        if (editingRequest && editingRequest.status === 'Approved') {
          // Calculate new attendance values
          const { employeeId } = editingRequest;
          const { date, inTime, outTime } = formData;
          const roster = rosters.find(r => r.employeeId === employeeId && r.date === date);

          let attendanceUpdate = {};
          if (inTime && outTime) {
            let clockOutDate = date;
            const [inH] = inTime.split(':').map(Number);
            const [outH] = outTime.split(':').map(Number);
            if (outH < inH) {
              const nextDay = new Date(date);
              nextDay.setDate(nextDay.getDate() + 1);
              clockOutDate = nextDay.toISOString().split('T')[0];
            }

            const result = calculateAttendanceStatus(inTime, outTime, date, roster, attendanceRules);
            attendanceUpdate = {
              clockIn: inTime,
              clockOut: outTime,
              status: result.status,
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
              status: 'Present',
              workingDays: 1.0,
              regularizedBy: currentUser.id,
              isRegularized: true
            };
          }

          // 2. Find and Update existing records (handling duplicates)
          const q = query(
            collection(db, 'attendance'),
            where('employeeId', '==', employeeId),
            where('date', '==', date)
          );
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // Update the first record found
            const firstDoc = querySnapshot.docs[0];
            await updateDoc(firstDoc.ref, attendanceUpdate);

            // DELETE any duplicates (self-healing)
            if (querySnapshot.docs.length > 1) {
              for (let i = 1; i < querySnapshot.docs.length; i++) {
                await deleteDoc(querySnapshot.docs[i].ref);
                console.log(`Deleted duplicate attendance record: ${querySnapshot.docs[i].id}`);
              }
            }
          } else {
            // No record exists, creating new with standard ID
            const docId = `${employeeId}-${date}`;
            await setDoc(doc(db, 'attendance', docId), {
              employeeId,
              date,
              ...attendanceUpdate
            });
          }
        }

        setAlert({ type: 'success', message: editingRequest ? 'Regularization request updated successfully' : 'Attributes updated for existing request' });
      } else {
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

        // Create notification for admin/HR
        const admin = allUsers.find(u => u.role === 'admin' || u.role === 'hr');
        if (admin) {
          await createNotification({
            userId: admin.id,
            type: 'regularization_request',
            title: 'New Regularization Request',
            message: `${currentUser.name} requested ${formData.regularizationType} regularization for ${formData.date}`,
            relatedId: null,
            actionUrl: '/attendance-regularization'
          });
        }

        setAlert({ type: 'success', message: 'Regularization request submitted successfully' });
      }

      setShowModal(false);
      setEditingRequest(null);
      setFormData({ date: '', inTime: '', outTime: '', type: 'Missed Punch', regularizationType: 'Both', reason: '', attachment: '' });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const handleApproval = async (requestId, status, comments) => {
    const result = await updateRegularizationStatus(requestId, status, comments, currentUser.name, currentUser.id);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    setTimeout(() => setAlert(null), 3000);
  };

  const columns = [
    ...(currentUser.role !== 'employee' ? [{ header: 'Employee', accessor: 'employeeName' }] : []),
    { header: 'Date', accessor: 'date' },
    { header: 'Type', accessor: 'type' },
    {
      header: 'Regularization For',
      render: (row) => (
        <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
          {row.regularizationType || 'Both'}
        </span>
      )
    },
    {
      header: 'Reason',
      render: (row) => (
        <div className="max-w-xs truncate" title={row.reason}>
          {row.reason}
        </div>
      )
    },
    { header: 'In Time', accessor: 'inTime', render: (row) => row.inTime || '-' },
    { header: 'Out Time', accessor: 'outTime', render: (row) => row.outTime || '-' },
    { header: 'Submitted', accessor: 'submittedDate' },
    {
      header: 'Approver Notes',
      render: (row) => row.approverComments ? (
        <div className="max-w-xs truncate text-gray-600 dark:text-gray-400 italic" title={row.approverComments}>
          {row.approverComments}
        </div>
      ) : '-'
    },
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
      render: (row) => (currentUser.role === 'hr' || currentUser.role === 'admin') ? (
        <div className="flex gap-2">
          <Button onClick={() => handleEdit(row)} variant="secondary" className="text-xs py-1 px-2">
            <Edit2 size={14} className="inline mr-1" /> Edit
          </Button>
          {row.status === 'Pending' && (
            <>
              <Button onClick={() => handleApproval(row.id, 'Approved', '')} variant="success" className="text-xs py-1 px-2">
                <CheckCircle size={14} className="inline mr-1" /> Approve
              </Button>
              <Button onClick={() => handleApproval(row.id, 'Rejected', '')} variant="danger" className="text-xs py-1 px-2">
                <XCircle size={14} className="inline mr-1" /> Reject
              </Button>
            </>
          )}
        </div>
      ) : <span className="text-xs text-gray-500">-</span>
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Attendance Regularization</h1>
        {currentUser.role === 'employee' && (
          <Button onClick={() => {
            setEditingRequest(null);
            setFormData({ date: '', inTime: '', outTime: '', type: 'Missed Punch', regularizationType: 'Both', reason: '', attachment: '' });
            setShowModal(true);
          }}>
            <FileText size={18} className="inline mr-2" />
            Request Regularization
          </Button>
        )}
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <Card title="Regularization Requests">
        <Table columns={columns} data={paginatedRequests} />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 px-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, myRequests.length)} of {myRequests.length} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Simple logic to show first few pages or sliding window could be better for large datasets
                  // For now, let's just show up to 5 pages or simple Previous/Next is often enough.
                  // Let's stick to standard Prev/Next with page indicator for simplicity and robustness.
                  return null;
                })}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRequest ? "Modify Regularization Request" : "Attendance Regularization Request"}>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Regularization For</label>
            <select
              value={formData.regularizationType}
              onChange={(e) => setFormData({ ...formData, regularizationType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="Both">Both Login & Logout</option>
              <option value="Login Only">Login Only</option>
              <option value="Logout Only">Logout Only</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(formData.regularizationType === 'Both' || formData.regularizationType === 'Login Only') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">In Time</label>
                <input
                  type="time"
                  value={formData.inTime}
                  onChange={(e) => setFormData({ ...formData, inTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}
            {(formData.regularizationType === 'Both' || formData.regularizationType === 'Logout Only') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Out Time</label>
                <input
                  type="time"
                  value={formData.outTime}
                  onChange={(e) => setFormData({ ...formData, outTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}
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

          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={
              !formData.date ||
              !formData.reason ||
              (formData.regularizationType === 'Both' && (!formData.inTime || !formData.outTime)) ||
              (formData.regularizationType === 'Login Only' && !formData.inTime) ||
              (formData.regularizationType === 'Logout Only' && !formData.outTime)
            }
          >
            {editingRequest ? 'Update Request' : 'Submit Request'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceRegularization;
