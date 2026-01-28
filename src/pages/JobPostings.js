import React, { useState } from 'react';
import { Card, Button } from '../components/UI';
import { Plus, Briefcase, MapPin, DollarSign, Calendar, Edit, Trash2, Eye } from 'lucide-react';
import { showToast } from '../utils/toast';
import { useConfirmDialog, confirmDelete } from '../components/ConfirmDialog';

const JobPostings = () => {
    const [jobs, setJobs] = useState([
        {
            id: '1',
            title: 'Senior Software Engineer',
            department: 'Engineering',
            location: 'Bangalore',
            type: 'Full-time',
            salary: { min: 1200000, max: 1800000 },
            status: 'Active',
            applicants: 45,
            postedDate: '2026-01-15',
            deadline: '2026-02-15',
        },
        {
            id: '2',
            title: 'HR Manager',
            department: 'Human Resources',
            location: 'Mumbai',
            type: 'Full-time',
            salary: { min: 800000, max: 1200000 },
            status: 'Active',
            applicants: 28,
            postedDate: '2026-01-20',
            deadline: '2026-02-20',
        },
    ]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const { showConfirm, ConfirmDialog } = useConfirmDialog();

    const handleDelete = async (job) => {
        const confirmed = await showConfirm(confirmDelete(`job posting "${job.title}"`));
        if (confirmed) {
            setJobs(jobs.filter((j) => j.id !== job.id));
            showToast.success('Job posting deleted successfully');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
            Closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return colors[status] || colors.Draft;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Job Postings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage job openings and track applications
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Job Posting
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Jobs</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {jobs.length}
                            </p>
                        </div>
                        <Briefcase className="w-8 h-8 text-blue-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {jobs.filter((j) => j.status === 'Active').length}
                            </p>
                        </div>
                        <Briefcase className="w-8 h-8 text-green-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Applicants</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {jobs.reduce((sum, j) => sum + j.applicants, 0)}
                            </p>
                        </div>
                        <Briefcase className="w-8 h-8 text-purple-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg per Job</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {Math.round(jobs.reduce((sum, j) => sum + j.applicants, 0) / jobs.length)}
                            </p>
                        </div>
                        <Briefcase className="w-8 h-8 text-orange-600" />
                    </div>
                </Card>
            </div>

            {/* Job Listings */}
            <div className="grid grid-cols-1 gap-4">
                {jobs.map((job) => (
                    <Card key={job.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                        {job.title}
                                    </h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                        {job.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <Briefcase className="w-4 h-4 mr-2" />
                                        {job.department}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        {job.location}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        ₹{(job.salary.min / 100000).toFixed(1)}L - ₹{(job.salary.max / 100000).toFixed(1)}L
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {job.applicants} Applicants
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Posted {new Date(job.postedDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 ml-4">
                                <button
                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                                    title="View Details"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                                <button
                                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Edit"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(job)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <ConfirmDialog />
        </div>
    );
};

export default JobPostings;
