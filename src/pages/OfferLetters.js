import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, Button, Input, Spinner } from '../components/UI';
import { FileText, Send, CheckCircle, XCircle, Clock, Plus, Search, Filter, ArrowRight, ArrowLeft, Download, Copy, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { showToast } from '../utils/toast';
import AccessibleModal from '../components/AccessibleModal';
import StepIndicator from '../components/StepIndicator';
import CTCBuilder from '../components/Hiring/CTCBuilder';
import TemplateManager from '../components/Hiring/TemplateManager';
import { departments, designations } from '../data/mockData';
import { logAuditAction } from '../utils/auditLogger';
import { useAuth } from '../context/AuthContext';
import { renderTemplate } from '../utils/templateRenderer';

const OfferLetters = () => {
    const { currentUser } = useAuth();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const [renderedTemplate, setRenderedTemplate] = useState(null);

    // Offer State
    const [newOffer, setNewOffer] = useState({
        candidateName: '',
        candidateEmail: '',
        jobTitle: '',
        department: '',
        annualCTC: 500000,
        joiningDate: '',
        templateType: 'Full-time',
        status: 'Sent',
        place: 'Mumbai',
        reportingManager: '',
        breakdown: {},
        customData: {},
        selectedTemplateId: null
    });

    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const name = params.get('candidate');
        const email = params.get('email');
        const role = params.get('role');

        if (name || email || role) {
            setNewOffer(prev => ({
                ...prev,
                candidateName: name || '',
                candidateEmail: email || '',
                jobTitle: role || ''
            }));
            setShowCreateModal(true);
        }
    }, [location]);

    // Fetch templates
    useEffect(() => {
        const q = query(collection(db, 'offerTemplates'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTemplates(templatesData);

            // Set default template if available
            const defaultTemplate = templatesData.find(t => t.isDefault);
            if (defaultTemplate && !selectedTemplateId) {
                setSelectedTemplateId(defaultTemplate.id);
            }
        });
        return () => unsubscribe();
    }, [selectedTemplateId]);

    useEffect(() => {
        const q = query(collection(db, 'offers'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const offerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOffers(offerData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Render template when Step 3 is reached
    useEffect(() => {
        if (currentStep === 3) {
            renderTemplate(selectedTemplateId, templates, newOffer).then(html => {
                setRenderedTemplate(html);
            });
        }
    }, [currentStep, selectedTemplateId, templates, newOffer]);

    // Detect custom variables from selected template
    const getCustomVariables = () => {
        if (!selectedTemplateId) return [];
        const template = templates.find(t => t.id === selectedTemplateId);
        if (!template || !template.variables) return [];

        const standardVariables = [
            'candidateName', 'candidateEmail', 'jobTitle', 'department',
            'annualCTC', 'monthlyCTC', 'joiningDate', 'basicSalary',
            'hra', 'companyName', 'currentDate', 'place', 'workLocation',
            'reportingManager', 'probationPeriod', 'noticePeriod', 'designation'
        ];

        return template.variables.filter(v => !standardVariables.includes(v));
    };

    const handleCreateOffer = async () => {
        // Basic Validation
        if (!newOffer.candidateName || !newOffer.candidateEmail || !newOffer.jobTitle || !newOffer.department || !newOffer.joiningDate) {
            showToast.error('Please fill in all required fields');
            return;
        }

        if (isNaN(newOffer.annualCTC) || newOffer.annualCTC <= 0) {
            showToast.error('Please enter a valid Annual CTC');
            return;
        }

        setActionLoading(true);
        try {
            const docRef = await addDoc(collection(db, 'offers'), {
                ...newOffer,
                selectedTemplateId: selectedTemplateId, // Ensure template association is saved
                createdAt: serverTimestamp()
            });

            await logAuditAction({
                action: 'CREATE_OFFER',
                category: 'HIRING',
                performedBy: currentUser,
                targetId: docRef.id,
                targetName: newOffer.candidateName,
                details: {
                    role: newOffer.jobTitle,
                    ctc: newOffer.annualCTC,
                    email: newOffer.candidateEmail,
                    template: selectedTemplateId || 'Default'
                }
            });

            showToast.success('Offer letter generated and sent successfully!');
            setShowCreateModal(false);
            resetForm();
        } catch (error) {
            console.error('Error creating offer:', error);
            showToast.error('Failed to generate offer: ' + error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleResendOffer = async (offer) => {
        setActionLoading(true);
        try {
            await logAuditAction({
                action: 'RESEND_OFFER',
                category: 'HIRING',
                performedBy: currentUser,
                targetId: offer.id,
                targetName: offer.candidateName,
                details: {
                    role: offer.jobTitle,
                    email: offer.candidateEmail
                }
            });

            showToast.success(`Offer verification link resent to ${offer.candidateEmail}`);
        } catch (error) {
            console.error('Error resending offer:', error);
            showToast.error('Failed to resend offer notification');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDownloadPDF = async (offer) => {
        setActionLoading(true);
        console.log('[PDF_GEN] Starting stabilized export for:', offer.candidateName);

        let container = null;
        try {
            // 1. Render HTML
            const html = await renderTemplate(offer.selectedTemplateId || null, templates, offer);
            if (!html) throw new Error('Could not render template content');

            // 2. Setup Container (Fixed position to avoid layout shifts)
            container = document.createElement('div');
            container.id = 'stable-pdf-container';
            Object.assign(container.style, {
                width: '794px',
                padding: '40px',
                position: 'fixed',
                left: '-10000px',
                top: '0',
                background: 'white',
                color: '#000',
                zIndex: '-9999',
                fontFamily: 'serif'
            });

            container.innerHTML = `
                <style>
                    .pdf-capture-root {
                        font-family: 'Times New Roman', Times, serif;
                        color: #1a202c;
                        line-height: 1.6;
                        background: white;
                        padding: 0;
                        padding-bottom: 60px; /* Safety padding for footer */
                    }
                    .pdf-capture-root h1, .pdf-capture-root h2, .pdf-capture-root h3 {
                        color: #2d3748;
                        margin-top: 0;
                    }
                    .pdf-capture-root table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 15px 0;
                    }
                    .pdf-capture-root th, .pdf-capture-root td {
                        border: 1px solid #e2e8f0;
                        padding: 10px;
                        text-align: left;
                        font-size: 14px;
                    }
                    .pdf-capture-root strong {
                        color: #000;
                    }
                    .pdf-capture-root h1 { font-size: 28px; border-bottom: 2px solid #2d3748; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
                </style>
                <div class="pdf-capture-root">
                    ${html}
                </div>
            `;
            document.body.appendChild(container);

            // Wait for resources
            await new Promise(r => setTimeout(r, 600));

            // 3. Capture with html2canvas (Reduced scale for stability)
            const canvas = await html2canvas(container, {
                scale: 1.5,
                useCORS: true,
                allowTaint: false,
                logging: false,
                backgroundColor: '#ffffff',
                imageTimeout: 15000
            });

            // 4. Generate Multi-page PDF with Margins
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15; // 15mm top/bottom margin
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Height of physical content we show on one page
            const contentHeightPerPage = pageHeight - (margin * 2);

            let heightLeft = imgHeight;
            let position = margin; // Starting position on first page

            // Add pages with intelligent slicing
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= contentHeightPerPage;

            while (heightLeft > 0) {
                position = margin - (imgHeight - heightLeft);
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= contentHeightPerPage;
            }

            const fileName = `Offer_${offer.candidateName.replace(/\s+/g, '_')}.pdf`;
            pdf.save(fileName);
            showToast.success('PDF downloaded successfully!');

        } catch (error) {
            console.error('[PDF_GEN_ERROR]:', error);

            // Fallback: Download as HTML if PDF fails
            try {
                const html = await renderTemplate(offer.selectedTemplateId || null, templates, offer);
                const blob = new Blob([html], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Offer_${offer.candidateName.replace(/\s+/g, '_')}.html`;
                a.click();
                URL.revokeObjectURL(url);
                showToast.warning('PDF generation had memory issues. Saved as HTML.');
            } catch (fallbackError) {
                showToast.error('Download failed: ' + error.message);
            }
        } finally {
            if (container && container.parentNode) {
                document.body.removeChild(container);
            }
            setActionLoading(false);
        }
    };

    const resetForm = () => {
        setNewOffer({
            candidateName: '',
            candidateEmail: '',
            jobTitle: '',
            department: '',
            annualCTC: 500000,
            joiningDate: '',
            templateType: 'Full-time',
            status: 'Sent',
            place: 'Mumbai',
            reportingManager: '',
            breakdown: {},
            customData: {},
            selectedTemplateId: null
        });
        setCurrentStep(1);
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Accepted': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'Declined': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'Sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Candidate Name</label>
                                <Input
                                    placeholder="Enter full name"
                                    value={newOffer.candidateName}
                                    onChange={(e) => setNewOffer({ ...newOffer, candidateName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Candidate Email</label>
                                <Input
                                    placeholder="email@example.com"
                                    value={newOffer.candidateEmail}
                                    onChange={(e) => setNewOffer({ ...newOffer, candidateEmail: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Joining Date</label>
                                <Input
                                    type="date"
                                    value={newOffer.joiningDate}
                                    onChange={(e) => setNewOffer({ ...newOffer, joiningDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Template Type</label>
                                <select
                                    value={newOffer.templateType}
                                    onChange={(e) => setNewOffer({ ...newOffer, templateType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="Full-time">Full-time Employee</option>
                                    <option value="Intern">Internship</option>
                                    <option value="Contract">Contractual</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Job Title / Designation</label>
                                <select
                                    value={newOffer.jobTitle}
                                    onChange={(e) => setNewOffer({ ...newOffer, jobTitle: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Select Designation</option>
                                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Department</label>
                                <select
                                    value={newOffer.department}
                                    onChange={(e) => setNewOffer({ ...newOffer, department: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Place / Location</label>
                                <Input
                                    placeholder="e.g. Mumbai"
                                    value={newOffer.place}
                                    onChange={(e) => setNewOffer({ ...newOffer, place: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Reporting Manager</label>
                                <Input
                                    placeholder="Manager Name"
                                    value={newOffer.reportingManager}
                                    onChange={(e) => setNewOffer({ ...newOffer, reportingManager: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Template Selection */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center justify-between">
                                <span>Offer Letter Template</span>
                                <button
                                    type="button"
                                    onClick={() => setShowTemplateManager(true)}
                                    className="text-xs text-primary-600 hover:text-primary-700 font-normal normal-case"
                                >
                                    Manage Templates
                                </button>
                            </label>
                            <select
                                value={selectedTemplateId || ''}
                                onChange={(e) => setSelectedTemplateId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Use Default Template</option>
                                {templates.map(template => (
                                    <option key={template.id} value={template.id}>
                                        {template.name} {template.isDefault ? '(Default)' : ''}
                                    </option>
                                ))}
                            </select>
                            {templates.length === 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                    No custom templates available. Click "Manage Templates" to upload one.
                                </p>
                            )}
                        </div>

                        {/* Custom Variables Section */}
                        {getCustomVariables().length > 0 && (
                            <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl space-y-4 border border-primary-100 dark:border-primary-800">
                                <h4 className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase">Custom Template Fields</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {getCustomVariables().map(variable => (
                                        <div key={variable} className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase">{variable.replace(/([A-Z])/g, ' $1').trim()}</label>
                                            <Input
                                                placeholder={`Enter ${variable}`}
                                                value={newOffer.customData?.[variable] || ''}
                                                onChange={(e) => setNewOffer({
                                                    ...newOffer,
                                                    customData: {
                                                        ...newOffer.customData,
                                                        [variable]: e.target.value
                                                    }
                                                })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Total Annual CTC (INR)</label>
                            <Input
                                type="number"
                                value={newOffer.annualCTC || ''}
                                onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                    setNewOffer({ ...newOffer, annualCTC: val });
                                }}
                                className="text-lg font-bold"
                            />
                        </div>
                        <CTCBuilder
                            annualCTC={newOffer.annualCTC}
                            onChange={(br) => setNewOffer(prev => ({ ...prev, breakdown: br }))}
                        />
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-gray-50 dark:bg-gray-800/80 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                            <h4 className="font-serif text-xl text-center mb-6 text-gray-900 dark:text-white border-b pb-4">OFFER OF EMPLOYMENT</h4>
                            {renderedTemplate ? (
                                <div
                                    className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans"
                                    dangerouslySetInnerHTML={{ __html: renderedTemplate }}
                                />
                            ) : (
                                <div className="flex justify-center py-8">
                                    <Spinner />
                                </div>
                            )}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Offer Letter Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage, track, and generate employment offers</p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                    <Plus size={20} />
                    Create New Offer
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 flex items-center justify-between">
                    <div><p className="text-sm text-gray-500">Total Offers</p><p className="text-2xl font-bold">{offers.length}</p></div>
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-lg"><FileText size={24} /></div>
                </Card>
                <Card className="p-4 flex items-center justify-between text-blue-600">
                    <div><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold">{offers.filter(o => o.status === 'Sent').length}</p></div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Clock size={24} /></div>
                </Card>
                <Card className="p-4 flex items-center justify-between text-green-600">
                    <div><p className="text-sm text-gray-500">Accepted</p><p className="text-2xl font-bold">{offers.filter(o => o.status === 'Accepted').length}</p></div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
                </Card>
                <Card className="p-4 flex items-center justify-between text-red-600">
                    <div><p className="text-sm text-gray-500">Declined</p><p className="text-2xl font-bold">{offers.filter(o => o.status === 'Declined').length}</p></div>
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg"><XCircle size={24} /></div>
                </Card>
            </div>

            <Card className="overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <Input
                            placeholder="Search by candidate name or role..."
                            className="pl-10 h-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase tracking-wider text-gray-500">
                                <th className="px-6 py-4 font-semibold">Candidate</th>
                                <th className="px-6 py-4 font-semibold">Role & Department</th>
                                <th className="px-6 py-4 font-semibold">CTC (Annual)</th>
                                <th className="px-6 py-4 font-semibold">Joining Date</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {offers.filter(o => o.candidateName.toLowerCase().includes(searchTerm.toLowerCase())).map((offer) => (
                                <tr key={offer.id} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900 dark:text-white">{offer.candidateName}</div>
                                        <div className="text-xs text-gray-500">{offer.candidateEmail}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-gray-900 dark:text-white font-medium">{offer.jobTitle}</div>
                                        <div className="text-xs text-gray-500">{offer.department}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-primary-600">₹{(offer.annualCTC / 100000).toFixed(2)} LPA</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {new Date(offer.joiningDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(offer.status)}`}>
                                            {offer.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                title="Copy Offer Link"
                                                onClick={() => {
                                                    const link = `${window.location.origin}/offer/${offer.id}`;
                                                    navigator.clipboard.writeText(link);
                                                    showToast.success('Offer link copied to clipboard!');
                                                }}
                                            >
                                                <Copy size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                title="Download PDF"
                                                disabled={actionLoading}
                                                onClick={() => handleDownloadPDF(offer)}
                                            >
                                                <Download size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                title="Resend Notification"
                                                disabled={actionLoading}
                                                onClick={() => handleResendOffer(offer)}
                                            >
                                                <Mail size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Creation Modal */}
            <AccessibleModal
                isOpen={showCreateModal}
                onClose={() => { setShowCreateModal(false); resetForm(); }}
                title="Generate Employment Offer"
                size="lg"
            >
                <div className="space-y-6">
                    <StepIndicator
                        steps={['Candidate Info', 'Packages & CTC', 'Preview & Send']}
                        currentStep={currentStep}
                    />

                    <div className="mt-8 min-h-[350px]">
                        {renderStep()}
                    </div>

                    <div className="flex justify-between items-center pt-6 border-t dark:border-gray-700">
                        <Button
                            variant="secondary"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            disabled={currentStep === 1}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft size={18} /> Back
                        </Button>

                        {currentStep < 3 ? (
                            <Button
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                className="flex items-center gap-2"
                                disabled={currentStep === 1 && (!newOffer.candidateName || !newOffer.candidateEmail)}
                            >
                                Next Step <ArrowRight size={18} />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleCreateOffer}
                                disabled={actionLoading}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400"
                            >
                                {actionLoading ? (
                                    <Spinner size="sm" className="mr-2 border-white" />
                                ) : (
                                    <Send size={18} />
                                )}
                                {actionLoading ? 'Generating...' : 'Generate & Send Offer'}
                            </Button>
                        )}
                    </div>
                </div>
            </AccessibleModal>

            {/* Template Manager Modal */}
            <TemplateManager
                isOpen={showTemplateManager}
                onClose={() => setShowTemplateManager(false)}
            />
        </div>
    );
};

export default OfferLetters;
