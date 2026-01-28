/**
 * Reusable Chart Components
 * Built on top of Chart.js with consistent theming
 */

import React, { useEffect, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * Get chart theme colors
 */
const getThemeColors = () => {
    const isDark = document.documentElement.classList.contains('dark');

    return {
        primary: isDark ? '#60a5fa' : '#3b82f6',
        success: isDark ? '#34d399' : '#10b981',
        warning: isDark ? '#fbbf24' : '#f59e0b',
        danger: isDark ? '#f87171' : '#ef4444',
        info: isDark ? '#38bdf8' : '#0ea5e9',
        purple: isDark ? '#a78bfa' : '#8b5cf6',
        pink: isDark ? '#f472b6' : '#ec4899',
        text: isDark ? '#e5e7eb' : '#374151',
        grid: isDark ? '#374151' : '#e5e7eb',
        background: isDark ? '#1f2937' : '#ffffff',
    };
};

/**
 * Get default chart options
 */
const getDefaultOptions = (type = 'line') => {
    const colors = getThemeColors();

    return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: colors.text,
                    font: {
                        family: 'Inter, system-ui, sans-serif',
                    },
                },
            },
            tooltip: {
                backgroundColor: colors.background,
                titleColor: colors.text,
                bodyColor: colors.text,
                borderColor: colors.grid,
                borderWidth: 1,
                padding: 12,
                boxPadding: 6,
                usePointStyle: true,
            },
        },
        scales: type !== 'pie' && type !== 'doughnut' ? {
            x: {
                grid: {
                    color: colors.grid,
                    borderColor: colors.grid,
                },
                ticks: {
                    color: colors.text,
                },
            },
            y: {
                grid: {
                    color: colors.grid,
                    borderColor: colors.grid,
                },
                ticks: {
                    color: colors.text,
                },
            },
        } : undefined,
    };
};

/**
 * Line Chart Component
 */
export const LineChart = ({ data, options = {}, height = 300 }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const colors = getThemeColors();

        // Destroy existing chart
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        // Create new chart
        chartRef.current = new ChartJS(ctx, {
            type: 'line',
            data: {
                ...data,
                datasets: data.datasets.map((dataset, index) => ({
                    ...dataset,
                    borderColor: dataset.borderColor || colors.primary,
                    backgroundColor: dataset.backgroundColor || `${colors.primary}20`,
                    tension: dataset.tension !== undefined ? dataset.tension : 0.4,
                    fill: dataset.fill !== undefined ? dataset.fill : true,
                })),
            },
            options: {
                ...getDefaultOptions('line'),
                ...options,
            },
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data, options]);

    return (
        <div style={{ height }}>
            <canvas ref={canvasRef} />
        </div>
    );
};

/**
 * Bar Chart Component
 */
export const BarChart = ({ data, options = {}, height = 300, horizontal = false }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const colors = getThemeColors();

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
                ...data,
                datasets: data.datasets.map((dataset) => ({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || colors.primary,
                    borderColor: dataset.borderColor || colors.primary,
                    borderWidth: 1,
                })),
            },
            options: {
                ...getDefaultOptions('bar'),
                indexAxis: horizontal ? 'y' : 'x',
                ...options,
            },
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data, options, horizontal]);

    return (
        <div style={{ height }}>
            <canvas ref={canvasRef} />
        </div>
    );
};

/**
 * Pie Chart Component
 */
export const PieChart = ({ data, options = {}, height = 300 }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const colors = getThemeColors();

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const defaultColors = [
            colors.primary,
            colors.success,
            colors.warning,
            colors.danger,
            colors.info,
            colors.purple,
            colors.pink,
        ];

        chartRef.current = new ChartJS(ctx, {
            type: 'pie',
            data: {
                ...data,
                datasets: data.datasets.map((dataset) => ({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || defaultColors,
                    borderColor: colors.background,
                    borderWidth: 2,
                })),
            },
            options: {
                ...getDefaultOptions('pie'),
                ...options,
            },
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data, options]);

    return (
        <div style={{ height }}>
            <canvas ref={canvasRef} />
        </div>
    );
};

/**
 * Doughnut Chart Component
 */
export const DoughnutChart = ({ data, options = {}, height = 300 }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const colors = getThemeColors();

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const defaultColors = [
            colors.primary,
            colors.success,
            colors.warning,
            colors.danger,
            colors.info,
            colors.purple,
            colors.pink,
        ];

        chartRef.current = new ChartJS(ctx, {
            type: 'doughnut',
            data: {
                ...data,
                datasets: data.datasets.map((dataset) => ({
                    ...dataset,
                    backgroundColor: dataset.backgroundColor || defaultColors,
                    borderColor: colors.background,
                    borderWidth: 2,
                })),
            },
            options: {
                ...getDefaultOptions('doughnut'),
                ...options,
            },
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data, options]);

    return (
        <div style={{ height }}>
            <canvas ref={canvasRef} />
        </div>
    );
};

/**
 * Area Chart Component
 */
export const AreaChart = ({ data, options = {}, height = 300 }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const colors = getThemeColors();

        if (chartRef.current) {
            chartRef.current.destroy();
        }

        chartRef.current = new ChartJS(ctx, {
            type: 'line',
            data: {
                ...data,
                datasets: data.datasets.map((dataset, index) => ({
                    ...dataset,
                    borderColor: dataset.borderColor || colors.primary,
                    backgroundColor: dataset.backgroundColor || `${colors.primary}40`,
                    tension: 0.4,
                    fill: true,
                })),
            },
            options: {
                ...getDefaultOptions('line'),
                ...options,
            },
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [data, options]);

    return (
        <div style={{ height }}>
            <canvas ref={canvasRef} />
        </div>
    );
};

/**
 * Export chart as image
 */
export const exportChartAsImage = (chartRef, filename = 'chart.png') => {
    if (chartRef && chartRef.current) {
        const url = chartRef.current.toBase64Image();
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
    }
};
