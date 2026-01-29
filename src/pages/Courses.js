import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/UI';
import { Plus, GraduationCap, Users, Clock, Award } from 'lucide-react';
import { showToast } from '../utils/toast';

const Courses = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([
        {
            id: '1',
            title: 'Leadership Development Program',
            category: 'Leadership',
            instructor: 'Dr. Rajesh Kumar',
            duration: 40, // hours
            capacity: 30,
            enrolled: 24,
            schedule: {
                startDate: '2026-02-01',
                endDate: '2026-03-15',
            },
            status: 'Active',
            description: 'Comprehensive leadership training for managers and team leads',
        },
        {
            id: '2',
            title: 'Advanced Excel & Data Analysis',
            category: 'Technical Skills',
            instructor: 'Priya Sharma',
            duration: 20,
            capacity: 25,
            enrolled: 18,
            schedule: {
                startDate: '2026-02-10',
                endDate: '2026-02-28',
            },
            status: 'Active',
            description: 'Master Excel formulas, pivot tables, and data visualization',
        },
        {
            id: '3',
            title: 'Effective Communication Skills',
            category: 'Soft Skills',
            instructor: 'Amit Patel',
            duration: 16,
            capacity: 40,
            enrolled: 35,
            schedule: {
                startDate: '2026-02-05',
                endDate: '2026-02-20',
            },
            status: 'Active',
            description: 'Improve verbal and written communication in professional settings',
        },
    ]);

    const getStatusColor = (status) => {
        const colors = {
            Active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            Upcoming: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            Completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
        };
        return colors[status] || colors.Active;
    };

    const getEnrollmentPercentage = (enrolled, capacity) => {
        return (enrolled / capacity) * 100;
    };

    const stats = {
        totalCourses: courses.length,
        activeCourses: courses.filter((c) => c.status === 'Active').length,
        totalEnrolled: courses.reduce((sum, c) => sum + c.enrolled, 0),
        avgEnrollment: Math.round(
            courses.reduce((sum, c) => sum + (c.enrolled / c.capacity) * 100, 0) / courses.length
        ),
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Training & Development
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage courses and employee learning
                    </p>
                </div>
                <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Course
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Courses</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.totalCourses}
                            </p>
                        </div>
                        <GraduationCap className="w-8 h-8 text-blue-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Active Courses</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.activeCourses}
                            </p>
                        </div>
                        <GraduationCap className="w-8 h-8 text-green-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Enrolled</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.totalEnrolled}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-purple-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Enrollment</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.avgEnrollment}%
                            </p>
                        </div>
                        <Award className="w-8 h-8 text-orange-600" />
                    </div>
                </Card>
            </div>

            {/* Course List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courses.map((course) => {
                    const enrollmentPercentage = getEnrollmentPercentage(course.enrolled, course.capacity);
                    const spotsLeft = course.capacity - course.enrolled;

                    return (
                        <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {course.title}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(course.status)}`}>
                                            {course.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                        {course.description}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Category</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{course.category}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Instructor</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{course.instructor}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Duration</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{course.duration} hours</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Schedule</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {new Date(course.schedule.startDate).toLocaleDateString()} - {new Date(course.schedule.endDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {/* Enrollment Progress */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600 dark:text-gray-400">Enrollment</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {course.enrolled}/{course.capacity} ({Math.round(enrollmentPercentage)}%)
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${enrollmentPercentage >= 90
                                            ? 'bg-red-600'
                                            : enrollmentPercentage >= 70
                                                ? 'bg-yellow-600'
                                                : 'bg-green-600'
                                            }`}
                                        style={{ width: `${enrollmentPercentage}%` }}
                                    />
                                </div>
                                {spotsLeft > 0 && spotsLeft <= 5 && (
                                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                        Only {spotsLeft} spots left!
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => navigate(`/courses/${course.id}`)}
                                >
                                    View Details
                                </Button>
                                <Button variant="secondary" size="sm" className="flex-1">
                                    Manage Enrollments
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default Courses;
