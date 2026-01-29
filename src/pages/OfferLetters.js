import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '../config/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { Card, Button, Input, Select, Spinner } from '../components/UI';
import { FileText, Send, CheckCircle, XCircle, Clock, Plus, Search, Filter, ArrowRight, ArrowLeft, Download, Copy } from 'lucide-react';
import { showToast } from '../utils/toast';
import AccessibleModal from '../components/AccessibleModal';
import StepIndicator from '../components/StepIndicator';
import CTCBuilder from '../components/Hiring/CTCBuilder';
import { departments, designations } from '../data/mockData';
import { logAuditAction } from '../utils/auditLogger';
import { useAuth } from '../context/AuthContext';

const OfferLetters = () => {
    const { currentUser } = useAuth();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

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
        breakdown: {}
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

    useEffect(() => {
        const q = query(collection(db, 'offers'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const offerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setOffers(offerData);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

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
                    email: newOffer.candidateEmail
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
            breakdown: {}
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
                                <label className="text-xs font-bold text-gray-500 uppercase">Job Title</label>
                                <Select
                                    value={newOffer.jobTitle}
                                    onChange={(e) => setNewOffer({ ...newOffer, jobTitle: e.target.value })}
                                >
                                    <option value="">Select Designation</option>
                                    {designations.map(d => <option key={d} value={d}>{d}</option>)}
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Department</label>
                                <Select
                                    value={newOffer.department}
                                    onChange={(e) => setNewOffer({ ...newOffer, department: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </Select>
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
                                <Select
                                    value={newOffer.templateType}
                                    onChange={(e) => setNewOffer({ ...newOffer, templateType: e.target.value })}
                                >
                                    <option value="Full-time">Full-time Employee</option>
                                    <option value="Intern">Internship</option>
                                    <option value="Contract">Contractual</option>
                                </Select>
                            </div>
                        </div>
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
                            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                                <p>Dear <strong>{newOffer.candidateName || '[Name]'}</strong>,</p>
                                <p>We are delighted to offer you the position of <strong>{newOffer.jobTitle || '[Role]'}</strong> in our <strong>{newOffer.department || '[Dept]'}</strong> department at Outvying. Your joining date is confirmed as <strong>{newOffer.joiningDate || '[Date]'}</strong>.</p>
                                <p>Your total annual compensation package will be <strong>₹{newOffer.annualCTC.toLocaleString()}</strong>, with a monthly gross of <strong>₹{Math.round(newOffer.annualCTC / 12).toLocaleString()}</strong>.</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>Basic Salary: ₹{newOffer.breakdown?.basic?.toLocaleString() || '0'}</li>
                                    <li>Provident Fund: Comprehensive protection plan</li>
                                    <li>Probation Period: 6 Months</li>
                                </ul>
                                <p className="mt-4 italic">Welcome to the team!</p>
                            </div>
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
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Download PDF"><Download size={16} /></Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Resend"><Send size={16} /></Button>
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
        </div>
    );
};

export default OfferLetters;
