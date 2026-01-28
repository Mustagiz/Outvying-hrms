/**
 * System Health Dashboard
 * Monitors application health, errors, and performance
 */

import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Zap, Database, Users, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import errorTracker from '../utils/errorTracking';
import performanceMonitor from '../utils/performanceMonitor';
import { LineChart, BarChart, DoughnutChart } from '../components/charts/Charts';

const SystemHealth = () => {
    const [errorStats, setErrorStats] = useState(null);
    const [perfStats, setPerfStats] = useState(null);
    const [coreWebVitals, setCoreWebVitals] = useState(null);
    const [recentErrors, setRecentErrors] = useState([]);
    const [timeRange, setTimeRange] = useState('24h');

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [timeRange]);

    const loadData = () => {
        // Load error statistics
        const errors = errorTracker.getStats();
        setErrorStats(errors);
        setRecentErrors(errorTracker.getErrors().slice(0, 10));

        // Load performance statistics
        const perf = performanceMonitor.getStats();
        setPerfStats(perf);

        // Load Core Web Vitals
        const vitals = performanceMonitor.getCoreWebVitals();
        setCoreWebVitals(vitals);
    };

    const getHealthStatus = () => {
        if (!errorStats || !coreWebVitals) return 'unknown';

        const errorRate = errorStats.last24h;
        const lcpRating = coreWebVitals.ratings.lcp;
        const fidRating = coreWebVitals.ratings.fid;

        if (errorRate > 50 || lcpRating === 'poor' || fidRating === 'poor') {
            return 'critical';
        }
        if (errorRate > 20 || lcpRating === 'needs-improvement' || fidRating === 'needs-improvement') {
            return 'warning';
        }
        return 'healthy';
    };

    const healthStatus = getHealthStatus();

    const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <div className="flex items-center mt-2">
                            {trend > 0 ? (
                                <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                            ) : (
                                <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                            )}
                            <span className={`text-sm ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {Math.abs(trend)}%
                            </span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('600', '100')} dark:bg-opacity-20`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                </div>
            </div>
        </div>
    );

    const WebVitalCard = ({ title, value, rating, unit = 'ms' }) => {
        const colors = {
            good: 'text-green-600 bg-green-100 dark:bg-green-900/30',
            'needs-improvement': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
            poor: 'text-red-600 bg-red-100 dark:bg-red-900/30',
        };

        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                            {value.toFixed(0)}<span className="text-lg text-gray-500">{unit}</span>
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[rating]}`}>
                        {rating.replace('-', ' ')}
                    </span>
                </div>
            </div>
        );
    };

    // Prepare chart data
    const errorTypeData = errorStats ? {
        labels: Object.keys(errorStats.byType),
        datasets: [{
            data: Object.values(errorStats.byType),
            label: 'Errors by Type',
        }],
    } : null;

    const performanceData = perfStats ? {
        labels: ['API Calls', 'Page Load', 'Renders'],
        datasets: [{
            label: 'Average Duration (ms)',
            data: [
                perfStats.api.avg || 0,
                perfStats.navigation.avg || 0,
                0, // Placeholder for renders
            ],
        }],
    } : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Health</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Monitor application performance and errors
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="1h">Last Hour</option>
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                    </select>
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Overall Health Status */}
            <div className={`p-6 rounded-xl border-2 ${healthStatus === 'healthy' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                    healthStatus === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                        'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Activity className={`w-8 h-8 ${healthStatus === 'healthy' ? 'text-green-600' :
                                healthStatus === 'warning' ? 'text-yellow-600' :
                                    'text-red-600'
                            }`} />
                        <div>
                            <h2 className={`text-xl font-bold ${healthStatus === 'healthy' ? 'text-green-900 dark:text-green-100' :
                                    healthStatus === 'warning' ? 'text-yellow-900 dark:text-yellow-100' :
                                        'text-red-900 dark:text-red-100'
                                }`}>
                                System Status: {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
                            </h2>
                            <p className={`text-sm ${healthStatus === 'healthy' ? 'text-green-700 dark:text-green-300' :
                                    healthStatus === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
                                        'text-red-700 dark:text-red-300'
                                }`}>
                                {healthStatus === 'healthy' && 'All systems operational'}
                                {healthStatus === 'warning' && 'Some metrics need attention'}
                                {healthStatus === 'critical' && 'Critical issues detected'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Last updated</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Errors"
                    value={errorStats?.total || 0}
                    subtitle={`${errorStats?.last24h || 0} in last 24h`}
                    icon={AlertTriangle}
                    color="text-red-600"
                />
                <StatCard
                    title="API Calls"
                    value={perfStats?.api.count || 0}
                    subtitle={`Avg: ${(perfStats?.api.avg || 0).toFixed(0)}ms`}
                    icon={Database}
                    color="text-blue-600"
                />
                <StatCard
                    title="Page Loads"
                    value={perfStats?.navigation.count || 0}
                    subtitle={`Avg: ${(perfStats?.navigation.avg || 0).toFixed(0)}ms`}
                    icon={Zap}
                    color="text-purple-600"
                />
                <StatCard
                    title="Active Users"
                    value="--"
                    subtitle="Real-time tracking"
                    icon={Users}
                    color="text-green-600"
                />
            </div>

            {/* Core Web Vitals */}
            {coreWebVitals && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Core Web Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <WebVitalCard
                            title="Largest Contentful Paint (LCP)"
                            value={coreWebVitals.lcp}
                            rating={coreWebVitals.ratings.lcp}
                        />
                        <WebVitalCard
                            title="First Input Delay (FID)"
                            value={coreWebVitals.fid}
                            rating={coreWebVitals.ratings.fid}
                        />
                        <WebVitalCard
                            title="Cumulative Layout Shift (CLS)"
                            value={coreWebVitals.cls}
                            rating={coreWebVitals.ratings.cls}
                            unit=""
                        />
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Error Distribution */}
                {errorTypeData && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Error Distribution
                        </h3>
                        <DoughnutChart data={errorTypeData} height={250} />
                    </div>
                )}

                {/* Performance Metrics */}
                {performanceData && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Performance Metrics
                        </h3>
                        <BarChart data={performanceData} height={250} />
                    </div>
                )}
            </div>

            {/* Recent Errors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Errors</h3>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {recentErrors.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            No errors recorded
                        </div>
                    ) : (
                        recentErrors.map((error) => (
                            <div key={error.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${error.severity === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    error.severity === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {error.severity}
                                            </span>
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                {error.type}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
                                            {error.message}
                                        </p>
                                        {error.source && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {error.source}:{error.line}:{error.column}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right ml-4">
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(error.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3">
                <button
                    onClick={() => errorTracker.clear()}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    Clear Error Logs
                </button>
                <button
                    onClick={() => performanceMonitor.clear()}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    Clear Performance Data
                </button>
            </div>
        </div>
    );
};

export default SystemHealth;
