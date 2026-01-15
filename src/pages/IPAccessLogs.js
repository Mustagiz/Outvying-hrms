import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Table, Badge, Pagination } from '../components/UI';
import { formatDate } from '../utils/helpers';
import { CheckCircle, XCircle } from 'lucide-react';

const IPAccessLogs = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const storedLogs = JSON.parse(localStorage.getItem('ipAccessLogs') || '[]');
    setLogs(storedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
  }, []);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return logs.slice(startIndex, startIndex + itemsPerPage);
  }, [logs, currentPage]);

  const totalPages = Math.ceil(logs.length / itemsPerPage);

  const columns = [
    { header: 'Employee', accessor: 'employeeName' },
    { header: 'Date', accessor: 'timestamp', render: (row) => formatDate(row.timestamp) },
    { header: 'Action', accessor: 'action' },
    { header: 'IP Address', accessor: 'ipAddress', render: (row) => <span className="font-mono text-sm">{row.ipAddress}</span> },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (row) => (
        <Badge variant={row.status === 'Allowed' ? 'success' : 'danger'}>
          {row.status === 'Allowed' ? <CheckCircle size={14} className="inline mr-1" /> : <XCircle size={14} className="inline mr-1" />}
          {row.status}
        </Badge>
      )
    },
    { header: 'Location', accessor: 'location' }
  ];

  if (currentUser.role !== 'Admin' && currentUser.role !== 'admin') {
    return <div className="text-center py-8 text-gray-600 dark:text-gray-400">Access denied. Admin only.</div>;
  }

  const stats = {
    total: logs.length,
    allowed: logs.filter(l => l.status === 'Allowed').length,
    blocked: logs.filter(l => l.status === 'Blocked').length
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">IP Access Logs</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Attempts</h3>
          <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Allowed</h3>
          <p className="text-3xl font-bold text-green-600">{stats.allowed}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Blocked</h3>
          <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
        </Card>
      </div>

      <Card title="Access History">
        <Table columns={columns} data={paginatedLogs} />
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>
    </div>
  );
};

export default IPAccessLogs;
