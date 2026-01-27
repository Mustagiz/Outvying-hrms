import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Table, Button, Input, Select, Badge, Pagination } from '../components/UI';
import { formatDate, exportToCSV } from '../utils/helpers';
import { Search, Filter, Clock, User, Shield, Info, Download } from 'lucide-react';

import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const AuditLogs = () => {
    const { allUsers } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLogs(logsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchSearch =
                (log.targetName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.action || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.performedBy?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchCategory = categoryFilter === 'all' || log.category === categoryFilter;

            return matchSearch && matchCategory;
        });
    }, [logs, searchTerm, categoryFilter]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    const getActionColor = (action) => {
        if (action.includes('CREATE')) return 'bg-green-100 text-green-700';
        if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
        if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-700';
        if (action.includes('RESET')) return 'bg-yellow-100 text-yellow-700';
        return 'bg-gray-100 text-gray-700';
    };

    const columns = [
        {
            header: 'Timestamp',
            accessor: 'timestamp',
            render: (row) => (
                <div className="flex items-center gap-2 text-xs">
                    <Clock size={12} className="text-gray-400" />
                    {row.timestamp?.seconds ? new Date(row.timestamp.seconds * 1000).toLocaleString() : 'Just now'}
                </div>
            )
        },
        {
            header: 'Actor',
            accessor: 'performedBy',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-[10px] font-bold">
                        {row.performedBy?.name?.charAt(0) || <User size={12} />}
                    </div>
                    <span className="font-medium">{row.performedBy?.name || 'System'}</span>
                </div>
            )
        },
        {
            header: 'Action',
            accessor: 'action',
            render: (row) => (
                <Badge className={`font-mono text-[10px] ${getActionColor(row.action)}`}>
                    {row.action}
                </Badge>
            )
        },
        {
            header: 'Target',
            accessor: 'targetName',
            render: (row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{row.targetName || 'N/A'}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{row.targetId}</span>
                </div>
            )
        },
        {
            header: 'Category',
            accessor: 'category',
            render: (row) => (
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider bg-gray-50 px-2 py-0.5 rounded">
                    {row.category}
                </span>
            )
        },
        {
            header: 'Details',
            accessor: 'details',
            render: (row) => (
                <div className="max-w-xs truncate text-[11px] text-gray-500 italic">
                    {JSON.stringify(row.details).replace(/[{}"]/g, ' ')}
                </div>
            )
        }
    ];

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/30">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-[0.2em] mb-1">
                    <Shield size={14} /> Security & Auditing
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">System <span className="text-primary-600">Audit Logs</span></h1>
                <p className="text-gray-400 text-sm mt-1">Full transparent history of all administrative actions and security events.</p>
            </div>

            <Card className="border-none shadow-xl shadow-gray-200/50">
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            placeholder="Find actions by actor, target, or event..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-transparent focus:border-primary-200 focus:bg-white rounded-2xl outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-gray-400" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="px-4 py-3 bg-gray-50/50 border border-transparent focus:border-primary-200 focus:bg-white rounded-2xl outline-none transition-all text-sm font-medium"
                        >
                            <option value="all">All Categories</option>
                            <option value="EMPLOYEE">Employee</option>
                            <option value="PAYROLL">Payroll</option>
                            <option value="ATTENDANCE">Attendance</option>
                            <option value="LEAVE">Leave</option>
                            <option value="SECURITY">Security</option>
                        </select>
                    </div>

                    <Button
                        onClick={() => {
                            const csvData = filteredLogs.map(log => ({
                                'Timestamp': log.timestamp?.seconds ? new Date(log.timestamp.seconds * 1000).toLocaleString() : 'N/A',
                                'Category': log.category,
                                'Action': log.action,
                                'Actor': log.performedBy?.name || 'System',
                                'Target': log.targetName || 'N/A',
                                'Target ID': log.targetId || 'N/A',
                                'Details': JSON.stringify(log.details)
                            }));
                            exportToCSV(csvData, 'system_audit_logs');
                        }}
                        variant="secondary"
                        className="flex items-center gap-2"
                    >
                        <Download size={16} /> Export Logs
                    </Button>
                </div >


                {
                    loading ? (
                        <div className="flex items-center justify-center py-20" >
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                            <span className="ml-3 text-gray-500 font-medium">Loading history...</span>
                        </div>
                    ) : (
                        <>
                            <Table columns={columns} data={paginatedLogs} />
                            {totalPages > 1 && (
                                <div className="mt-8 flex justify-center">
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
            </Card >

            <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-[2rem] border border-primary-100 dark:border-primary-900/30 flex items-start gap-3">
                <Info className="text-primary-600 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-primary-700 dark:text-primary-400 leading-relaxed">
                    Audit logs are strictly read-only and immutable. These records are retained for historical accountability and cannot be deleted or modified by any user role.
                </p>
            </div>
        </div >
    );
};

export default AuditLogs;
