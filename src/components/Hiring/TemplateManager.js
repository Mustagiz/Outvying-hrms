import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { storage } from '../../config/firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, deleteObject, uploadString } from 'firebase/storage';
import { Card, Button, Input, Spinner } from '../UI';
import { Upload, Trash2, Eye, Edit2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';
import AccessibleModal from '../AccessibleModal';
import { auditLogger } from '../../utils/auditLogger';

const TemplateManager = ({
    isOpen,
    onClose,
    collectionName = 'offerTemplates',
    title = 'Template Manager',
    categories = ['Full-time', 'Part-time', 'Internship', 'Contract']
}) => {
    const { currentUser } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const [uploadMode, setUploadMode] = useState('edit');
    const [uploadForm, setUploadForm] = useState({
        name: '',
        description: '',
        category: categories[0],
        htmlContent: ''
    });
    const [batchFiles, setBatchFiles] = useState([]);

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

        const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const templatesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTemplates(templatesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isOpen, collectionName]);

    const validateTemplate = (htmlContent) => {
        // Only validate specific variables if it's offer templates
        // For generic HR docs, validation might be different or looser
        if (collectionName !== 'offerTemplates') return { isValid: true, missingVariables: [] };

        const requiredVariables = ['candidateName', 'jobTitle', 'annualCTC'];
        const foundVariables = [];
        requiredVariables.forEach(variable => {
            if (htmlContent.includes(`{{${variable}}}`)) {
                foundVariables.push(variable);
            }
        });
        return {
            isValid: foundVariables.length === requiredVariables.length,
            missingVariables: requiredVariables.filter(v => !foundVariables.includes(v))
        };
    };

    const extractVariables = (htmlContent) => {
        try {
            const variableRegex = /\{\{\s*(\w+)\s*\}\}/g;
            const variables = new Set();
            let match;
            let iterations = 0;
            while ((match = variableRegex.exec(htmlContent)) !== null && iterations < 5000) {
                variables.add(match[1]);
                iterations++;
            }
            return Array.from(variables);
        } catch (e) {
            return [];
        }
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
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">{{companyName}}</div>
        <h1>Template Title</h1>
    </div>
    <div class="content">
        <p>Date: {{currentDate}}</p>
        <p>To,<br><strong>{{candidateName}}</strong></p>
        <p>Dear {{candidateName}},</p>
        <p>This is a sample content body.</p>
    </div>
</body>
</html>`;
        setUploadForm({ ...uploadForm, htmlContent: defaultHtml });
    };

    const handleBatchFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => file.type === 'text/html' || file.name.endsWith('.html'));
        setBatchFiles(validFiles);
    };

    const handleUpload = async () => {
        setUploading(true);
        try {
            if (uploadMode === 'edit') {
                if (!uploadForm.name || !uploadForm.htmlContent) {
                    showToast.error('Please provide name and content');
                    setUploading(false);
                    return;
                }

                const variables = extractVariables(uploadForm.htmlContent);
                const validation = validateTemplate(uploadForm.htmlContent);
                if (!validation.isValid) {
                    showToast.warning(`Note: Basic variables missing: ${validation.missingVariables.join(', ')}`);
                }

                if (editingTemplate) {
                    await updateDoc(doc(db, collectionName, editingTemplate.id), {
                        name: uploadForm.name,
                        description: uploadForm.description,
                        category: uploadForm.category,
                        htmlContent: uploadForm.htmlContent,
                        variables: variables,
                        updatedAt: serverTimestamp()
                    });
                    showToast.success('Template updated!');
                } else {
                    await saveTemplateToFirebase(uploadForm.name, uploadForm.description, uploadForm.category, uploadForm.htmlContent, variables);
                    showToast.success('Template saved!');
                }

                setShowUploadModal(false);
                setEditingTemplate(null);
                setUploadForm({ name: '', description: '', category: categories[0], htmlContent: '' });
            } else {
                for (const file of batchFiles) {
                    const content = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve(e.target.result);
                        reader.readAsText(file);
                    });
                    await saveTemplateToFirebase(file.name.replace('.html', ''), '', categories[0], content);
                }
                showToast.success('Batch upload complete');
                setShowUploadModal(false);
                setBatchFiles([]);
            }
        } catch (error) {
            console.error(error);
            showToast.error('Operation failed');
        } finally {
            setUploading(false);
        }
    };

    const handleEditClick = (template) => {
        setEditingTemplate(template);
        setUploadForm({
            name: template.name || '',
            description: template.description || '',
            category: template.category || categories[0],
            htmlContent: template.htmlContent || ''
        });
        setUploadMode('edit');
        setShowUploadModal(true);
    };

    const saveTemplateToFirebase = async (name, description, category, htmlContent, preExtractedVariables = null) => {
        const variables = preExtractedVariables || extractVariables(htmlContent);
        const templateData = {
            name, description, category, htmlContent, variables,
            isDefault: false,
            createdBy: { uid: currentUser.uid, name: currentUser.displayName || 'Admin' },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        return await addDoc(collection(db, collectionName), templateData);
    };

    const handleDelete = async (template) => {
        if (!window.confirm('Delete template?')) return;
        await deleteDoc(doc(db, collectionName, template.id));
        showToast.success('Deleted');
    };

    const handleSetDefault = async (templateId) => {
        const batch = templates.map(t => updateDoc(doc(db, collectionName, t.id), { isDefault: false }));
        await Promise.all(batch);
        await updateDoc(doc(db, collectionName, templateId), { isDefault: true });
        showToast.success('Default updated');
    };

    const handlePreview = async (template) => {
        let htmlContent = template.htmlContent;
        if (!htmlContent) return showToast.error('No content');
        let previewHtml = htmlContent;
        Object.keys(sampleData).forEach(key => {
            previewHtml = previewHtml.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), sampleData[key]);
        });
        setPreviewTemplate({ ...template, previewHtml });
        setShowPreviewModal(true);
    };

    if (!isOpen) return null;

    return (
        <AccessibleModal isOpen={isOpen} onClose={onClose} title={title} size="xl">
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Manage your {title.toLowerCase()}</p>
                    <Button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2">
                        <Upload size={18} /> Upload Template
                    </Button>
                </div>

                {loading ? <Spinner /> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map(t => (
                            <Card key={t.id} className="p-4">
                                <div className="flex justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold">{t.name} {t.isDefault && '✅'}</h3>
                                        <p className="text-sm text-gray-500">{t.description}</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">{t.category}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => handlePreview(t)}><Eye size={14} /> Preview</Button>
                                    <Button variant="secondary" size="sm" onClick={() => handleEditClick(t)} className="text-amber-600"><Edit2 size={14} /> Edit</Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(t)}><Trash2 size={14} /></Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {showUploadModal && (
                <AccessibleModal
                    isOpen={showUploadModal}
                    onClose={() => { setShowUploadModal(false); setEditingTemplate(null); }}
                    title={editingTemplate ? "Edit Template" : "Add Template"}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Name" value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })} />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    value={uploadForm.category}
                                    onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <Input label="Description" value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} />
                        <textarea
                            value={uploadForm.htmlContent}
                            onChange={e => setUploadForm({ ...uploadForm, htmlContent: e.target.value })}
                            className="w-full h-64 font-mono text-sm p-3 border rounded"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="secondary" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                            <Button onClick={handleUpload} disabled={uploading}>
                                {uploading ? <Spinner size="sm" /> : (editingTemplate ? 'Update' : 'Save')}
                            </Button>
                        </div>
                    </div>
                </AccessibleModal>
            )}

            {showPreviewModal && previewTemplate && (
                <AccessibleModal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Preview">
                    <div className="border p-4 bg-white overflow-auto max-h-[500px]" dangerouslySetInnerHTML={{ __html: previewTemplate.previewHtml }} />
                </AccessibleModal>
            )}
        </AccessibleModal>
    );
};

export default TemplateManager;
