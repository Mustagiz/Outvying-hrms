import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Table, Modal, Input, Select, Alert, Badge } from '../components/UI';
import { TrendingUp, Award, MessageSquare, Plus, Search, ChevronRight, Star, Target, ShieldCheck } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp, where, orderBy } from 'firebase/firestore';

const PerformanceManagement = () => {
    const { currentUser, allUsers } = useAuth();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [alert, setAlert] = useState(null);

    const [formData, setFormData] = useState({
        employeeId: '',
        technical: 3,
        communication: 3,
        punctuality: 3,
        teamwork: 3,
        leadership: 3,
        overallComments: '',
        goals: ''
    });

    useEffect(() => {
        const q = currentUser.role === 'employee'
            ? query(collection(db, 'performanceReviews'), where('employeeId', '==', currentUser.id), orderBy('createdAt', 'desc'))
            : query(collection(db, 'performanceReviews'), orderBy('createdAt', 'desc'));

        const unsub = onSnapshot(q, (snapshot) => {
            setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, [currentUser]);

    const calculateAverage = (r) => {
        const scores = [r.technical, r.communication, r.punctuality, r.teamwork, r.leadership];
        return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.employeeId) {
            setAlert({ type: 'error', message: 'Please select an employee' });
            return;
        }

        try {
            const targetEmp = allUsers.find(u => u.id === formData.employeeId);
            await addDoc(collection(db, 'performanceReviews'), {
                ...formData,
                employeeName: targetEmp?.name || 'Unknown',
                reviewerId: currentUser.id,
                reviewerName: currentUser.name,
                status: 'Submitted',
                createdAt: serverTimestamp()
            });

            setAlert({ type: 'success', message: 'Performance review submitted successfully' });
            setShowModal(false);
            setFormData({
                employeeId: '',
                technical: 3,
                communication: 3,
                punctuality: 3,
                teamwork: 3,
                leadership: 3,
                overallComments: '',
                goals: ''
            });

            // Trigger notification
            // await createNotification({ userId: formData.employeeId, ... })
        } catch (err) {
            setAlert({ type: 'error', message: 'Failed to submit review' });
        }
    };

    const columns = [
        { header: 'Employee', accessor: 'employeeName' },
        { header: 'Review Date', render: (row) => row.createdAt?.toDate().toLocaleDateString() || 'Just now' },
        { header: 'Reviewer', accessor: 'reviewerName' },
        {
            header: 'Score',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-bold">{calculateAverage(row)}/5</span>
                </div>
            )
        },
        {
            header: 'Status',
            render: (row) => (
                <Badge variant={row.status === 'Submitted' ? 'success' : 'secondary'}>{row.status}</Badge>
            )
        },
        {
            header: 'Actions',
            render: (row) => (
                <Button variant="secondary" className="text-xs px-2 py-1">View Details</Button>
            )
        }
    ];

    if (loading) return <div className="p-8 text-center animate-pulse text-gray-400">Loading performance data...</div>;

    const stats = {
        totalReviews: reviews.length,
        avgScore: (reviews.reduce((acc, r) => acc + parseFloat(calculateAverage(r)), 0) / (reviews.length || 1)).toFixed(1),
        topPerformer: reviews.sort((a, b) => calculateAverage(b) - calculateAverage(a))[0]?.employeeName || 'N/A'
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-widest mb-1">
                        <TrendingUp size={14} /> Growth & Excellence
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Performance <span className="text-primary-600">Management</span></h1>
                    <p className="text-gray-400 text-sm mt-1 italic">Nurturing talent through structured feedback and KPIs.</p>
                </div>
                {currentUser.role !== 'employee' && (
                    <Button onClick={() => setShowModal(true)} className="shadow-xl shadow-primary-500/20 px-8 py-3 rounded-2xl">
                        <Plus size={18} className="mr-2" /> Initiate Review
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-primary-500 to-indigo-600 text-white border-none shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <Award size={32} className="opacity-80" />
                        <span className="text-[10px] bg-white/20 px-2 py-1 rounded-full font-bold uppercase tracking-widest">Global Stats</span>
                    </div>
                    <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Average Organization Score</p>
                    <h2 className="text-4xl font-black mb-1">{stats.avgScore} <span className="text-lg opacity-60">/ 5.0</span></h2>
                    <div className="h-1.5 w-full bg-white/20 rounded-full mt-4">
                        <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${(stats.avgScore / 5) * 100}%` }}></div>
                    </div>
                </Card>

                <Card className="border-none shadow-lg bg-emerald-50 border-emerald-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                            <Star size={20} />
                        </div>
                        <h4 className="font-bold text-emerald-900 uppercase text-xs tracking-widest">Top Performer</h4>
                    </div>
                    <h2 className="text-2xl font-black text-emerald-900">{stats.topPerformer}</h2>
                    <p className="text-xs text-emerald-700/60 mt-1">Based on recent evaluations</p>
                </Card>

                <Card className="border-none shadow-lg bg-blue-50 border-blue-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <MessageSquare size={20} />
                        </div>
                        <h4 className="font-bold text-blue-900 uppercase text-xs tracking-widest">Active Reviews</h4>
                    </div>
                    <h2 className="text-2xl font-black text-blue-900">{stats.totalReviews}</h2>
                    <p className="text-xs text-blue-700/60 mt-1">All-time evaluations recorded</p>
                </Card>
            </div>

            <Card title="Review History" className="shadow-xl border-none">
                <Table columns={columns} data={reviews} />
            </Card>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Performance Evaluation" size="lg">
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <Select
                            label="Select Employee"
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            options={[
                                { value: '', label: 'Select...' },
                                ...allUsers.filter(u => u.role === 'employee').map(u => ({ value: u.id, label: `${u.name} (${u.employeeId})` }))
                            ]}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { key: 'technical', label: 'Technical Proficiency', icon: <ShieldCheck size={16} /> },
                            { key: 'communication', label: 'Communication Skills', icon: <MessageSquare size={16} /> },
                            { key: 'punctuality', label: 'Punctuality & Discipline', icon: <Target size={16} /> },
                            { key: 'teamwork', label: 'Collaboration & Teamwork', icon: <Users size={16} /> },
                            { key: 'leadership', label: 'Leadership Qualities', icon: <Award size={16} /> }
                        ].map((kpi) => (
                            <div key={kpi.key} className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {kpi.icon} {kpi.label}
                                </label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                        <button
                                            key={rating}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, [kpi.key]: rating })}
                                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${formData[kpi.key] === rating
                                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                                                    : 'bg-white border border-gray-200 text-gray-400 hover:border-primary-300'
                                                }`}
                                        >
                                            {rating}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Detailed Feedback</label>
                            <textarea
                                value={formData.overallComments}
                                onChange={(e) => setFormData({ ...formData, overallComments: e.target.value })}
                                className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                rows="3"
                                placeholder="What went well? What needs improvement?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Goals for Next Quarter</label>
                            <textarea
                                value={formData.goals}
                                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                                className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                rows="2"
                                placeholder="Specific, Measurable, Achievable goals..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 border-t mt-4 pb-2">
                        <Button variant="secondary" onClick={() => setShowModal(false)} type="button" className="flex-1">Discard</Button>
                        <Button type="submit" className="flex-1 shadow-lg shadow-primary-500/20">Submit Evaluation</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const Users = ({ size }) => <Plus size={size} />; // Fallback for missing icon in previous map

export default PerformanceManagement;
