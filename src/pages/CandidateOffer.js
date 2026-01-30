import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, Button, Spinner } from '../components/UI';
import { CheckCircle, XCircle, FileText, MapPin, Calendar, Clock, Lock } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import { showToast } from '../utils/toast';
import { getCurrentIP } from '../utils/ipValidation';
import { logAuditAction } from '../utils/auditLogger';
import { renderTemplate } from '../utils/templateRenderer';
import { collection, onSnapshot, query } from 'firebase/firestore';

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
            <Card className="max-w-md w-full p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Offer Accepted!</h1>
                <p className="text-gray-600">Congratulations {offer.candidateName}! You have successfully accepted the offer for the position of <strong>{offer.jobTitle}</strong>.</p>
                <div className="p-4 bg-gray-50 rounded-lg text-xs text-left text-gray-500 space-y-1">
                    <p>Accepted On: {new Date().toLocaleString()}</p>
                    <p>Audit Log: Signature Stored & IP Logged</p>
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
