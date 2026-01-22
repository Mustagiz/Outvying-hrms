// ... (imports remain similar, adding Papa and firebase deps)
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Input, Alert, Table, Modal } from '../components/UI';
import { Fingerprint, Plus, Wifi, CheckCircle, XCircle, Upload, FileText } from 'lucide-react';
import Papa from 'papaparse';
import { processBiometricImport } from '../utils/biometricSync';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const BiometricConfig = () => {
  const { allUsers, rosters, attendance } = useAuth();
  const [alert, setAlert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingDevice, setTestingDevice] = useState(null);

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importStats, setImportStats] = useState(null);

  const [devices, setDevices] = useState([
    { id: 1, name: 'Main Entrance', ipAddress: '192.168.1.100', location: 'Building A', status: 'Active', lastSync: '2024-01-15 10:30 AM' },
    { id: 2, name: 'Office Floor 2', ipAddress: '192.168.1.101', location: 'Building A - Floor 2', status: 'Active', lastSync: '2024-01-15 10:25 AM' }
  ]);
  const [formData, setFormData] = useState({
    name: '',
    ipAddress: '',
    location: '',
    port: '4370'
  });

  const handleAddDevice = (e) => {
    e.preventDefault();
    const newDevice = {
      id: devices.length + 1,
      ...formData,
      status: 'Active',
      lastSync: new Date().toLocaleString()
    };
    setDevices([...devices, newDevice]);
    setShowAddModal(false);
    setFormData({ name: '', ipAddress: '', location: '', port: '4370' });
    setAlert({ type: 'success', message: 'Device added successfully' });
    setTimeout(() => setAlert(null), 3000);
  };

  const testDevice = (device) => {
    setTestingDevice(device.id);
    setTimeout(() => {
      setTestingDevice(null);
      setAlert({ type: 'success', message: `Device "${device.name}" is responding correctly` });
      setTimeout(() => setAlert(null), 3000);
    }, 2000);
  };

  const syncDevice = (device) => {
    const updatedDevices = devices.map(d =>
      d.id === device.id ? { ...d, lastSync: new Date().toLocaleString() } : d
    );
    setDevices(updatedDevices);
    setAlert({ type: 'success', message: `Device "${device.name}" synced successfully` });
    setTimeout(() => setAlert(null), 3000);
  };

  // --- CSV Import Handlers ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setImportStats(null);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        preview: 5, // Only preview first 5 rows
        complete: (results) => {
          setPreviewData(results.data);
        },
        error: (error) => {
          setAlert({ type: 'error', message: `Parse Error: ${error.message}` });
        }
      });
    }
  };

  const processImport = () => {
    if (!importFile) return;

    setIsProcessing(true);
    Papa.parse(importFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // 1. Process Data
          const { processedData, errors } = processBiometricImport(results.data, allUsers, rosters, attendance);

          if (errors.length > 0) {
            console.warn("Import warning:", errors);
            // Optional: Show some errors to user
          }

          if (processedData.length === 0) {
            setAlert({ type: 'warning', message: 'No valid attendance records found to import.' });
            setIsProcessing(false);
            return;
          }

          // 2. Save to Firestore
          let successCount = 0;
          const promises = processedData.map(async (record) => {
            // We use setDoc with merge: true to avoid overwriting existing non-attendance fields if any,
            // but here we are writing specific attendance docs.
            // Ensure ID format matches what Attendance.js expects: `${employeeId}-${date}`
            const docRef = doc(db, 'attendance', record.id);
            // Add global metadata
            return setDoc(docRef, {
              ...record,
              importedAt: serverTimestamp()
            }, { merge: true }).then(() => successCount++);
          });

          await Promise.all(promises);

          setImportStats({
            total: results.data.length,
            processed: processedData.length,
            errors: errors.length
          });

          setAlert({ type: 'success', message: `Successfully imported ${successCount} attendance records.` });
          setImportFile(null);
          setPreviewData([]);

        } catch (error) {
          console.error("Import execution error:", error);
          setAlert({ type: 'error', message: `Import failed: ${error.message}` });
        } finally {
          setIsProcessing(false);
        }
      }
    });
  };


  const columns = [
    { header: 'Device Name', accessor: 'name' },
    { header: 'IP Address', accessor: 'ipAddress' },
    { header: 'Location', accessor: 'location' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
          {row.status}
        </span>
      )
    },
    { header: 'Last Sync', accessor: 'lastSync' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex space-x-2">
          <Button
            onClick={() => testDevice(row)}
            variant="secondary"
            className="text-xs py-1 px-2"
            disabled={testingDevice === row.id}
          >
            {testingDevice === row.id ? 'Testing...' : 'Test'}
          </Button>
          <Button
            onClick={() => syncDevice(row)}
            variant="primary"
            className="text-xs py-1 px-2"
          >
            Sync
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Biometric Configuration</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus size={18} className="inline mr-2" />
          Add Device
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* --- Import Section --- */}
      <Card title="Import Attendance Logs" className="mb-6">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <FileText className="text-blue-600 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">CSV File Import</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Upload a CSV file containing attendance logs. Required columns:
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 mx-1 rounded">EmployeeID</span>,
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 mx-1 rounded">Date</span> (YYYY-MM-DD),
                  <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 mx-1 rounded">Time</span> (HH:MM)
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          {previewData.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">File Preview (First 5 rows)</h4>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      {Object.keys(previewData[0]).map(header => (
                        <th key={header} className="px-3 py-2 text-left font-medium text-gray-500 uppercase">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {previewData.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-3 py-2 text-gray-700 dark:text-gray-300">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <Button onClick={processImport} loading={isProcessing} variant="primary">
                  <Upload size={16} className="inline mr-2" />
                  Process Import
                </Button>
                {importStats && (
                  <span className="text-sm text-gray-600">
                    Processed: {importStats.processed} / {importStats.total} rows. Errors: {importStats.errors}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ... Existing Stats ... */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Devices</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{devices.length}</p>
            </div>
            <Fingerprint className="text-primary-600" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Devices</p>
              <p className="text-3xl font-bold text-green-600">
                {devices.filter(d => d.status === 'Active').length}
              </p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Inactive Devices</p>
              <p className="text-3xl font-bold text-red-600">
                {devices.filter(d => d.status === 'Inactive').length}
              </p>
            </div>
            <XCircle className="text-red-600" size={32} />
          </div>
        </Card>
      </div>

      <Card title="Registered Devices">
        <Table columns={columns} data={devices} />
      </Card>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Biometric Device">
        <form onSubmit={handleAddDevice}>
          <Input
            label="Device Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Main Entrance"
            required
          />

          <Input
            label="IP Address"
            value={formData.ipAddress}
            onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
            placeholder="e.g., 192.168.1.100"
            required
          />

          <Input
            label="Port"
            value={formData.port}
            onChange={(e) => setFormData({ ...formData, port: e.target.value })}
            placeholder="Default: 4370"
            required
          />

          <Input
            label="Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Building A - Floor 1"
            required
          />

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
            <div className="flex items-start space-x-2">
              <Wifi className="text-blue-600 mt-1" size={16} />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Ensure the device is connected to the network and accessible from this system.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Device</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BiometricConfig;

