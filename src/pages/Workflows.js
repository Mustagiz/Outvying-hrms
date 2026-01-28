/**
 * Workflows Page (Onboarding & Offboarding)
 * Manages employee transitions with step-by-step progress tracking
 */

import React, { useState } from 'react';
import {
    UserPlus,
    UserMinus,
    CheckCircle2,
    Circle,
    Clock,
    ChevronRight,
    Mail,
    Laptop,
    Key,
    FileText,
    TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

const Workflows = () => {
    const [activeTab, setActiveTab] = useState('onboarding');
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);

    const workflows = {
        onboarding: [
            {
                id: 1,
                name: 'Anjali Sharma',
                role: 'Senior Developer',
                dept: 'Engineering',
                startDate: '2026-02-01',
                progress: 60,
                steps: [
                    { id: 1, title: 'Document Verification', status: 'completed', icon: FileText },
                    { id: 2, title: 'Hardware Assignment', status: 'completed', icon: Laptop },
                    { id: 3, title: 'IT Systems Access', status: 'in-progress', icon: Key },
                    { id: 4, title: 'Welcome Email Sent', status: 'pending', icon: Mail },
                    { id: 5, title: 'First Day Orientation', status: 'pending', icon: Clock }
                ]
            },
            {
                id: 2,
                name: 'Rahul Varma',
                role: 'HR Executive',
                dept: 'Human Resources',
                startDate: '2026-02-05',
                progress: 20,
                steps: [
                    { id: 1, title: 'Document Verification', status: 'completed', icon: FileText },
                    { id: 2, title: 'Hardware Assignment', status: 'pending', icon: Laptop },
                    { id: 3, title: 'IT Systems Access', status: 'pending', icon: Key }
                ]
            }
        ],
        offboarding: [
            {
                id: 3,
                name: 'Vikram Singh',
                role: 'Tech Lead',
                dept: 'Engineering',
                endDate: '2026-01-31',
                progress: 80,
                steps: [
                    { id: 1, title: 'Resignation Submission', status: 'completed', icon: FileText },
                    { id: 2, title: 'Exit Interview', status: 'completed', icon: UserMinus },
                    { id: 3, title: 'Asset Return', status: 'completed', icon: Laptop },
                    { id: 4, title: 'Access Revocation', status: 'in-progress', icon: Key },
                    { id: 5, title: 'Full & Final Settlement', status: 'pending', icon: TrendingUp }
                ]
            }
        ]
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'in-progress': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status]}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transitions & Workflows</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage automated onboarding and offboarding tasks</p>
                </div>
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('onboarding')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'onboarding' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600' : 'text-gray-500'
                            }`}
                    >
                        Onboarding
                    </button>
                    <button
                        onClick={() => setActiveTab('offboarding')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'offboarding' ? 'bg-white dark:bg-gray-700 shadow-sm text-red-600' : 'text-gray-500'
                            }`}
                    >
                        Offboarding
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Lists */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest pl-1">
                        Active {activeTab === 'onboarding' ? 'New Hires' : 'Departures'}
                    </h3>
                    {workflows[activeTab].map((wf) => (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={wf.id}
                            onClick={() => setSelectedWorkflow(wf)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedWorkflow?.id === wf.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 hover:shadow-lg'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-2 rounded-xl ${activeTab === 'onboarding' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {activeTab === 'onboarding' ? <UserPlus size={20} /> : <UserMinus size={20} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{wf.name}</h4>
                                    <p className="text-xs text-gray-500">{wf.role} • {wf.dept}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Task Progress</span>
                                    <span className="font-bold text-blue-600">{wf.progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${activeTab === 'onboarding' ? 'bg-green-500' : 'bg-red-500'}`}
                                        style={{ width: `${wf.progress}%` }}
                                    />
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </div>

                {/* Workflow Detail */}
                <div className="lg:col-span-2">
                    {selectedWorkflow ? (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Workflow Timeline</h2>
                                    <button className="text-blue-600 text-sm font-bold hover:underline">Add Custom Step</button>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 flex items-center gap-3">
                                        <Clock className="text-blue-500" size={24} />
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Start Date</p>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">{selectedWorkflow.startDate || selectedWorkflow.endDate}</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 bg-white dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 flex items-center gap-3">
                                        <CheckCircle2 className="text-green-500" size={24} />
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Completed</p>
                                            <p className="font-bold text-sm text-gray-900 dark:text-white">
                                                {selectedWorkflow.steps.filter(s => s.status === 'completed').length} / {selectedWorkflow.steps.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="relative">
                                    {/* Timeline Line */}
                                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-100 dark:bg-gray-700" />

                                    <div className="space-y-8 relative">
                                        {selectedWorkflow.steps.map((step, index) => {
                                            const Icon = step.icon;
                                            return (
                                                <div key={step.id} className="flex items-center gap-6">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center z-10 border-4 border-white dark:border-gray-800 ${step.status === 'completed' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' :
                                                            step.status === 'in-progress' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' :
                                                                'bg-gray-200 dark:bg-gray-700 text-gray-400'
                                                        }`}>
                                                        {step.status === 'completed' ? <CheckCircle2 size={24} /> : <Icon size={24} />}
                                                    </div>
                                                    <div className="flex-1 p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h5 className={`font-bold ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                                    {step.title}
                                                                </h5>
                                                                <p className="text-xs text-gray-500">Automated task triggered by system</p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <StatusBadge status={step.status} />
                                                                <ChevronRight size={16} className="text-gray-300" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                                    <button className={`w-full py-4 rounded-xl font-bold text-white transition-all transform hover:scale-[1.01] active:scale-95 shadow-lg ${activeTab === 'onboarding' ? 'bg-green-600 shadow-green-600/20' : 'bg-red-600 shadow-red-600/20'
                                        }`}>
                                        Complete Workflow
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-[400px] bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center p-8">
                            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-full mb-4">
                                <CheckCircle2 size={48} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select a Workflow</h3>
                            <p className="text-gray-500 text-sm max-w-[280px]">Choose a team member to see their transition progress and pending tasks.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Workflows;
