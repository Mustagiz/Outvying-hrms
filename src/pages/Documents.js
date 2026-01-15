import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Table, Button, Modal, Input, Select, Alert } from '../components/UI';
import { formatDate, getStatusColor } from '../utils/helpers';
import { FileText, Upload, Download } from 'lucide-react';

const Documents = () => {
  const { currentUser, documents, uploadDocument, allUsers } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Resume',
    expiryDate: ''
  });

  const documentTypes = [
    'Resume',
    'ID Proof',
    'Certificate',
    'Offer Letter',
    'Experience Letter',
    'Address Proof',
    'Educational Certificate',
    'Other'
  ];

  const myDocuments = useMemo(() => {
    return documents.filter(d => 
      currentUser.role === 'employee' ? d.employeeId === currentUser.id : true
    );
  }, [documents, currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = uploadDocument(currentUser.id, formData);
    setAlert({ type: result.success ? 'success' : 'error', message: result.message });
    if (result.success) {
      setShowModal(false);
      setFormData({ name: '', type: 'Resume', expiryDate: '' });
    }
    setTimeout(() => setAlert(null), 3000);
  };

  const columns = [
    ...(currentUser.role !== 'employee' ? [{
      header: 'Employee',
      accessor: 'employeeId',
      render: (row) => allUsers.find(u => u.id === row.employeeId)?.name || 'Unknown'
    }] : []),
    { 
      header: 'Document Name', 
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <FileText size={16} className="text-gray-400" />
          <span>{row.name}</span>
        </div>
      )
    },
    { header: 'Type', accessor: 'type' },
    { header: 'Upload Date', accessor: 'uploadDate', render: (row) => formatDate(row.uploadDate) },
    { 
      header: 'Expiry Date', 
      accessor: 'expiryDate',
      render: (row) => row.expiryDate ? formatDate(row.expiryDate) : 'N/A'
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <button className="text-primary-600 hover:text-primary-700">
            <Download size={16} />
          </button>
        </div>
      )
    }
  ];

  const documentStats = useMemo(() => {
    const total = myDocuments.length;
    const approved = myDocuments.filter(d => d.status === 'Approved').length;
    const pending = myDocuments.filter(d => d.status === 'Pending').length;
    const expiringSoon = myDocuments.filter(d => {
      if (!d.expiryDate) return false;
      const expiry = new Date(d.expiryDate);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length;

    return { total, approved, pending, expiringSoon };
  }, [myDocuments]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Document Management</h1>
        <Button onClick={() => setShowModal(true)}>
          <Upload size={18} className="inline mr-2" />
          Upload Document
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Documents</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{documentStats.total}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Approved</h3>
          <p className="text-3xl font-bold text-green-600">{documentStats.approved}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pending Approval</h3>
          <p className="text-3xl font-bold text-yellow-600">{documentStats.pending}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Expiring Soon</h3>
          <p className="text-3xl font-bold text-red-600">{documentStats.expiringSoon}</p>
        </Card>
      </div>

      <Card title="My Documents">
        <Table columns={columns} data={myDocuments} />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Upload Document">
        <form onSubmit={handleSubmit}>
          <Input
            label="Document Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Resume_JohnDoe.pdf"
            required
          />

          <Select
            label="Document Type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            options={documentTypes.map(t => ({ value: t, label: t }))}
          />

          <Input
            label="Expiry Date (Optional)"
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleInputChange}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload File
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
              <input type="file" className="hidden" />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Upload Document</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Documents;
