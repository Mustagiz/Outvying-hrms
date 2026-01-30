import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../config/firebase';
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, Button, Spinner, Badge } from '../components/UI';
import { CheckCircle, XCircle, FileText, MapPin, Calendar, Clock, Lock, Upload, Eye, AlertCircle } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import { showToast } from '../utils/toast';
import { getCurrentIP } from '../utils/ipValidation';
import { logAuditAction } from '../utils/auditLogger';
import { renderTemplate } from '../utils/templateRenderer';

const REQUIRED_DOCS = [
    { id: 'PAN_CARD', name: 'PAN Card', description: 'Government issued Permanent Account Number card' },
    { id: 'AADHAR_CARD', name: 'Aadhar Card', description: 'Front and back of your Aadhar card' },
    { id: 'HIGHEST_QUALIFICATION', name: 'Highest Qualification Degree', description: 'Certificate of your highest degree' },
    { id: 'RELIEVING_LETTER', name: 'Relieving Letter', description: 'Relieving letter from your previous employer (if applicable)' },
];

const CandidateOffer = () => {
    const { offerId } = useParams();
    const [offer, setOffer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [signature, setSignature] = useState(null);
    const [showDeclineReason, setShowDeclineReason] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [templates, setTemplates] = useState([]);
    const [renderedHtml, setRenderedHtml] = useState(null);

    // Document State
    const [uploadedDocs, setUploadedDocs] = useState({});
    const [uploadingDocId, setUploadingDocId] = useState(null);

    // Fetch documents subcollection
    useEffect(() => {
        if (!offerId) return;
        const q = query(collection(db, 'offers', offerId, 'documents'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = {};
            snapshot.docs.forEach(doc => {
                docs[doc.id] = { id: doc.id, ...doc.data() };
            });
            setUploadedDocs(docs);
        });
        return () => unsubscribe();
    }, [offerId]);

    const handleFileUpload = async (docTypeId, file) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showToast.error("File size must be less than 5MB");
            return;
        }

        setUploadingDocId(docTypeId);
        try {
            const storageRef = ref(storage, `onboarding/${offerId}/${docTypeId}_${Date.now()}`);
            await uploadBytes(storageRef, file);
            const url = await getDownloadURL(storageRef);

            await setDoc(doc(db, 'offers', offerId, 'documents', docTypeId), {
                name: REQUIRED_DOCS.find(d => d.id === docTypeId).name,
                type: docTypeId,
                url: url,
                fileName: file.name,
                uploadedAt: serverTimestamp(),
                status: 'Pending',
                notes: ''
            });

            showToast.success("Document uploaded successfully");
        } catch (error) {
            console.error("Upload error:", error);
            showToast.error("Failed to upload document");
        } finally {
            setUploadingDocId(null);
        }
    };

    // Fetch templates for rendering
    useEffect(() => {
        const q = query(collection(db, 'offerTemplates'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTemplates(templatesData);
        });
        return () => unsubscribe();
    }, []);

    // Render template once both offer and templates are loaded
    useEffect(() => {
        if (offer) {
            renderTemplate(offer.selectedTemplateId || null, templates, offer).then(html => {
                setRenderedHtml(html);
            });
        }
    }, [offer, templates]);

    useEffect(() => {
        const fetchOffer = async () => {
            try {
                const docRef = doc(db, 'offers', offerId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setOffer(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching offer:", error);
                showToast.error("Failed to load offer details");
            } finally {
                setLoading(false);
            }
        };
        fetchOffer();
    }, [offerId]);

    const handleAccept = async () => {
        if (!signature) {
            showToast.error("Please provide your signature to accept");
            return;
        }

        setActionLoading(true);
        try {
            const ip = await getCurrentIP();
            await updateDoc(doc(db, 'offers', offerId), {
                status: 'Accepted',
                acceptedAt: serverTimestamp(),
                signature: signature,
                acceptanceIP: ip
            });
            await logAuditAction({
                action: 'ACCEPT_OFFER',
                category: 'HIRING',
                performedBy: { name: offer.candidateName, role: 'Candidate', email: offer.candidateEmail },
                targetId: offerId,
                targetName: offer.candidateName,
                details: { ip: ip, role: offer.jobTitle }
            });
            setOffer(prev => ({ ...prev, status: 'Accepted' }));
            showToast.success("Offer accepted successfully! Welcome to Outvying.");
        } catch (error) {
            showToast.error("Failed to accept offer");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDecline = async () => {
        if (!declineReason) {
            showToast.error("Please provide a reason for declining");
            return;
        }

        setActionLoading(true);
        try {
            const ip = await getCurrentIP();
            await updateDoc(doc(db, 'offers', offerId), {
                status: 'Declined',
                declinedAt: serverTimestamp(),
                declineReason: declineReason,
                declineIP: ip
            });
            await logAuditAction({
                action: 'DECLINE_OFFER',
                category: 'HIRING',
                performedBy: { name: offer.candidateName, role: 'Candidate', email: offer.candidateEmail },
                targetId: offerId,
                targetName: offer.candidateName,
                details: { ip: ip, reason: declineReason }
            });
            setOffer(prev => ({ ...prev, status: 'Declined' }));
            showToast.success("Offer declined. We wish you the best for your future.");
        } catch (error) {
            showToast.error("Failed to decline offer");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
    if (!offer) return <div className="min-h-screen flex items-center justify-center">Offer not found</div>;


    if (offer.status === 'Accepted') return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-8 text-center space-y-8">
                <div className="space-y-4">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                        <CheckCircle size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome Aboard, {offer.candidateName.split(' ')[0]}!</h1>
                    <p className="text-gray-600 max-w-lg mx-auto">
                        We are thrilled to have you join us as our new <strong>{offer.jobTitle}</strong>.
                        Your acceptance has been recorded. Here is what happens next:
                    </p>
                </div>

                {/* Onboarding Roadmap */}
                <div className="relative border-l-2 border-gray-200 ml-6 md:ml-12 text-left space-y-8 py-4">

                    {/* Step 1: Completed */}
                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-500 ring-4 ring-green-100"></div>
                        <h4 className="font-bold text-gray-900 text-sm">Offer Accepted</h4>
                        <p className="text-xs text-gray-500 mt-1">
                            Completed on {offer.acceptedAt?.toDate().toLocaleDateString() || new Date().toLocaleDateString()}
                        </p>
                    </div>

                    {/* Step 2: Pending */}
                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-100 animate-pulse"></div>
                        <h4 className="font-bold text-gray-900 text-sm">Document Submission</h4>
                        <p className="text-xs text-gray-500 mt-1">
                            Our HR team will reach out shortly for ID proofs and educational documents.
                        </p>
                    </div>

                    {/* Step 3: Pending */}
                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-300"></div>
                        <h4 className="font-bold text-gray-400 text-sm">IT & Account Setup</h4>
                        <p className="text-xs text-gray-400 mt-1">
                            System access and email creation will be processed 2 days before joining.
                        </p>
                    </div>

                    {/* Step 4: Future */}
                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-300"></div>
                        <h4 className="font-bold text-gray-400 text-sm">Day 1: Orientation</h4>
                        <p className="text-xs text-gray-400 mt-1">
                            We look forward to seeing you on <strong>{offer.joiningDate || 'your joining date'}</strong>!
                        </p>
                    </div>
                </div>


                <div className="p-4 bg-blue-50 rounded-lg text-xs text-gray-600 flex items-center gap-3">
                    <Lock size={16} className="text-blue-500 shrink-0" />
                    <span>A copy of the signed offer letter has been sent to your email <strong>{offer.candidateEmail}</strong> for your records.</span>
                </div>

                <div className="border-t pt-8 text-left">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Document Wallet</h2>
                    <p className="text-sm text-gray-500 mb-6">Please upload the following documents to expedite your onboarding.</p>

                    <div className="space-y-4">
                        {REQUIRED_DOCS.map((docType) => {
                            const uploaded = uploadedDocs[docType.id];
                            const isPending = uploadingDocId === docType.id;

                            return (
                                <div key={docType.id} className="border rounded-lg p-4 bg-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-gray-800">{docType.name}</h4>
                                            {uploaded && (
                                                <Badge className={`
                                                    ${uploaded.status === 'Verified' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                                                    ${uploaded.status === 'Rejected' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                                                    ${uploaded.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : ''}
                                                `}>
                                                    {uploaded.status}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{docType.description}</p>

                                        {uploaded && uploaded.status === 'Rejected' && uploaded.notes && (
                                            <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded flex items-start gap-2">
                                                <AlertCircle size={12} className="mt-0.5" />
                                                <span>Reason: {uploaded.notes}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {uploaded ? (
                                            <div className="flex flex-col items-end gap-2">
                                                <span className="text-xs text-gray-400 font-mono">{uploaded.fileName}</span>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        className="h-8 text-xs bg-gray-100 hover:bg-gray-200"
                                                        onClick={() => window.open(uploaded.url, '_blank')}
                                                    >
                                                        <Eye size={12} className="mr-1" /> View
                                                    </Button>
                                                    {uploaded.status !== 'Verified' && (
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                onChange={(e) => handleFileUpload(docType.id, e.target.files[0])}
                                                                disabled={isPending}
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                            />
                                                            <Button size="sm" className="h-8 text-xs" disabled={isPending}>
                                                                {isPending ? <Spinner size="sm" /> : <Upload size={12} className="mr-1" />} Re-upload
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => handleFileUpload(docType.id, e.target.files[0])}
                                                    disabled={isPending}
                                                    accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    disabled={isPending}
                                                    className="shadow-sm"
                                                >
                                                    {isPending ? <Spinner size="sm" color="white" /> : (
                                                        <>
                                                            <Upload size={14} className="mr-2" /> Upload
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );

    if (offer.status === 'Declined') return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                    <XCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Offer Declined</h1>
                <p className="text-gray-600">The offer for {offer.jobTitle} has been declined. Thank you for your time.</p>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-primary-600 italic">OUTVYING HRMS</h1>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <Lock size={14} /> Secure Document Access
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Offer Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-0 overflow-hidden border-none shadow-lg">
                            <div className="bg-primary-600 p-6 text-white text-center">
                                <h2 className="text-2xl font-serif uppercase tracking-widest">Letter of Intent</h2>
                                <p className="opacity-80 text-sm mt-1">Official Employment Offer</p>
                            </div>
                            <div className="p-8 space-y-8 bg-white">
                                {renderedHtml ? (
                                    <div
                                        className="dynamic-offer-content"
                                        dangerouslySetInnerHTML={{ __html: renderedHtml }}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                                        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                                    </div>
                                )}

                                <div className="pt-8 text-gray-500 text-xs italic leading-relaxed border-t mt-8">
                                    <p>* This offer is contingent upon successful verification of your professional credentials and background check. Please review the attached terms and conditions for full details on leaves, probation, and confidentiality.</p>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Right: Actions */}
                    <div className="space-y-6">
                        {!showDeclineReason ? (
                            <Card className="p-6 space-y-6 shadow-lg border-t-4 border-t-primary-600">
                                <h3 className="font-bold text-gray-900">Review & Sign</h3>
                                <p className="text-xs text-gray-500">Please sign in the box below to electronically accept this offer.</p>

                                <div className="border rounded-lg bg-gray-50 overflow-hidden h-[150px]">
                                    <SignaturePad onSave={(img) => setSignature(img)} />
                                </div>

                                <div className="space-y-3 pt-4">
                                    <Button
                                        className="w-full h-12 text-lg font-bold"
                                        onClick={handleAccept}
                                        loading={actionLoading}
                                        disabled={!signature}
                                    >
                                        Accept Offer
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className="w-full text-red-600 hover:bg-red-50"
                                        onClick={() => setShowDeclineReason(true)}
                                    >
                                        Decline Offer
                                    </Button>
                                </div>
                            </Card>
                        ) : (
                            <Card className="p-6 space-y-4 shadow-lg border-t-4 border-t-red-600">
                                <h3 className="font-bold text-gray-900">Decline Offer</h3>
                                <p className="text-xs text-gray-500">We are sorry to hear that. Could you please share the reason for declining?</p>
                                <textarea
                                    className="w-full p-3 border rounded-lg text-sm bg-gray-50 focus:ring-1 focus:ring-red-500 outline-none"
                                    rows="4"
                                    placeholder="e.g. Better opportunity elsewhere, Salary mismatch..."
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                ></textarea>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="secondary" onClick={() => setShowDeclineReason(false)}>Back</Button>
                                    <Button className="bg-red-600 hover:bg-red-700" onClick={handleDecline} loading={actionLoading}>Confirm Decline</Button>
                                </div>
                            </Card>
                        )}

                        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                            Powered by Outvying HRMS
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateOffer;
