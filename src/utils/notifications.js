// Push notification utilities
export const notifications = {
    // Check if notifications are supported
    isSupported: () => {
        return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    },

    // Request notification permission
    requestPermission: async () => {
        if (!notifications.isSupported()) {
            throw new Error('Notifications are not supported in this browser');
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },

    // Check current permission status
    getPermission: () => {
        if (!notifications.isSupported()) {
            return 'denied';
        }
        return Notification.permission;
    },

    // Subscribe to push notifications
    subscribe: async () => {
        if (!notifications.isSupported()) {
            throw new Error('Push notifications are not supported');
        }

        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Subscribe
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
            });
        }

        return subscription;
    },

    // Unsubscribe from push notifications
    unsubscribe: async () => {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            return true;
        }

        return false;
    },

    // Show local notification
    show: (title, options = {}) => {
        if (!notifications.isSupported()) {
            console.warn('Notifications not supported');
            return;
        }

        if (Notification.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return;
        }

        const defaultOptions = {
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [200, 100, 200],
            requireInteraction: false,
            ...options,
        };

        return new Notification(title, defaultOptions);
    },

    // Show notification via service worker
    showViaServiceWorker: async (title, options = {}) => {
        if (!notifications.isSupported()) {
            throw new Error('Notifications not supported');
        }

        const registration = await navigator.serviceWorker.ready;

        const defaultOptions = {
            body: '',
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [200, 100, 200],
            data: {
                url: window.location.origin,
            },
            ...options,
        };

        return registration.showNotification(title, defaultOptions);
    },

    // Predefined notification templates
    templates: {
        leaveApproved: (employeeName) => ({
            title: 'Leave Approved',
            body: `${employeeName}'s leave request has been approved`,
            icon: '/logo192.png',
            tag: 'leave-approval',
        }),

        leaveRejected: (employeeName) => ({
            title: 'Leave Rejected',
            body: `${employeeName}'s leave request has been rejected`,
            icon: '/logo192.png',
            tag: 'leave-rejection',
        }),

        attendanceReminder: () => ({
            title: 'Attendance Reminder',
            body: 'Don\'t forget to clock in today!',
            icon: '/logo192.png',
            tag: 'attendance-reminder',
        }),

        payslipAvailable: (month) => ({
            title: 'Payslip Available',
            body: `Your payslip for ${month} is now available`,
            icon: '/logo192.png',
            tag: 'payslip',
        }),

        newJobPosting: (jobTitle) => ({
            title: 'New Job Posting',
            body: `New position available: ${jobTitle}`,
            icon: '/logo192.png',
            tag: 'job-posting',
        }),

        expenseApproved: (amount) => ({
            title: 'Expense Approved',
            body: `Your expense of ₹${amount} has been approved`,
            icon: '/logo192.png',
            tag: 'expense-approval',
        }),
    },
};

export default notifications;
