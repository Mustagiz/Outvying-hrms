import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Triggers configured webhooks for a specific event
 */
export const triggerWebhooks = async (event, data) => {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'webhooks'));
        if (!settingsDoc.exists()) return;

        const settings = settingsDoc.data();
        const config = settings[event];

        if (!config || !config.enabled || !config.url) return;

        // Send the notification to the external endpoint
        const response = await fetch(config.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event,
                timestamp: new Date().toISOString(),
                data
            }),
        });

        if (!response.ok) {
            console.warn(`Webhook failed for event ${event}: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error triggering webhook:', error);
    }
};

/**
 * Sends a browser push notification if permissions are granted
 */
export const sendBrowserNotification = (title, options = {}) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/logo192.png',
            ...options
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, {
                    icon: '/logo192.png',
                    ...options
                });
            }
        });
    }
};
