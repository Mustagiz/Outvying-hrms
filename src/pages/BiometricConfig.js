import React, { useState } from 'react';
import { Card, Button, Input, Alert, Table, Modal } from '../components/UI';
import { Fingerprint, Plus, Wifi, CheckCircle, XCircle } from 'lucide-react';

const BiometricConfig = () => {
  const [alert, setAlert] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [testingDevice, setTestingDevice] = useState(null);
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

  const columns = [
    { header: 'Device Name', accessor: 'name' },
    { header: 'IP Address', accessor: 'ipAddress' },
    { header: 'Location', accessor: 'location' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
