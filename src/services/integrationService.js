/**
 * Integration Service
 * Manages external webhooks for Slack, MS Teams, and other apps
 */

import { toast } from 'react-hot-toast';

class IntegrationService {
    constructor() {
        this.webhooks = this.loadConfig();
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem('integration_webhooks');
            return saved ? JSON.parse(saved) : {
                slack: '',
                teams: '',
                discord: ''
            };
        } catch (e) {
            return { slack: '', teams: '', discord: '' };
        }
    }

    saveConfig(config) {
        this.webhooks = config;
        localStorage.setItem('integration_webhooks', JSON.stringify(config));
        toast.success('Integration settings updated');
    }

    /**
     * Send Notification to integrated channels
     */
    async notify(event, message) {
        const payload = {
            text: `[HRMS ALERT] ${event}: ${message}`,
            timestamp: new Date().toISOString()
        };

        const results = [];

        // Slack
        if (this.webhooks.slack) {
            results.push(this.postToWebhook(this.webhooks.slack, payload));
        }

        // Teams
        if (this.webhooks.teams) {
            results.push(this.postToWebhook(this.webhooks.teams, payload));
        }

        return Promise.all(results);
    }

    async postToWebhook(url, payload) {
        try {
            // In a real app, this would be a server-side call.
            // For the demo, we simulate the fetch logic.
            console.log(`POSTING to ${url}`, payload);

            /* 
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            return response.ok;
            */

            return true;
        } catch (error) {
            console.error('Webhook failed:', error);
            return false;
        }
    }

    /**
     * Pre-defined notification templates
     */
    notifyLeaveRequest(user, type, days) {
        return this.notify('New Leave Request', `${user} requested ${days} days of ${type} leave.`);
    }

    notifyNewHire(name, department) {
        return this.notify('New Hire', `Please welcome ${name} to the ${department} team!`);
    }

    notifyPayrollProcessed(period) {
        return this.notify('Payroll', `Payroll for ${period} has been processed and disbursed.`);
    }
}

const integrationService = new IntegrationService();
export default integrationService;
