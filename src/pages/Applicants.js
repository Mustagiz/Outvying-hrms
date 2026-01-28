import React, { useState } from 'react';
import { Card, Button } from '../components/UI';
import { Users, Filter, Download } from 'lucide-react';
import { showToast } from '../utils/toast';

const Applicants = () => {
    const [applicants, setApplicants] = useState([
        {
            id: '1',
            name: 'Rahul Sharma',
            email: 'rahul.sharma@email.com',
            phone: '+91 98765 43210',
            jobTitle: 'Senior Software Engineer',
            stage: 'Interview Scheduled',
            score: 85,
            appliedDate: '2026-01-16',
            resumeUrl: '#',
        },
        {
            id: '2',
            name: 'Priya Patel',
            email: 'priya.patel@email.com',
            phone: '+91 98765 43211',
            jobTitle: 'Senior Software Engineer',
            stage: 'Screening',
            score: 78,
            appliedDate: '2026-01-18',
            resumeUrl: '#',
        },
        {
            id: '3',
            name: 'Amit Kumar',
            email: 'amit.kumar@email.com',
            phone: '+91 98765 43212',
            jobTitle: 'HR Manager',
            stage: 'Applied',
            score: 72,
            appliedDate: '2026-01-21',
            resumeUrl: '#',
        },
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
                <Button variant="secondary">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                </Button>
            </div>

            {/* Pipeline Stats */}
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

                            <div className="ml-4">
                                <select
                                    value={applicant.stage}
                                    onChange={(e) => moveToStage(applicant.id, e.target.value)}
                                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                >
                                    {stages.map((stage) => (
                                        <option key={stage} value={stage}>{stage}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Applicants;
