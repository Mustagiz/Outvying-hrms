import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { storage } from '../../config/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Card, Button, Input, Spinner } from '../UI';
import { Upload, Trash2, Eye, Edit2, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';
import AccessibleModal from '../AccessibleModal';

const TemplateManager = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // Upload form state
    const [uploadForm, setUploadForm] = useState({
        name: '',
        description: '',
        category: 'Full-time',
        htmlContent: ''
    });

    // Sample data for preview
    const sampleData = {
        candidateName: 'John Doe',
        candidateEmail: 'john.doe@example.com',
        jobTitle: 'Senior Software Engineer',
        designation: 'Senior Software Engineer',
        department: 'Engineering',
        annualCTC: '1200000',
        monthlyCTC: '100000',
        joiningDate: '15th February 2026',
        basicSalary: '600000',
        hra: '240000',
        companyName: 'Outvying',
        currentDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        place: 'Mumbai',
        workLocation: 'Mumbai, Maharashtra',
        reportingManager: 'Jane Smith',
        probationPeriod: '6 months',
        noticePeriod: '30 days'
    };

    useEffect(() => {
        if (!isOpen) return;

        const q = query(collection(db, 'offerTemplates'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const templatesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTemplates(templatesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen]);

    const validateTemplate = (htmlContent) => {
        const requiredVariables = ['candidateName', 'jobTitle', 'annualCTC'];
        const foundVariables = [];

        requiredVariables.forEach(variable => {
            if (htmlContent.includes(`{{${variable}}}`)) {
                foundVariables.push(variable);
            }
        });

        return {
            isValid: foundVariables.length === requiredVariables.length,
            foundVariables,
            missingVariables: requiredVariables.filter(v => !foundVariables.includes(v))
        };
    };

    const extractVariables = (htmlContent) => {
        const variableRegex = /\{\{(\w+)\}\}/g;
        const variables = new Set();
        let match;

        while ((match = variableRegex.exec(htmlContent)) !== null) {
            variables.add(match[1]);
        }

        return Array.from(variables);
    };

    const handleLoadDefault = () => {
        const defaultHtml = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { text-align: center; border-bottom: 2px solid #0056b3; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #0056b3; }
        .content { background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        .variable { color: #d63384; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">{{companyName}}</div>
        <h1>Letter of Intent</h1>
    </div>
    <div class="content">
        <p>Date: {{currentDate}}</p>
        <p>To,<br><strong>{{candidateName}}</strong><br>{{place}}</p>
        
        <p>Dear {{candidateName}},</p>
        <p>We are pleased to offer you the position of <strong>{{jobTitle}}</strong> at {{companyName}}. Your skills and experience will be a great asset to our {{department}} team.</p>
        
        <p><strong>Offer Details:</strong></p>
        <ul>
            <li>Annual CTC: ₹{{annualCTC}}</li>
            <li>Monthly Fixed: ₹{{monthlyCTC}}</li>
            <li>Joining Date: {{joiningDate}}</li>
            <li>Location: {{workLocation}}</li>
        </ul>
        
        <p>We look forward to having you on board!</p>
    </div>
    <div class="footer">
        <p>© {{companyName}} - Confidential Offer Letter</p>
    </div>
</body>
</html>`;
        setUploadForm({ ...uploadForm, htmlContent: defaultHtml });
    };

    const handleUpload = async () => {
        if (!uploadForm.name || !uploadForm.htmlContent) {
            showToast.error('Please provide template name and HTML content');
            return;
        }

        setUploading(true);
        try {
            const htmlContent = uploadForm.htmlContent;

            // Validate template
            const validation = validateTemplate(htmlContent);
            if (!validation.isValid) {
                showToast.error(`Template missing required variables: ${validation.missingVariables.join(', ')}`);
                setUploading(false);
                return;
            }

            // Upload to Firebase Storage
            const templateId = `template_${Date.now()}`;
            const storageRef = ref(storage, `offerTemplates/${templateId}.html`);
            const blob = new Blob([htmlContent], { type: 'text/html' });

            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            // Save metadata to Firestore
            await addDoc(collection(db, 'offerTemplates'), {
                name: uploadForm.name,
                description: uploadForm.description,
                category: uploadForm.category,
                storageUrl: downloadURL,
                storagePath: `offerTemplates/${templateId}.html`,
                variables: extractVariables(htmlContent),
                isDefault: templates.length === 0, // First template is default
                createdBy: {
                    uid: currentUser.uid,
                    name: currentUser.name || currentUser.displayName,
                    email: currentUser.email
                },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            showToast.success('Template saved successfully!');
            setShowUploadModal(false);
            setUploadForm({ name: '', description: '', category: 'Full-time', htmlContent: '' });
        } catch (error) {
            console.error('Error saving template:', error);
            showToast.error('Failed to save template: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (template) => {
        if (!window.confirm(`Are you sure you want to delete "${template.name}"?`)) return;

        try {
            // Delete from Storage
            const storageRef = ref(storage, template.storagePath);
            await deleteObject(storageRef);

            // Delete from Firestore
            await deleteDoc(doc(db, 'offerTemplates', template.id));

            showToast.success('Template deleted successfully');
        } catch (error) {
            console.error('Error deleting template:', error);
            showToast.error('Failed to delete template: ' + error.message);
        }
    };

    const handleSetDefault = async (templateId) => {
        try {
            // Unset all defaults
            const batch = templates.map(t =>
                updateDoc(doc(db, 'offerTemplates', t.id), { isDefault: false })
            );
            await Promise.all(batch);

            // Set new default
            await updateDoc(doc(db, 'offerTemplates', templateId), { isDefault: true });

            showToast.success('Default template updated');
        } catch (error) {
            console.error('Error setting default:', error);
            showToast.error('Failed to set default template');
        }
    };

    const handlePreview = async (template) => {
        try {
            const response = await fetch(template.storageUrl);
            const htmlContent = await response.text();

            // Replace variables with sample data
            let previewHtml = htmlContent;
            Object.keys(sampleData).forEach(key => {
                const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                previewHtml = previewHtml.replace(regex, sampleData[key]);
            });

            setPreviewTemplate({ ...template, previewHtml });
            setShowPreviewModal(true);
        } catch (error) {
            console.error('Error loading template:', error);
            showToast.error('Failed to load template preview');
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            'Full-time': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            'Intern': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            'Contract': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
        };
        return colors[category] || colors['Full-time'];
    };

    if (!isOpen) return null;

    return (
        <AccessibleModal
            isOpen={isOpen}
            onClose={onClose}
            title="Manage Offer Letter Templates"
            size="xl"
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload custom HTML templates with variable placeholders like <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{candidateName}}'}</code>
                    </p>
                    <Button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2">
                        <Upload size={18} />
                        Upload Template
                    </Button>
                </div>

                {/* Templates List */}
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No templates uploaded yet</p>
                        <Button onClick={() => setShowUploadModal(true)} className="mt-4">
                            Upload Your First Template
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map(template => (
                            <Card key={template.id} className="p-4 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                                            {template.isDefault && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full flex items-center gap-1">
                                                    <CheckCircle size={12} /> Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{template.description}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(template.category)}`}>
                                        {template.category}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                    <span>{template.variables?.length || 0} variables</span>
                                    <span>•</span>
                                    <span>by {template.createdBy?.name}</span>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handlePreview(template)}
                                        className="flex-1 flex items-center justify-center gap-1"
                                    >
                                        <Eye size={14} /> Preview
                                    </Button>
                                    {!template.isDefault && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleSetDefault(template.id)}
                                            className="flex-1"
                                        >
                                            Set Default
                                        </Button>
                                    )}
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(template)}
                                        className="flex items-center justify-center"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <AccessibleModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    title="Upload New Template"
                    size="lg"
                >
                    <div className="space-y-4">
                        <Input
                            label="Template Name"
                            value={uploadForm.name}
                            onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                            placeholder="e.g., Full-time Employee Offer"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Description
                            </label>
                            <textarea
                                value={uploadForm.description}
                                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                rows={3}
                                placeholder="Brief description of this template..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <select
                                value={uploadForm.category}
                                onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="Full-time">Full-time</option>
                                <option value="Intern">Intern</option>
                                <option value="Contract">Contract</option>
                            </select>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    HTML Template Content
                                </label>
                                <button
                                    type="button"
                                    onClick={handleLoadDefault}
                                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Load Default Structure
                                </button>
                            </div>
                            <textarea
                                value={uploadForm.htmlContent}
                                onChange={(e) => setUploadForm({ ...uploadForm, htmlContent: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white font-mono text-sm h-64"
                                placeholder="Paste or write your HTML template here..."
                            />
                            {uploadForm.htmlContent && (
                                <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <CheckCircle size={14} /> {uploadForm.htmlContent.length} characters
                                </p>
                            )}
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Required Variables:</p>
                            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 mb-3">
                                <li><code>{'{{candidateName}}'}</code> - Candidate's name</li>
                                <li><code>{'{{jobTitle}}'}</code> - Job position</li>
                                <li><code>{'{{annualCTC}}'}</code> - Annual compensation</li>
                            </ul>

                            <details className="mt-3">
                                <summary className="text-sm font-medium text-blue-900 dark:text-blue-200 cursor-pointer hover:text-blue-700 dark:hover:text-blue-100">
                                    View All Available Variables (20+)
                                </summary>
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-300">
                                    <div>
                                        <p className="font-semibold mb-1">Candidate Info:</p>
                                        <ul className="space-y-0.5 ml-2">
                                            <li><code>{'{{candidateName}}'}</code> - Full name</li>
                                            <li><code>{'{{candidateEmail}}'}</code> - Email address</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Position Details:</p>
                                        <ul className="space-y-0.5 ml-2">
                                            <li><code>{'{{jobTitle}}'}</code> - Job title</li>
                                            <li><code>{'{{designation}}'}</code> - Designation</li>
                                            <li><code>{'{{department}}'}</code> - Department</li>
                                            <li><code>{'{{reportingManager}}'}</code> - Manager name</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Compensation:</p>
                                        <ul className="space-y-0.5 ml-2">
                                            <li><code>{'{{annualCTC}}'}</code> - Annual CTC</li>
                                            <li><code>{'{{monthlyCTC}}'}</code> - Monthly CTC</li>
                                            <li><code>{'{{basicSalary}}'}</code> - Basic salary</li>
                                            <li><code>{'{{hra}}'}</code> - HRA amount</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Dates & Location:</p>
                                        <ul className="space-y-0.5 ml-2">
                                            <li><code>{'{{joiningDate}}'}</code> - Joining date</li>
                                            <li><code>{'{{currentDate}}'}</code> - Today's date</li>
                                            <li><code>{'{{place}}'}</code> - City</li>
                                            <li><code>{'{{workLocation}}'}</code> - Full location</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold mb-1">Employment Terms:</p>
                                        <ul className="space-y-0.5 ml-2">
                                            <li><code>{'{{probationPeriod}}'}</code> - Probation</li>
                                            <li><code>{'{{noticePeriod}}'}</code> - Notice period</li>
                                            <li><code>{'{{companyName}}'}</code> - Company</li>
                                        </ul>
                                    </div>
                                </div>
                            </details>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpload} disabled={uploading}>
                                {uploading ? <><Spinner size="sm" className="mr-2" /> Uploading...</> : 'Upload Template'}
                            </Button>
                        </div>
                    </div>
                </AccessibleModal>
            )}

            {/* Preview Modal */}
            {showPreviewModal && previewTemplate && (
                <AccessibleModal
                    isOpen={showPreviewModal}
                    onClose={() => setShowPreviewModal(false)}
                    title={`Preview: ${previewTemplate.name}`}
                    size="xl"
                >
                    <div className="space-y-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg flex items-start gap-2">
                            <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                This is a preview with sample data. Actual offers will use real candidate information.
                            </p>
                        </div>
                        <div
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800 max-h-96 overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: previewTemplate.previewHtml }}
                        />
                    </div>
                </AccessibleModal>
            )}
        </AccessibleModal>
    );
};

export default TemplateManager;
