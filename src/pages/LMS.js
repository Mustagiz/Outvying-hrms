/**
 * Learning Management System (LMS)
 * Central hub for courses, training tracking, and certifications
 */
import React, { useState, useMemo } from 'react';
import {
    BookOpen,
    PlayCircle,
    Award,
    CheckCircle,
    Clock,
    Search,
    Filter,
    MoreVertical,
    BarChart2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AnimatedCard } from '../components/AnimatedCard'; // Assuming we have this
import { Button, Card, Badge, ProgressBar } from '../components/UI'; // Assuming UI kit

// Mock Data for MVP
const MOCK_COURSES = [
    {
        id: 'c1',
        title: 'Company Culture & Values',
        category: 'Onboarding',
        duration: '45 min',
        modules: 12,
        progress: 100,
        status: 'Completed',
        thumbnail: 'bg-gradient-to-br from-purple-500 to-indigo-600',
        author: 'HR Dept'
    },
    {
        id: 'c2',
        title: 'Cybersecurity Awareness 2026',
        category: 'Compliance',
        duration: '1h 30m',
        modules: 8,
        progress: 35,
        status: 'In Progress',
        thumbnail: 'bg-gradient-to-br from-blue-500 to-cyan-500',
        author: 'IT Security'
    },
    {
        id: 'c3',
        title: 'Advanced React Patterns',
        category: 'Technical',
        duration: '4h',
        modules: 24,
        progress: 0,
        status: 'Not Started',
        thumbnail: 'bg-gradient-to-br from-gray-700 to-gray-900',
        author: 'Engineering'
    },
    {
        id: 'c4',
        title: 'Effective Leadership',
        category: 'Soft Skills',
        duration: '2h 15m',
        modules: 15,
        progress: 0,
        status: 'Locked',
        thumbnail: 'bg-gradient-to-br from-orange-400 to-red-500',
        author: 'L&D Team'
    }
];

const LMS = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('All');
    const [selectedCourse, setSelectedCourse] = useState(null);

    const filteredCourses = useMemo(() => {
        return MOCK_COURSES.filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filter === 'All' || course.status === filter;
            return matchesSearch && matchesFilter;
        });
    }, [searchTerm, filter]);

    const stats = [
        { label: 'Courses Completed', value: '12', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
        { label: 'Learning Hours', value: '48h', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100' },
        { label: 'Certificates', value: '5', icon: Award, color: 'text-yellow-500', bg: 'bg-yellow-100' },
        { label: 'Avg. Score', value: '94%', icon: BarChart2, color: 'text-purple-500', bg: 'bg-purple-100' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <BookOpen className="text-blue-600" size={32} />
                        Learning Center
                    </h1>
                    <p className="text-gray-500 mt-1">Upgrade your skills and track your professional growth.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30">
                    Browse All Courses
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center gap-4"
                    >
                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                            <h4 className="text-xl font-black text-gray-900 dark:text-white">{stat.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-2xl flex-1 max-w-md">
                    <Search className="text-gray-400 ml-2" size={20} />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        className="bg-transparent border-none outline-none text-sm w-full text-gray-900 dark:text-white font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['All', 'In Progress', 'Not Started', 'Completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === f
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                    {filteredCourses.map((course, idx) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.05 }}
                            layout
                        >
                            <div
                                onClick={() => navigate(`/lms/${course.id}`)}
                                className="group bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all overflow-hidden h-full flex flex-col cursor-pointer"
                            >
                                {/* Thumbnail */}
                                <div className={`h-40 ${course.thumbnail} relative p-4 flex flex-col justify-between`}>
                                    <div className="flex justify-between items-start">
                                        <span className="bg-black/20 backdrop-blur-md text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border border-white/10">
                                            {course.category}
                                        </span>
                                        {course.status === 'Completed' && (
                                            <div className="bg-green-500 text-white p-1 rounded-full shadow-lg">
                                                <CheckCircle size={14} fill="currentColor" className="text-green-500 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-black/40 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                                        <h3 className="text-white font-bold leading-tight line-clamp-2">{course.title}</h3>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col gap-4">
                                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                                        <span className="flex items-center gap-1"><Clock size={14} /> {course.duration}</span>
                                        <span className="flex items-center gap-1"><BookOpen size={14} /> {course.modules} Modules</span>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-2 mt-auto">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                                            <span className={course.progress === 100 ? 'text-green-500' : 'text-blue-500'}>
                                                {course.status}
                                            </span>
                                            <span className="text-gray-400">{course.progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${course.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${course.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        className="w-full text-xs py-2 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 group-hover:border-blue-200"
                                    >
                                        {course.status === 'Not Started' ? 'Start Learning' : 'Continue'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LMS;
