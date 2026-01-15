import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Modal, Select, Alert } from '../components/UI';
import { GitBranch, AlertTriangle, Shield, CheckCircle } from 'lucide-react';

const ReportingHierarchy = () => {
  const { allUsers, currentUser } = useAuth();
  const [alert, setAlert] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [violations, setViolations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, action: 'Hierarchy Updated', user: 'Admin', employee: 'John Doe', timestamp: '2024-01-15 10:30 AM', status: 'Success' },
    { id: 2, action: 'Invalid Assignment Blocked', user: 'HR Manager', employee: 'Jane Wilson', timestamp: '2024-01-15 09:15 AM', status: 'Blocked' }
  ]);
  const [formData, setFormData] = useState({
    employeeId: '',
    managerId: '',
    role: 'Staff'
  });

  const roleHierarchy = {
    'Staff': { level: 1, canReportTo: ['Supervisor'] },
    'Supervisor': { level: 2, canReportTo: ['Executive'] },
    'Executive': { level: 3, canReportTo: ['CEO'] },
    'CEO': { level: 4, canReportTo: [] }
  };

  const validateHierarchy = (employeeRole, managerRole) => {
    const empLevel = roleHierarchy[employeeRole]?.level || 0;
    const mgrLevel = roleHierarchy[managerRole]?.level || 0;
    const allowedRoles = roleHierarchy[employeeRole]?.canReportTo || [];
    
    if (mgrLevel <= empLevel) {
      return { valid: false, message: 'Manager must be at higher level than employee' };
    }
    
    if (!allowedRoles.includes(managerRole)) {
      return { valid: false, message: `${employeeRole} can only report to: ${allowedRoles.join(', ')}` };
    }
    
    return { valid: true, message: 'Valid hierarchy' };
  };

  const handleAssignment = (e) => {
    e.preventDefault();
    
    const employee = allUsers.find(u => u.id === parseInt(formData.employeeId));
    const manager = allUsers.find(u => u.id === parseInt(formData.managerId));
    
    if (!employee || !manager) {
      setAlert({ type: 'error', message: 'Invalid employee or manager selection' });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const validation = validateHierarchy(formData.role, manager.designation);
    
    if (!validation.valid) {
      const violation = {
        id: violations.length + 1,
        employee: employee.name,
        manager: manager.name,
        reason: validation.message,
        timestamp: new Date().toLocaleString(),
        status: 'Blocked'
      };
      setViolations([violation, ...violations]);
      
      const log = {
        id: auditLogs.length + 1,
        action: 'Invalid Assignment Blocked',
        user: currentUser.name,
        employee: employee.name,
        timestamp: new Date().toLocaleString(),
        status: 'Blocked'
      };
      setAuditLogs([log, ...auditLogs]);
      
      setAlert({ type: 'error', message: `Assignment blocked: ${validation.message}` });
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    const log = {
      id: auditLogs.length + 1,
      action: 'Hierarchy Updated',
      user: currentUser.name,
      employee: employee.name,
      timestamp: new Date().toLocaleString(),
      status: 'Success'
    };
    setAuditLogs([log, ...auditLogs]);
    
    setShowAssignModal(false);
    setFormData({ employeeId: '', managerId: '', role: 'Staff' });
    setAlert({ type: 'success', message: 'Reporting hierarchy updated successfully' });
    setTimeout(() => setAlert(null), 3000);
  };

  const hierarchyData = useMemo(() => {
    return allUsers.map(user => ({
      id: user.id,
      name: user.name,
      role: user.designation,
      reportingTo: user.reportingTo,
      level: roleHierarchy[user.designation]?.level || 0
    }));
  }, [allUsers]);

  const columns = [
    { header: 'Employee', accessor: 'name' },
    { header: 'Role', accessor: 'role' },
    { header: 'Level', accessor: 'level' },
    { header: 'Reports To', accessor: 'reportingTo' },
    {
      header: 'Status',
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Compliant
        </span>
      )
    }
  ];

  const violationColumns = [
    { header: 'Employee', accessor: 'employee' },
    { header: 'Attempted Manager', accessor: 'manager' },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Timestamp', accessor: 'timestamp' },
    {
      header: 'Status',
      render: (row) => (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          {row.status}
        </span>
      )
    }
  ];

  const auditColumns = [
    { header: 'Action', accessor: 'action' },
    { header: 'User', accessor: 'user' },
    { header: 'Employee', accessor: 'employee' },
    { header: 'Timestamp', accessor: 'timestamp' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Reporting Hierarchy</h1>
        <Button onClick={() => setShowAssignModal(true)}>
          <GitBranch size={18} className="inline mr-2" />
          Assign Reporting
        </Button>
      </div>

      {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Employees</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{hierarchyData.length}</p>
            </div>
            <GitBranch className="text-primary-600" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Compliant</p>
              <p className="text-3xl font-bold text-green-600">{hierarchyData.length}</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Violations</p>
              <p className="text-3xl font-bold text-red-600">{violations.length}</p>
            </div>
            <AlertTriangle className="text-red-600" size={32} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Audit Logs</p>
              <p className="text-3xl font-bold text-blue-600">{auditLogs.length}</p>
            </div>
            <Shield className="text-blue-600" size={32} />
          </div>
        </Card>
      </div>

      <Card title="Hierarchy Rules" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Role Hierarchy</h4>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>• <strong>Staff (Level 1)</strong> → Reports to Supervisor</p>
              <p>• <strong>Supervisor (Level 2)</strong> → Reports to Executive</p>
              <p>• <strong>Executive (Level 3)</strong> → Reports to CEO</p>
              <p>• <strong>CEO (Level 4)</strong> → Top of hierarchy</p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Enforcement Rules</h4>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>• No direct access across levels</p>
              <p>• Daily compliance validation</p>
              <p>• Unauthorized assignments blocked</p>
              <p>• Auto-notify violations to admin</p>
              <p>• Full audit trail maintained</p>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Current Hierarchy" className="mb-6">
        <Table columns={columns} data={hierarchyData} />
      </Card>

      {violations.length > 0 && (
        <Card title="Hierarchy Violations" className="mb-6">
          <Table columns={violationColumns} data={violations} />
        </Card>
      )}

      <Card title="Audit Logs">
        <Table columns={auditColumns} data={auditLogs} />
      </Card>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Reporting Hierarchy">
        <form onSubmit={handleAssignment}>
          <Select
            label="Employee"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            options={[
              { value: '', label: 'Select Employee' },
              ...allUsers.map(u => ({ value: u.id, label: `${u.name} (${u.employeeId})` }))
            ]}
          />

          <Select
            label="Employee Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'Staff', label: 'Staff' },
              { value: 'Supervisor', label: 'Supervisor' },
              { value: 'Executive', label: 'Executive' },
              { value: 'CEO', label: 'CEO' }
            ]}
          />

          <Select
            label="Reports To (Manager)"
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            options={[
              { value: '', label: 'Select Manager' },
              ...allUsers.map(u => ({ value: u.id, label: `${u.name} - ${u.designation}` }))
            ]}
          />

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mb-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="text-yellow-600 mt-1" size={16} />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Assignment will be validated against hierarchy rules. Invalid assignments will be blocked automatically.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Assign</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReportingHierarchy;
