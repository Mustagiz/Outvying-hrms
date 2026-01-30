import React, { useState, useMemo } from 'react';
import { Card, Button, Modal } from '../components/UI';
import { Users, Filter, Download, FileText, Plus } from 'lucide-react';
import { showToast } from '../utils/toast';

const Applicants = () => {
    const [applicants, setApplicants] = useState([
        { id: '1', name: 'Rahul Sharma', email: 'rahul.sharma@email.com', phone: '+91 98765 43210', jobTitle: 'Senior Software Engineer', stage: 'Interview Scheduled', score: 85, appliedDate: '2026-01-16', resumeUrl: '#' },
        { id: '2', name: 'Priya Patel', email: 'priya.patel@email.com', phone: '+91 98765 43211', jobTitle: 'Senior Software Engineer', stage: 'Screening', score: 78, appliedDate: '2026-01-18', resumeUrl: '#' },
        { id: '3', name: 'Amit Kumar', email: 'amit.kumar@email.com', phone: '+91 98765 43212', jobTitle: 'HR Manager', stage: 'Applied', score: 72, appliedDate: '2026-01-21', resumeUrl: '#' },
        { id: '4', name: 'Sneha Gupta', email: 'sneha.g@email.com', phone: '+91 98765 43213', jobTitle: 'Product Designer', stage: 'Applied', score: 65, appliedDate: '2026-01-22', resumeUrl: '#' },
        { id: '5', name: 'Vikram Singh', email: 'vikram.s@email.com', phone: '+91 98765 43214', jobTitle: 'Backend Developer', stage: 'Hired', score: 92, appliedDate: '2026-01-10', resumeUrl: '#' },
        { id: '6', name: 'Anjali Desai', email: 'anjali.d@email.com', phone: '+91 98765 43215', jobTitle: 'Frontend Developer', stage: 'Offer Extended', score: 88, appliedDate: '2026-01-12', resumeUrl: '#' },
        { id: '7', name: 'Rohan Mehta', email: 'rohan.m@email.com', phone: '+91 98765 43216', jobTitle: 'QA Engineer', stage: 'Interview Completed', score: 81, appliedDate: '2026-01-15', resumeUrl: '#' },
        { id: '8', name: 'Kavita Reddy', email: 'kavita.r@email.com', phone: '+91 98765 43217', jobTitle: 'HR Manager', stage: 'Screening', score: 70, appliedDate: '2026-01-20', resumeUrl: '#' },
        { id: '9', name: 'Mohit Verma', email: 'mohit.v@email.com', phone: '+91 98765 43218', jobTitle: 'Product Manager', stage: 'Rejected', score: 45, appliedDate: '2026-01-05', resumeUrl: '#' },
        { id: '10', name: 'Suresh Raina', email: 'suresh.r@email.com', phone: '+91 98765 43219', jobTitle: 'Senior Software Engineer', stage: 'Applied', score: 60, appliedDate: '2026-01-23', resumeUrl: '#' },
    ]);

    const [selectedStage, setSelectedStage] = useState('all');

    const stages = [
        'Applied',
        'Screening',
        'Interview Scheduled',
        'Interview Completed',
        'Offer Extended',
        'Hired',
        'Rejected',
    ];

    // Funnel Logic
    const funnelStats = useMemo(() => {
        const total = applicants.length;
        if (total === 0) return [];

        const getCount = (stage) => applicants.filter(a => a.stage === stage).length;

        // Cumulative counts for funnel (approximation for demo)
        // In reality, funnel requires history tracking. Here we group logical steps.
        const applied = total;
        const passedScreening = applicants.filter(a => ['Screening', 'Interview Scheduled', 'Interview Completed', 'Offer Extended', 'Hired'].includes(a.stage)).length;
        const interview = applicants.filter(a => ['Interview Scheduled', 'Interview Completed', 'Offer Extended', 'Hired'].includes(a.stage)).length;
        const offer = applicants.filter(a => ['Offer Extended', 'Hired'].includes(a.stage)).length;
        const hired = applicants.filter(a => ['Hired'].includes(a.stage)).length;

        return [
            { label: 'Applied', count: applied, color: 'bg-blue-500' },
            { label: 'Screening', count: passedScreening, color: 'bg-yellow-500' },
            { label: 'Interview', count: interview, color: 'bg-purple-500' },
            { label: 'Offer', count: offer, color: 'bg-green-500' },
            { label: 'Hired', count: hired, color: 'bg-green-700' },
        ];
    }, [applicants]);

    const getStageColor = (stage) => {
        const colors = {
            'Applied': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            'Screening': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            'Interview Scheduled': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            'Interview Completed': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
            'Offer Extended': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'Hired': 'bg-green-600 text-white',
            'Rejected': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return colors[stage] || colors.Applied;
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const filteredApplicants = selectedStage === 'all'
        ? applicants
        : applicants.filter((a) => a.stage === selectedStage);

    const [showAddModal, setShowAddModal] = useState(false);
    const [newCandidate, setNewCandidate] = useState({
        name: '',
        email: '',
        phone: '',
        jobTitle: '',
        stage: 'Applied'
    });

    const handleAddCandidate = () => {
        if (!newCandidate.name || !newCandidate.email || !newCandidate.jobTitle) {
            showToast.error("Please fill in all required fields");
            return;
        }

        const candidate = {
            id: Date.now().toString(),
            ...newCandidate,
            score: 0, // Default score
            appliedDate: new Date().toISOString().split('T')[0],
            resumeUrl: '#'
        };

        setApplicants([candidate, ...applicants]);
        setShowAddModal(false);
        setNewCandidate({ name: '', email: '', phone: '', jobTitle: '', stage: 'Applied' });
        showToast.success("Candidate added successfully");
    };

    const moveToStage = (applicantId, newStage) => {
        setApplicants(applicants.map((a) =>
            a.id === applicantId ? { ...a, stage: newStage } : a
        ));
        showToast.success(`Applicant moved to ${newStage}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Applicant Tracking
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage candidates through the recruitment pipeline
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                        <Plus size={18} /> Add Candidate
                    </Button>
                    <Button variant="secondary">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Funnel Analytics */}
                <Card className="lg:col-span-2 p-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Users size={18} className="text-primary-600" /> Hiring Funnel
                    </h3>
                    <div className="space-y-4">
                        {funnelStats.map((step, index) => {
                            const percentage = ((step.count / applicants.length) * 100).toFixed(0);
                            const prevCount = index > 0 ? funnelStats[index - 1].count : step.count;
                            const conversion = index > 0 ? ((step.count / prevCount) * 100).toFixed(0) : 100;

                            return (
                                <div key={step.label} className="relative">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{step.label}</span>
                                        <div className="text-right">
                                            <span className="font-bold text-gray-900 dark:text-white">{step.count}</span>
                                            <span className="text-xs text-gray-500 ml-1">
                                                ({index === 0 ? 'Total' : `${conversion}% conv.`})
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${step.color} transition-all duration-500 ease-out`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Quick Stats */}
                <div className="space-y-4">
                    <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-100">
                        <p className="text-sm text-blue-600 dark:text-blue-400">Total Candidates</p>
                        <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{applicants.length}</p>
                    </Card>
                    <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-100">
                        <p className="text-sm text-green-600 dark:text-green-400">Hired This Month</p>
                        <p className="text-3xl font-bold text-green-800 dark:text-green-200">{applicants.filter(a => a.stage === 'Hired').length}</p>
                    </Card>
                    <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-100">
                        <p className="text-sm text-red-600 dark:text-red-400">Rejection Rate</p>
                        <p className="text-3xl font-bold text-red-800 dark:text-red-200">
                            {((applicants.filter(a => a.stage === 'Rejected').length / applicants.length) * 100).toFixed(0)}%
                        </p>
                    </Card>
                </div>
            </div>

            {/* Pipeline Stats (Existing but tweaked layout) */}
            <h3 className="font-bold text-gray-800 dark:text-white mt-4">Pipeline Stages</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {stages.map((stage) => {
                    const count = applicants.filter((a) => a.stage === stage).length;
                    return (
                        <Card
                            key={stage}
                            className={`p-4 cursor-pointer transition-all ${selectedStage === stage ? 'ring-2 ring-primary-600' : ''
                                }`}
                            onClick={() => setSelectedStage(stage)}
                        >
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{stage}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                        </Card>
                    );
                })}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    <option value="all">All Stages</option>
                    {stages.map((stage) => (
                        <option key={stage} value={stage}>{stage}</option>
                    ))}
                </select>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredApplicants.length} of {applicants.length} applicants
                </span>
            </div>

            {/* Applicant List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredApplicants.map((applicant) => (
                    <Card key={applicant.id} className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                        <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                                            {applicant.name.split(' ').map((n) => n[0]).join('')}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {applicant.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {applicant.jobTitle}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                                        <p className="text-sm text-gray-900 dark:text-white">{applicant.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                                        <p className="text-sm text-gray-900 dark:text-white">{applicant.phone}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Applied</p>
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {new Date(applicant.appliedDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(applicant.stage)}`}>
                                        {applicant.stage}
                                    </span>
                                    <span className={`text-sm font-semibold ${getScoreColor(applicant.score)}`}>
                                        Score: {applicant.score}/100
                                    </span>
                                    <a
                                        href={applicant.resumeUrl}
                                        className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                    >
                                        View Resume
                                    </a>
                                </div>
                            </div>

                            <div className="ml-4 flex flex-col gap-2">
                                <select
                                    value={applicant.stage}
                                    onChange={(e) => moveToStage(applicant.id, e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm w-full"
                                >
                                    {stages.map((stage) => (
                                        <option key={stage} value={stage}>{stage}</option>
                                    ))}
                                </select>
                                {(applicant.stage === 'Interview Completed' || applicant.stage === 'Offer Extended') && (
                                    <Button
                                        size="sm"
                                        onClick={() => window.location.href = `/offer-letters?candidate=${encodeURIComponent(applicant.name)}&email=${encodeURIComponent(applicant.email)}&role=${encodeURIComponent(applicant.jobTitle)}`}
                                        className="w-full flex items-center justify-center gap-1"
                                    >
                                        <FileText size={14} /> Generate Offer
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Add Candidate Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Candidate">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
                        <input
                            type="text"
                            value={newCandidate.name}
                            onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                        <input
                            type="email"
                            value={newCandidate.email}
                            onChange={e => setNewCandidate({ ...newCandidate, email: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="john@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                        <input
                            type="text"
                            value={newCandidate.phone}
                            onChange={e => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="+1 234 567 890"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title *</label>
                        <input
                            type="text"
                            value={newCandidate.jobTitle}
                            onChange={e => setNewCandidate({ ...newCandidate, jobTitle: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Software Engineer"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Initial Stage</label>
                        <select
                            value={newCandidate.stage}
                            onChange={e => setNewCandidate({ ...newCandidate, stage: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleAddCandidate}>Add Candidate</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Applicants;
