// Performance monitoring utilities

export const performance = {
    // Measure component render time
    measureRender: (componentName, callback) => {
        const startTime = window.performance.now();
        const result = callback();
        const endTime = window.performance.now();

        console.log(`[Performance] ${componentName} rendered in ${(endTime - startTime).toFixed(2)}ms`);

        return result;
    },

    // Measure API call time
    measureAPI: async (apiName, apiCall) => {
        const startTime = window.performance.now();

        try {
            const result = await apiCall();
            const endTime = window.performance.now();

            console.log(`[Performance] ${apiName} completed in ${(endTime - startTime).toFixed(2)}ms`);

            return result;
        } catch (error) {
            const endTime = window.performance.now();
            console.error(`[Performance] ${apiName} failed after ${(endTime - startTime).toFixed(2)}ms`, error);
            throw error;
        }
    },

    // Get page load metrics
    getPageMetrics: () => {
        if (!window.performance || !window.performance.timing) {
            return null;
        }

        const timing = window.performance.timing;

        return {
            // Page load time
            pageLoadTime: timing.loadEventEnd - timing.navigationStart,

            // DOM ready time
            domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,

            // DNS lookup time
            dnsTime: timing.domainLookupEnd - timing.domainLookupStart,

            // TCP connection time
            tcpTime: timing.connectEnd - timing.connectStart,

            // Server response time
            serverResponseTime: timing.responseEnd - timing.requestStart,

            // DOM processing time
            domProcessingTime: timing.domComplete - timing.domLoading,
        };
    },

    // Get resource timing
    getResourceMetrics: () => {
        if (!window.performance || !window.performance.getEntriesByType) {
            return [];
        }

        const resources = window.performance.getEntriesByType('resource');

        return resources.map((resource) => ({
            name: resource.name,
            type: resource.initiatorType,
            duration: resource.duration,
            size: resource.transferSize,
        }));
    },

    // Log performance metrics
    logMetrics: () => {
        const pageMetrics = performance.getPageMetrics();
        const resourceMetrics = performance.getResourceMetrics();

        console.group('[Performance Metrics]');
        console.log('Page Metrics:', pageMetrics);
        console.log('Resource Metrics:', resourceMetrics);
        console.groupEnd();

        return { pageMetrics, resourceMetrics };
    },

    // Check if performance is acceptable
    isPerformanceGood: () => {
        const metrics = performance.getPageMetrics();

        if (!metrics) {
            return true;
        }

        // Thresholds (in milliseconds)
        const thresholds = {
            pageLoadTime: 3000,
            domReadyTime: 2000,
            serverResponseTime: 500,
        };

        return (
            metrics.pageLoadTime < thresholds.pageLoadTime &&
            metrics.domReadyTime < thresholds.domReadyTime &&
            metrics.serverResponseTime < thresholds.serverResponseTime
        );
    },

    // Report to analytics (placeholder)
    reportToAnalytics: (metrics) => {
        // In production, send to Google Analytics, Firebase, or custom analytics
        console.log('[Analytics] Performance metrics:', metrics);
    },
};

export default performance;
