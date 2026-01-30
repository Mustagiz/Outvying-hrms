import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Card, Button, Badge } from '../UI';
import { UserPlus, Clock, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { showToast } from '../../utils/toast';

const OnboardingQueue = ({ onPromote, onSelect, selectedCandidateId }) => {
    const [joiners, setJoiners] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'offers'), where('status', '==', 'Accepted'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const joinerData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setJoiners(joinerData);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    if (loading) return <div className="p-4 text-center text-gray-400">Loading joiners...</div>;

    return (
        <Card className="overflow-hidden border-none shadow-lg">
            <div className="p-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Clock size={22} /> Onboarding Queue
                </h3>
                <p className="text-primary-100 text-sm opacity-80 mt-1">
                    Candidates who have accepted offers. Click to manage checklist.
                </p>
            </div>

            <div className="divide-y dark:divide-gray-800 bg-white dark:bg-gray-900">
                {joiners.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <UserPlus size={48} className="mx-auto opacity-20 mb-4" />
                        <p>No candidates in the queue</p>
                    </div>
                ) : (
                    joiners.map((joiner) => (
                        <div
                            key={joiner.id}
                            onClick={() => onSelect && onSelect(joiner)}
                            className={`p-6 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer border-l-4 ${selectedCandidateId === joiner.id
                                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-lg">
                                    {joiner.candidateName[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{joiner.candidateName}</h4>
                                    <p className="text-sm text-gray-500">{joiner.jobTitle} • {joiner.department}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold border-green-200 text-green-600 bg-green-50">Offer Accepted</Badge>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Calendar size={10} /> Joined on {joiner.joiningDate}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex items-center gap-1"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/offer/${joiner.id}`, '_blank');
                                    }}
                                >
                                    <FileText size={14} /> View Offer
                                </Button>
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1 shadow-md shadow-green-500/20"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPromote(joiner);
                                    }}
                                >
                                    <UserPlus size={14} /> Promote
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
};

// Internal icon dependency fix
const Calendar = ({ size }) => <span style={{ width: size, height: size }} className="inline-block"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>;

export default OnboardingQueue;
