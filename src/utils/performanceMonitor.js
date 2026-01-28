/**
 * Performance Monitoring Utilities
 * Tracks and reports application performance metrics
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.maxMetrics = 500;
        this.observers = [];
        this.setupObservers();
    }

    /**
     * Setup performance observers
     */
    setupObservers() {
        // Observe navigation timing
        if ('PerformanceObserver' in window) {
            try {
                // Navigation timing
                const navObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordMetric({
                            type: 'navigation',
                            name: entry.name,
                            duration: entry.duration,
                            startTime: entry.startTime,
                            data: {
                                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                                loadComplete: entry.loadEventEnd - entry.loadEventStart,
                                domInteractive: entry.domInteractive,
                            },
                        });
                    }
                });
                navObserver.observe({ entryTypes: ['navigation'] });
                this.observers.push(navObserver);
            } catch (e) {
                console.warn('Navigation observer not supported');
            }

            try {
                // Resource timing
                const resourceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
                            this.recordMetric({
                                type: 'api',
                                name: entry.name,
                                duration: entry.duration,
                                startTime: entry.startTime,
                                data: {
                                    size: entry.transferSize,
                                    cached: entry.transferSize === 0,
                                },
                            });
                        }
                    }
                });
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);
            } catch (e) {
                console.warn('Resource observer not supported');
            }

            try {
                // Largest Contentful Paint
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.recordMetric({
                        type: 'lcp',
                        name: 'Largest Contentful Paint',
                        duration: lastEntry.renderTime || lastEntry.loadTime,
                        startTime: lastEntry.startTime,
                    });
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.push(lcpObserver);
            } catch (e) {
                console.warn('LCP observer not supported');
            }

            try {
                // First Input Delay
                const fidObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordMetric({
                            type: 'fid',
                            name: 'First Input Delay',
                            duration: entry.processingStart - entry.startTime,
                            startTime: entry.startTime,
                        });
                    }
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.push(fidObserver);
            } catch (e) {
                console.warn('FID observer not supported');
            }
        }
    }

    /**
     * Record a performance metric
     */
    recordMetric(metric) {
        const record = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            ...metric,
            url: window.location.pathname,
            userAgent: navigator.userAgent,
        };

        this.metrics.unshift(record);
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.pop();
        }

        // Store in localStorage (last 100)
        this.saveToStorage();
    }

    /**
     * Save metrics to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('performanceMetrics', JSON.stringify(this.metrics.slice(0, 100)));
        } catch (e) {
            // Ignore storage errors
        }
    }

    /**
     * Load metrics from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('performanceMetrics');
            if (stored) {
                this.metrics = JSON.parse(stored);
            }
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Get metrics with filters
     */
    getMetrics(filters = {}) {
        let filtered = [...this.metrics];

        if (filters.type) {
            filtered = filtered.filter((m) => m.type === filters.type);
        }

        if (filters.startDate) {
            filtered = filtered.filter((m) => new Date(m.timestamp) >= filters.startDate);
        }

        if (filters.endDate) {
            filtered = filtered.filter((m) => new Date(m.timestamp) <= filters.endDate);
        }

        return filtered;
    }

    /**
     * Get performance statistics
     */
    getStats() {
        const apiMetrics = this.metrics.filter((m) => m.type === 'api');
        const navMetrics = this.metrics.filter((m) => m.type === 'navigation');
        const lcpMetrics = this.metrics.filter((m) => m.type === 'lcp');
        const fidMetrics = this.metrics.filter((m) => m.type === 'fid');

        return {
            api: this.calculateStats(apiMetrics),
            navigation: this.calculateStats(navMetrics),
            lcp: this.calculateStats(lcpMetrics),
            fid: this.calculateStats(fidMetrics),
            totalMetrics: this.metrics.length,
        };
    }

    /**
     * Calculate statistics for metrics
     */
    calculateStats(metrics) {
        if (metrics.length === 0) {
            return { count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
        }

        const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
        const sum = durations.reduce((a, b) => a + b, 0);

        return {
            count: metrics.length,
            avg: sum / metrics.length,
            min: durations[0],
            max: durations[durations.length - 1],
            p50: this.percentile(durations, 50),
            p95: this.percentile(durations, 95),
            p99: this.percentile(durations, 99),
        };
    }

    /**
     * Calculate percentile
     */
    percentile(arr, p) {
        const index = Math.ceil((arr.length * p) / 100) - 1;
        return arr[index] || 0;
    }

    /**
     * Get Core Web Vitals
     */
    getCoreWebVitals() {
        const lcp = this.metrics.find((m) => m.type === 'lcp');
        const fid = this.metrics.find((m) => m.type === 'fid');

        // Calculate CLS (Cumulative Layout Shift) if available
        let cls = 0;
        if ('PerformanceObserver' in window) {
            try {
                const clsEntries = performance.getEntriesByType('layout-shift');
                cls = clsEntries.reduce((sum, entry) => {
                    if (!entry.hadRecentInput) {
                        return sum + entry.value;
                    }
                    return sum;
                }, 0);
            } catch (e) {
                // Ignore
            }
        }

        return {
            lcp: lcp?.duration || 0,
            fid: fid?.duration || 0,
            cls,
            ratings: {
                lcp: this.rateLCP(lcp?.duration || 0),
                fid: this.rateFID(fid?.duration || 0),
                cls: this.rateCLS(cls),
            },
        };
    }

    /**
     * Rate LCP (Largest Contentful Paint)
     */
    rateLCP(value) {
        if (value <= 2500) return 'good';
        if (value <= 4000) return 'needs-improvement';
        return 'poor';
    }

    /**
     * Rate FID (First Input Delay)
     */
    rateFID(value) {
        if (value <= 100) return 'good';
        if (value <= 300) return 'needs-improvement';
        return 'poor';
    }

    /**
     * Rate CLS (Cumulative Layout Shift)
     */
    rateCLS(value) {
        if (value <= 0.1) return 'good';
        if (value <= 0.25) return 'needs-improvement';
        return 'poor';
    }

    /**
     * Clear all metrics
     */
    clear() {
        this.metrics = [];
        this.saveToStorage();
    }

    /**
     * Disconnect all observers
     */
    disconnect() {
        this.observers.forEach((observer) => observer.disconnect());
        this.observers = [];
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();
performanceMonitor.loadFromStorage();

// Export utilities
export default performanceMonitor;

/**
 * Mark a custom performance measurement
 */
export const markPerformance = (name) => {
    if ('performance' in window && 'mark' in performance) {
        performance.mark(name);
    }
};

/**
 * Measure performance between two marks
 */
export const measurePerformance = (name, startMark, endMark) => {
    if ('performance' in window && 'measure' in performance) {
        try {
            performance.measure(name, startMark, endMark);
            const measure = performance.getEntriesByName(name)[0];

            performanceMonitor.recordMetric({
                type: 'custom',
                name,
                duration: measure.duration,
                startTime: measure.startTime,
            });

            return measure.duration;
        } catch (e) {
            console.warn('Performance measurement failed:', e);
        }
    }
    return 0;
};

/**
 * Track component render time
 */
export const trackRender = (componentName, duration) => {
    performanceMonitor.recordMetric({
        type: 'render',
        name: componentName,
        duration,
        startTime: performance.now(),
    });
};

/**
 * Track API call
 */
export const trackAPI = (url, duration, success = true) => {
    performanceMonitor.recordMetric({
        type: 'api',
        name: url,
        duration,
        startTime: performance.now(),
        data: { success },
    });
};
