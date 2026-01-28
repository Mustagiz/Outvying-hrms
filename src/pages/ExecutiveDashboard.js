import React, { useState } from 'react';
import { Card } from '../components/UI';
import {
    TrendingUp,
    TrendingDown,
    Users,
    UserMinus,
    Calendar,
    DollarSign,
    Briefcase,
    GraduationCap,
    Package,
    Receipt
} from 'lucide-react';
import { analytics } from '../utils/analytics';
import { useAuth } from '../context/AuthContext';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

const ExecutiveDashboard = () => {
    const { employees, attendance, leaves, payroll } = useAuth();
    const [period, setPeriod] = useState('monthly');

    // Calculate metrics
    const headcountMetrics = analytics.headcount(employees || []);
    const attritionMetrics = analytics.attritionRate(employees || [], period);
    const tenureMetrics = analytics.averageTenure(employees || []);
    const deptDistribution = analytics.departmentDistribution(employees || []);

    // Metric cards data
    const metrics = [
        {
            title: 'Total Headcount',
            value: headcountMetrics.total,
            change: '+5.2%',
            trend: 'up',
            icon: Users,
            color: 'blue',
        },
        {
            title: 'Attrition Rate',
            value: `${attritionMetrics.rate.toFixed(1)}%`,
            change: '-2.1%',
            trend: 'down',
            icon: UserMinus,
            color: 'red',
        },
        {
            title: 'Avg Tenure',
            value: `${tenureMetrics.years} years`,
            change: '+0.3 years',
            trend: 'up',
            icon: Calendar,
            color: 'green',
        },
        {
            title: 'Active Employees',
            value: headcountMetrics.active,
            change: `${headcountMetrics.activePercentage.toFixed(1)}%`,
            trend: 'up',
            icon: Briefcase,
            color: 'purple',
        },
    ];

    // Department distribution chart
    const deptChartData = {
        labels: deptDistribution.map((d) => d.department),
        datasets: [
            {
                label: 'Employees',
                data: deptDistribution.map((d) => d.count),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                ],
            },
        ],
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Executive Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        High-level overview of HR metrics and KPIs
                    </p>
                </div>

                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    <option value="monthly">This Month</option>
                    <option value="quarterly">This Quarter</option>
                    <option value="yearly">This Year</option>
                </select>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, index) => {
                    const Icon = metric.icon;
                    const colorClasses = {
                        blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
                        red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
                        green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
                        purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
                    };

                    return (
                        <Card key={index} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {metric.title}
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                        {metric.value}
                                    </p>
                                    <div className="flex items-center mt-2">
                                        {metric.trend === 'up' ? (
                                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                                        )}
                                        <span className={`text-sm ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                            {metric.change}
                                        </span>
                                        <span className="text-sm text-gray-500 ml-1">vs last period</span>
                                    </div>
                                </div>
                                <div className={`p-3 rounded-lg ${colorClasses[metric.color]}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Distribution */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Department Distribution
                    </h3>
                    <div className="h-64">
                        <Doughnut
                            data={deptChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                    },
                                },
                            }}
                        />
                    </div>
                </Card>

                {/* Quick Stats */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Quick Stats
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center">
                                <DollarSign className="w-5 h-5 text-green-600 mr-3" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    Avg Salary
                                </span>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                ₹45,000
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center">
                                <Briefcase className="w-5 h-5 text-blue-600 mr-3" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    Open Positions
                                </span>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                12
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center">
                                <GraduationCap className="w-5 h-5 text-purple-600 mr-3" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    Training Completion
                                </span>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                78%
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center">
                                <Receipt className="w-5 h-5 text-orange-600 mr-3" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    Pending Expenses
                                </span>
                            </div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                ₹1,24,500
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Attendance Overview
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Present Today</span>
                            <span className="text-lg font-bold text-green-600">85%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">On Leave</span>
                            <span className="text-lg font-bold text-yellow-600">8%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Absent</span>
                            <span className="text-lg font-bold text-red-600">7%</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recruitment Pipeline
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Applications</span>
                            <span className="text-lg font-bold text-blue-600">156</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Interviews</span>
                            <span className="text-lg font-bold text-purple-600">42</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Offers</span>
                            <span className="text-lg font-bold text-green-600">8</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Asset Utilization
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Assigned</span>
                            <span className="text-lg font-bold text-blue-600">92%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Available</span>
                            <span className="text-lg font-bold text-green-600">8%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Maintenance</span>
                            <span className="text-lg font-bold text-orange-600">3</span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ExecutiveDashboard;
