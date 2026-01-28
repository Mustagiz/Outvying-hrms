import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    PlayCircle,
    CheckCircle,
    Lock,
    FileText,
    Download,
    Clock,
    Award,
    Share2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, ProgressBar } from '../components/UI'; // Assuming UI kit
import { useAuth } from '../context/AuthContext';

// Mock Data (In a real app, fetch from Firestore)
const COURSE_DATA = {
    id: 'c1',
    title: 'Company Culture & Values',
    description: 'Deep dive into what makes Outvying unique. Learn about our core values, mission, and how we operate as a team.',
    instructor: 'Sarah Connor (HR Director)',
    duration: '45 min',
    modules: [
        { id: 1, title: 'Welcome to Outvying', duration: '5:00', type: 'video', status: 'completed' },
        { id: 2, title: 'Our Core Values', duration: '12:30', type: 'video', status: 'completed' },
        { id: 3, title: 'Communication Guidelines', duration: '15:00', type: 'reading', status: 'in-progress' },
        { id: 4, title: 'Diversity & Inclusion', duration: '10:00', type: 'video', status: 'locked' },
        { id: 5, title: 'Final Quiz', duration: '10:00', type: 'quiz', status: 'locked' }
    ]
};

const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [activeModule, setActiveModule] = useState(COURSE_DATA.modules[2]); // Default to first uncompleted

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Back Navigation */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
            >
                <ArrowLeft size={18} /> Back to Courses
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Video Player / Content Viewer */}
                    <div className="bg-black rounded-3xl overflow-hidden aspect-video relative group shadow-2xl">
                        {activeModule.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                <PlayCircle size={64} className="text-white opacity-80 group-hover:scale-110 transition-transform cursor-pointer" />
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-8 text-center">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4 text-blue-600">
                                    <FileText size={48} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{activeModule.title}</h3>
                                <p className="text-gray-500 max-w-md">This is a reading module. Click 'Mark as Complete' when you finish reading the attached material.</p>
                                <Button className="mt-6">View Document</Button>
                            </div>
                        )}
                    </div>

                    {/* Course Info */}
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{COURSE_DATA.title}</h1>
                                <p className="text-gray-500 font-medium">Instructor: <span className="text-blue-600">{COURSE_DATA.instructor}</span></p>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                    <Share2 size={20} />
                                </button>
                                <Button variant="outline" className="gap-2">
                                    <Download size={18} /> Resources
                                </Button>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {COURSE_DATA.description}
                        </p>
                    </div>
                </div>

                {/* Sidebar: Curriculum */}
                <div className="space-y-6">
                    <Card className="border-gray-100 dark:border-gray-700/50 shadow-lg rounded-[2rem] p-6 h-fit">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-blue-500" />
                            Course Content
                        </h3>

                        {/* Progress */}
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                                <span className="text-gray-500">Progress</span>
                                <span className="text-blue-600">45%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 w-[45%]" />
                            </div>
                        </div>

                        {/* Module List */}
                        <div className="space-y-2">
                            {COURSE_DATA.modules.map((module, idx) => (
                                <button
                                    key={module.id}
                                    onClick={() => module.status !== 'locked' && setActiveModule(module)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all text-left group ${activeModule.id === module.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                                        } ${module.status === 'locked' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                            w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2
                                            ${module.status === 'completed'
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : activeModule.id === module.id
                                                    ? 'bg-white text-blue-600 border-white'
                                                    : 'border-gray-300 text-gray-400'
                                            }
                                        `}>
                                            {module.status === 'completed' ? <CheckCircle size={14} /> : idx + 1}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${activeModule.id === module.id ? 'text-white' : ''}`}>
                                                {module.title}
                                            </p>
                                            <p className={`text-[10px] font-medium opacity-70 flex items-center gap-1 ${activeModule.id === module.id ? 'text-blue-100' : ''}`}>
                                                {module.type === 'video' ? <PlayCircle size={10} /> : <FileText size={10} />}
                                                {module.duration}
                                            </p>
                                        </div>
                                    </div>
                                    {module.status === 'locked' && <Lock size={16} className="text-gray-400" />}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl text-yellow-700 dark:text-yellow-400 text-xs font-bold">
                                <Award size={18} />
                                <span>Complete all modules to earn your certificate!</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;
