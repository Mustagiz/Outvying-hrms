import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Alert } from '../components/UI';
import { Globe, Save, RefreshCw, Smartphone, MessageSquare, Bell } from 'lucide-react';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const WebhookSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState(null);
    const [settings, setSettings] = useState({
        leave_request: { enabled: false, url: '' },
        leave_approved: { enabled: false, url: '' },
        attendance_alert: { enabled: false, url: '' },
        payroll_processed: { enabled: false, url: '' },
        announcement: { enabled: false, url: '' }
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'settings', 'webhooks'));
                if (docSnap.exists()) {
                    setSettings(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'webhooks'), {
                ...settings,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setAlert({ type: 'success', message: 'Webhook settings saved successfully' });
        } catch (err) {
            setAlert({ type: 'error', message: 'Failed to save settings' });
        } finally {
            setSaving(false);
            setTimeout(() => setAlert(null), 3000);
        }
    };

    const toggleWebhook = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], enabled: !prev[key].enabled }
        }));
    };

    const updateUrl = (key, url) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], url }
        }));
    };

    if (loading) return <div className="p-8 text-center animate-pulse">Loading settings...</div>;

    const eventLabels = {
        leave_request: { label: 'New Leave Request', icon: <Bell size={18} /> },
        leave_approved: { label: 'Leave Approval/Rejection', icon: <Bell size={18} /> },
        attendance_alert: { label: 'Attendance Irregularity', icon: <Bell size={18} /> },
        payroll_processed: { label: 'Payroll Generation', icon: <Bell size={18} /> },
        announcement: { label: 'Company Announcements', icon: <Bell size={18} /> }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-2 text-primary-600 font-bold text-xs uppercase tracking-[0.2em] mb-1">
                    <Globe size={14} /> Integrations & Webhooks
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">External <span className="text-primary-600">Connectivity</span></h1>
                <p className="text-gray-400 text-sm mt-1">Connect HRMS events to Slack, WhatsApp (via Zapier), or custom APIs.</p>
            </div>

            {alert && <div className="mb-6"><Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} /></div>}

            <div className="space-y-6">
                {Object.keys(eventLabels).map(key => (
                    <Card key={key} className="border-none shadow-lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${settings[key].enabled ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {eventLabels[key].icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{eventLabels[key].label}</h3>
                                    <p className="text-xs text-gray-400">Triggered when {eventLabels[key].label.toLowerCase()} occurs.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${settings[key].enabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    {settings[key].enabled ? 'Active' : 'Disabled'}
                                </span>
                                <button
                                    onClick={() => toggleWebhook(key)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings[key].enabled ? 'bg-primary-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key].enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                        {settings[key].enabled && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Endpoint URL (JSON POST)</label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="https://hooks.slack.com/services/..."
                                        value={settings[key].url}
                                        onChange={(e) => updateUrl(key, e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            // Mock test
                                            alert('Test payload sent to console. Check browser logs.');
                                            console.log('Test Payload for', key, ':', {
                                                event: key,
                                                timestamp: new Date().toISOString(),
                                                data: { test: true, message: 'This is a test notification' }
                                            });
                                        }}
                                        className="text-xs px-3"
                                    >
                                        Test
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                ))}

                <div className="flex justify-end pt-4">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full md:w-auto px-12 py-3 shadow-xl shadow-primary-500/20"
                    >
                        {saving ? <RefreshCw className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                        Save Webhook Configurations
                    </Button>
                </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                    <div className="flex items-center gap-3 text-blue-600 mb-3">
                        <MessageSquare size={20} />
                        <h4 className="font-bold">Slack Integration</h4>
                    </div>
                    <p className="text-xs text-blue-700 leading-relaxed italic">
                        "We used these webhooks to connect our leave approvals to a Slack channel. Now the whole department knows who is out without checking the dashboard."
                    </p>
                </div>
                <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
                    <div className="flex items-center gap-3 text-purple-600 mb-3">
                        <Smartphone size={20} />
                        <h4 className="font-bold">WhatsApp & SMS</h4>
                    </div>
                    <p className="text-xs text-purple-700 leading-relaxed italic">
                        "By connecting these webhooks to Zapier, we send automated WhatsApp messages for salary credits. The employees love the instant confirmation."
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WebhookSettings;
