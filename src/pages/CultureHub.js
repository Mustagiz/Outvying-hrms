import React, { useState } from 'react';
import {
    Trophy, Award, Heart, MessageSquare, Star, Users, TrendingUp, Zap, Gift, Smile, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import {
    collection, addDoc, updateDoc, deleteDoc, doc, setDoc,
    onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { Card, Button, Input, Select as UISelect } from '../components/UI';
import { showToast } from '../utils/toast';

const iconMap = {
    Trophy, Award, Heart, MessageSquare, Star, Users, TrendingUp, Zap, Gift, Smile
};

const colorMap = [
    { label: 'Blue', color: 'text-blue-500', bg: 'bg-blue-100' },
    { label: 'Yellow', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { label: 'Green', color: 'text-green-500', bg: 'bg-green-100' },
    { label: 'Purple', color: 'text-purple-500', bg: 'bg-purple-100' },
    { label: 'Red', color: 'text-red-500', bg: 'bg-red-100' },
    { label: 'Orange', color: 'text-orange-500', bg: 'bg-orange-100' }
];

const CultureHub = () => {
    const { currentUser, allUsers } = useAuth();
    const [activeTab, setActiveTab] = useState('recognition');
    const [showKudosModal, setShowKudosModal] = useState(false);

    // Firestore Data
    const [kudos, setKudos] = useState([]);
    const [badges, setBadges] = useState([]);
    const [cultureSettings, setCultureSettings] = useState(null);

    // Admin Management State
    const [manageTab, setManageTab] = useState('badges');
    const [newBadge, setNewBadge] = useState({ title: '', desc: '', icon: 'Zap', color: 'Blue' });
    const [spotlight, setSpotlight] = useState({ employeeId: '', shoutout: '' });

    // Fetch Kudos
    React.useEffect(() => {
        const q = query(collection(db, 'cultureKudos'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            setKudos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    // Fetch Badges
    React.useEffect(() => {
        const unsub = onSnapshot(collection(db, 'cultureBadges'), (snapshot) => {
            setBadges(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsub();
    }, []);

    // Fetch Settings (Spotlight)
    React.useEffect(() => {
        const unsub = onSnapshot(doc(db, 'cultureSettings', 'dashboard'), (doc) => {
            if (doc.exists()) {
                setCultureSettings(doc.data());
                setSpotlight(doc.data().spotlight || { employeeId: '', shoutout: '' });
            }
        });
        return () => unsub();
    }, []);

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'hr' || currentUser.role === 'super_admin';

    const handleGiveKudos = async (e) => {
        e.preventDefault();
        const reader = new FormData(e.target);
        const toId = reader.get('toId');
        const targetUser = allUsers.find(u => u.id === toId);

        const data = {
            from: currentUser.name,
            fromId: currentUser.id,
            to: targetUser?.name || 'Unknown',
            toId: toId,
            msg: reader.get('msg'),
            reactions: 0,
            createdAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, 'cultureKudos'), data);
            setShowKudosModal(false);
            showToast.success('Kudos sent successfully! ✨');
        } catch (error) {
            showToast.error('Failed to send kudos');
        }
    };

    const handleAddBadge = async () => {
        if (!newBadge.title || !newBadge.desc) return;
        const colorData = colorMap.find(c => c.label === newBadge.color);
        try {
            await addDoc(collection(db, 'cultureBadges'), {
                ...newBadge,
                color: colorData.color,
                bg: colorData.bg,
                createdAt: serverTimestamp()
            });
            setNewBadge({ title: '', desc: '', icon: 'Zap', color: 'Blue' });
            showToast.success('Badge added successfully');
        } catch (error) {
            showToast.error('Failed to add badge');
        }
    };

    const handleDeleteBadge = async (id) => {
        if (!window.confirm('Delete this badge?')) return;
        try {
            await deleteDoc(doc(db, 'cultureBadges', id));
            showToast.success('Badge deleted');
        } catch (error) {
            showToast.error('Failed to delete badge');
        }
    };

    const handleUpdateSpotlight = async () => {
        try {
            await setDoc(doc(db, 'cultureSettings', 'dashboard'), { spotlight }, { merge: true });
            showToast.success('Spotlight updated');
        } catch (error) {
            showToast.error('Failed to update spotlight');
        }
    };

    const handleDeleteKudo = async (id) => {
        if (!window.confirm('Moderate this kudo by deleting it?')) return;
        try {
            await deleteDoc(doc(db, 'cultureKudos', id));
            showToast.success('Kudo moderated');
        } catch (error) {
            showToast.error('Failed to moderate kudo');
        }
    };

    const spotlightEmployee = allUsers.find(u => u.id === cultureSettings?.spotlight?.employeeId);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">Culture Hub</h1>
                    <p className="text-indigo-100 max-w-xl">Celebrate wins, recognize teammates, and track your growth within the Outvying family.</p>
                </div>
                <Trophy className="absolute right-8 bottom-0 w-48 h-48 text-white/10 -rotate-12" />
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-gray-100 dark:border-gray-800 pb-px">
                {['recognition', 'badges', 'wellness', ...(isAdmin ? ['manage'] : [])].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 px-4 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Feed or Gallery */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'recognition' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Heart className="text-red-500 fill-red-500" size={20} />
                                    Wall of Rainmakers
                                </h2>
                                <button
                                    onClick={() => setShowKudosModal(true)}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-blue-600 hover:shadow-md transition-all flex items-center gap-2"
                                >
                                    <Star size={16} />
                                    Give Kudos
                                </button>
                            </div>

                            {kudos.map((kudo, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={kudo.id}
                                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 flex items-center justify-center text-blue-600 font-bold border-2 border-white dark:border-gray-700 flex-shrink-0">
                                            {kudo.from[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white">
                                                    {kudo.from} <span className="text-gray-400 font-normal mx-1">recognized</span> {kudo.to}
                                                </h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-gray-400 uppercase font-bold">
                                                        {kudo.createdAt?.toDate ? kudo.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                                    </span>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => handleDeleteKudo(kudo.id)}
                                                            className="text-red-400 hover:text-red-600 p-1"
                                                            title="Delete/Moderate"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                                                "{kudo.msg}"
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <button className="flex items-center gap-1.5 text-xs text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full hover:scale-105 transition-transform">
                                                    <Smile size={14} />
                                                    {kudo.reactions || 0} Cheers
                                                </button>
                                                <button className="text-xs text-gray-400 font-bold hover:text-blue-500">Add Reaction</button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {kudos.length === 0 && (
                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-400 italic">No kudos yet. Be the first to recognize someone!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'badges' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {badges.map((badge) => {
                                const Icon = iconMap[badge.icon] || Zap;
                                return (
                                    <div
                                        key={badge.id}
                                        className={`p-6 rounded-2xl border-2 transition-all relative ${badge.earned !== false
                                            ? 'border-blue-100 bg-white dark:bg-gray-800 dark:border-gray-700'
                                            : 'border-dashed border-gray-200 dark:border-gray-800 opacity-60 grayscale'
                                            }`}
                                    >
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteBadge(badge.id)}
                                                className="absolute top-4 right-4 text-red-400 hover:text-red-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                        <div className={`w-14 h-14 rounded-2xl ${badge.bg} ${badge.color} flex items-center justify-center mb-4 shadow-sm`}>
                                            <Icon size={28} />
                                        </div>
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{badge.title}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-2 mb-4">{badge.desc}</p>
                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${badge.earned !== false ? 'text-green-500' : 'text-gray-400'}`}>
                                                {badge.earned !== false ? 'Active' : 'Locked'}
                                            </span>
                                            {badge.earned !== false && <Award size={16} className="text-blue-500" />}
                                        </div>
                                    </div>
                                );
                            })}
                            {badges.length === 0 && (
                                <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <p className="text-gray-400 italic">No cultural badges configured yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'manage' && isAdmin && (
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center gap-4 border-b border-gray-50 dark:border-gray-700 pb-4 mb-6">
                                    {['badges', 'spotlight', 'moderation'].map(mTab => (
                                        <button
                                            key={mTab}
                                            onClick={() => setManageTab(mTab)}
                                            className={`text-xs font-black uppercase tracking-[0.15em] px-4 py-2 rounded-xl transition-all ${manageTab === mTab ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                                        >
                                            {mTab}
                                        </button>
                                    ))}
                                </div>

                                {manageTab === 'badges' && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-lg mb-2">Create New Cultutral Badge</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Badge Title"
                                                value={newBadge.title}
                                                onChange={e => setNewBadge({ ...newBadge, title: e.target.value })}
                                                placeholder="e.g. Culture Champ"
                                            />
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                                <input
                                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl outline-none focus:ring-2 ring-blue-500"
                                                    value={newBadge.desc}
                                                    onChange={e => setNewBadge({ ...newBadge, desc: e.target.value })}
                                                    placeholder="e.g. For outstanding teamwork"
                                                />
                                            </div>
                                            <UISelect
                                                label="Icon"
                                                value={newBadge.icon}
                                                onChange={e => setNewBadge({ ...newBadge, icon: e.target.value })}
                                                options={Object.keys(iconMap).map(k => ({ label: k, value: k }))}
                                            />
                                            <UISelect
                                                label="Theme Color"
                                                value={newBadge.color}
                                                onChange={e => setNewBadge({ ...newBadge, color: e.target.value })}
                                                options={colorMap.map(c => ({ label: c.label, value: c.label }))}
                                            />
                                        </div>
                                        <Button onClick={handleAddBadge} className="w-full mt-4">Create Badge</Button>
                                    </div>
                                )}

                                {manageTab === 'spotlight' && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-lg mb-2">Update Employee Spotlight</h3>
                                        <div className="space-y-4">
                                            <UISelect
                                                label="Select Employee"
                                                value={spotlight.employeeId}
                                                onChange={e => setSpotlight({ ...spotlight, employeeId: e.target.value })}
                                                options={allUsers.map(u => ({ label: u.name, value: u.id }))}
                                            />
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Shoutout Text</label>
                                                <textarea
                                                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl outline-none focus:ring-2 ring-blue-500 min-h-[100px]"
                                                    value={spotlight.shoutout}
                                                    onChange={e => setSpotlight({ ...spotlight, shoutout: e.target.value })}
                                                    placeholder="Why is this person being spotlighted?"
                                                />
                                            </div>
                                            <Button onClick={handleUpdateSpotlight} className="w-full">Update Wall of Fame</Button>
                                        </div>
                                    </div>
                                )}

                                {manageTab === 'moderation' && (
                                    <div className="space-y-4">
                                        <h3 className="font-bold text-lg mb-2">Kudos Moderation</h3>
                                        <p className="text-sm text-gray-500">Admins can see all kudos and remove inappropriate content.</p>
                                        <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                            {kudos.map(k => (
                                                <div key={k.id} className="py-4 flex justify-between items-start gap-4">
                                                    <div>
                                                        <p className="text-sm font-bold">{k.from} → {k.to}</p>
                                                        <p className="text-xs text-gray-500">{k.msg}</p>
                                                    </div>
                                                    <Button variant="secondary" onClick={() => handleDeleteKudo(k.id)} className="text-red-500 h-8 text-[10px]">Remove</Button>
                                                </div>
                                            ))}
                                            {kudos.length === 0 && <p className="text-center py-6 text-gray-400 italic">No kudos to moderate.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'wellness' && (
                        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 text-center space-y-6">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Smile size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">How are you feeling today?</h2>
                            <p className="text-gray-500 max-w-sm mx-auto">Your mental health matters. Share your mood anonymously to help us build a better workplace.</p>
                            <div className="flex justify-center gap-4 py-4">
                                {['🤩', '😊', '😐', '😔', '😫'].map((emoji, i) => (
                                    <button key={i} className="text-4xl p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all transform hover:scale-110 active:scale-95">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                            <div className="pt-8 border-t border-gray-50 dark:border-gray-700">
                                <div className="flex items-center justify-between text-sm font-bold mb-2">
                                    <span className="text-gray-500">Team Happiness Index</span>
                                    <span className="text-blue-600">8.4 / 10</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 w-[84%]" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Stats & Spotlight */}
                <div className="space-y-6">
                    {/* Spotlight */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 p-6 rounded-3xl border border-yellow-100 dark:border-yellow-900/20">
                        <div className="flex items-center gap-2 text-orange-600 font-bold text-xs uppercase tracking-widest mb-4">
                            <Star size={16} fill="currentColor" />
                            Employee of the Month
                        </div>
                        <div className="text-center">
                            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 mx-auto mb-4 shadow-xl overflow-hidden bg-white">
                                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-black">
                                    {spotlightEmployee?.name ? spotlightEmployee.name[0] : '?'}
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{spotlightEmployee?.name || 'To Be Announced'}</h3>
                            <p className="text-sm text-gray-500 mb-6">{spotlightEmployee?.designation || 'Outvying Member'}</p>
                            <div className="bg-white/60 dark:bg-black/20 p-4 rounded-2xl text-xs text-gray-600 dark:text-gray-400 italic">
                                "{cultureSettings?.spotlight?.shoutout || 'Coming soon...'}"
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Your Culture Stats</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Gift className="text-purple-500" size={18} />
                                    <span className="text-sm font-medium">Kudos Received</span>
                                </div>
                                <span className="font-black">12</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Zap className="text-yellow-500" size={18} />
                                    <span className="text-sm font-medium">Badges Earned</span>
                                </div>
                                <span className="font-black">2</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Smile className="text-green-500" size={18} />
                                    <span className="text-sm font-medium">Mood Streak</span>
                                </div>
                                <span className="font-black">5 Days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Kudos Modal (Simplified) */}
            <AnimatePresence>
                {showKudosModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">Give Kudos</h3>
                                <button onClick={() => setShowKudosModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleGiveKudos} className="space-y-4">
                                <div>
                                    <label className="text-xs font-black uppercase text-gray-400 mb-2 block tracking-widest">Select Toammate</label>
                                    <select
                                        name="toId"
                                        required
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl outline-none focus:ring-2 ring-blue-500 text-gray-900 dark:text-white"
                                        onChange={(e) => {
                                            const u = allUsers.find(user => user.id === e.target.value);
                                            // Selection logic if needed or just use hidden input
                                        }}
                                    >
                                        <option value="">Select a teammate...</option>
                                        {allUsers.filter(u => u.id !== currentUser.id).map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black uppercase text-gray-400 mb-2 block tracking-widest">Your Message</label>
                                    <textarea
                                        name="msg"
                                        required
                                        placeholder="Tell them why they're awesome..."
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl outline-none focus:ring-2 ring-blue-500 min-h-[120px] text-gray-900 dark:text-white"
                                    />
                                </div>
                                <Button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95">
                                    Send Recognition ✨
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CultureHub;
