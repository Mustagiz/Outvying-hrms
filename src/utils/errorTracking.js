/**
 * Error Tracking Utilities
 * Provides comprehensive error tracking and reporting
 */

class ErrorTracker {
    constructor() {
        this.errors = [];
        this.maxErrors = 100;
        this.listeners = [];
        this.setupGlobalHandlers();
    }

    /**
     * Setup global error handlers
     */
    setupGlobalHandlers() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            this.captureError({
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                error: event.error,
                type: 'uncaught',
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError({
                message: event.reason?.message || 'Unhandled Promise Rejection',
                error: event.reason,
                type: 'promise',
            });
        });
    }

    /**
     * Capture an error
     */
    captureError(errorInfo) {
        const error = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            message: errorInfo.message || 'Unknown error',
            stack: errorInfo.error?.stack || '',
            type: errorInfo.type || 'manual',
            source: errorInfo.source || '',
            line: errorInfo.line || 0,
            column: errorInfo.column || 0,
            userAgent: navigator.userAgent,
            url: window.location.href,
            user: this.getUserContext(),
            severity: errorInfo.severity || 'error',
            tags: errorInfo.tags || [],
            extra: errorInfo.extra || {},
        };

        // Add to errors array
        this.errors.unshift(error);
        if (this.errors.length > this.maxErrors) {
            this.errors.pop();
        }

        // Store in localStorage
        this.saveToStorage();

        // Notify listeners
        this.notifyListeners(error);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('Error captured:', error);
        }

        return error;
    }

    /**
     * Get user context
     */
    getUserContext() {
        try {
            const userStr = localStorage.getItem('currentUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                };
            }
        } catch (e) {
            // Ignore
        }
        return null;
    }

    /**
     * Save errors to localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('errorLogs', JSON.stringify(this.errors.slice(0, 50)));
        } catch (e) {
            // Ignore storage errors
        }
    }

    /**
     * Load errors from localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('errorLogs');
            if (stored) {
                this.errors = JSON.parse(stored);
            }
        } catch (e) {
            // Ignore
        }
    }

    /**
     * Add error listener
     */
    addListener(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== callback);
        };
    }

    /**
     * Notify all listeners
     */
    notifyListeners(error) {
        this.listeners.forEach((listener) => {
            try {
                listener(error);
            } catch (e) {
                console.error('Error in error listener:', e);
            }
        });
    }

    /**
     * Get all errors
     */
    getErrors(filters = {}) {
        let filtered = [...this.errors];

        if (filters.type) {
            filtered = filtered.filter((e) => e.type === filters.type);
        }

        if (filters.severity) {
            filtered = filtered.filter((e) => e.severity === filters.severity);
        }

        if (filters.startDate) {
            filtered = filtered.filter((e) => new Date(e.timestamp) >= filters.startDate);
        }

        if (filters.endDate) {
            filtered = filtered.filter((e) => new Date(e.timestamp) <= filters.endDate);
        }

        return filtered;
    }

    /**
     * Get error statistics
     */
    getStats() {
        const now = new Date();
        const last24h = new Date(now - 24 * 60 * 60 * 1000);
        const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

        const errors24h = this.errors.filter((e) => new Date(e.timestamp) >= last24h);
        const errors7d = this.errors.filter((e) => new Date(e.timestamp) >= last7d);

        return {
            total: this.errors.length,
            last24h: errors24h.length,
            last7d: errors7d.length,
            byType: this.groupBy(this.errors, 'type'),
            bySeverity: this.groupBy(this.errors, 'severity'),
            mostCommon: this.getMostCommon(),
        };
    }

    /**
     * Group errors by field
     */
    groupBy(errors, field) {
        return errors.reduce((acc, error) => {
            const key = error[field] || 'unknown';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Get most common errors
     */
    getMostCommon(limit = 5) {
        const grouped = this.errors.reduce((acc, error) => {
            const key = error.message;
            if (!acc[key]) {
                acc[key] = { message: key, count: 0, lastSeen: error.timestamp };
            }
            acc[key].count++;
            if (new Date(error.timestamp) > new Date(acc[key].lastSeen)) {
                acc[key].lastSeen = error.timestamp;
            }
            return acc;
        }, {});

        return Object.values(grouped)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Clear all errors
     */
    clear() {
        this.errors = [];
        this.saveToStorage();
    }

    /**
     * Clear errors older than specified days
     */
    clearOld(days = 7) {
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        this.errors = this.errors.filter((e) => new Date(e.timestamp) >= cutoff);
        this.saveToStorage();
    }
}

// Create singleton instance
const errorTracker = new ErrorTracker();
errorTracker.loadFromStorage();

// Export utilities
export default errorTracker;

/**
 * Capture an error manually
 */
export const captureError = (error, extra = {}) => {
    return errorTracker.captureError({
        message: error.message || String(error),
        error: error instanceof Error ? error : new Error(String(error)),
        type: 'manual',
        severity: extra.severity || 'error',
        tags: extra.tags || [],
        extra,
    });
};

/**
 * Capture a message
 */
export const captureMessage = (message, severity = 'info', extra = {}) => {
    return errorTracker.captureError({
        message,
        type: 'message',
        severity,
        tags: extra.tags || [],
        extra,
    });
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (message, data = {}) => {
    const breadcrumbs = JSON.parse(localStorage.getItem('errorBreadcrumbs') || '[]');
    breadcrumbs.push({
        timestamp: new Date().toISOString(),
        message,
        data,
    });

    // Keep only last 50 breadcrumbs
    if (breadcrumbs.length > 50) {
        breadcrumbs.shift();
    }

    localStorage.setItem('errorBreadcrumbs', JSON.stringify(breadcrumbs));
};

/**
 * Get breadcrumbs
 */
export const getBreadcrumbs = () => {
    return JSON.parse(localStorage.getItem('errorBreadcrumbs') || '[]');
};

/**
 * Clear breadcrumbs
 */
export const clearBreadcrumbs = () => {
    localStorage.removeItem('errorBreadcrumbs');
};
