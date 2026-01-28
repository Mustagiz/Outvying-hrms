import React, { useState } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { Plus, Package, User, Calendar, Wrench, QrCode, Monitor, Smartphone, Cpu } from 'lucide-react';
import { showToast } from '../utils/toast';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';

const Assets = () => {
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [showQR, setShowQR] = useState(false);

    const [assets, setAssets] = useState([
        {
            id: '1',
            assetType: 'Laptop',
            assetName: 'Dell Latitude 5520',
            serialNumber: 'DL5520-2024-001',
            purchaseDate: '2024-06-15',
            warrantyExpiry: '2027-06-15',
            assignedTo: 'John Doe',
            status: 'Assigned',
            condition: 'Good',
        },
        {
            id: '2',
            assetType: 'Monitor',
            assetName: 'LG 27" 4K Monitor',
            serialNumber: 'LG27-2024-045',
            purchaseDate: '2024-08-20',
            warrantyExpiry: '2027-08-20',
            assignedTo: null,
            status: 'Available',
            condition: 'Excellent',
        },
        {
            id: '3',
            assetType: 'Mobile',
            assetName: 'iPhone 14 Pro',
            serialNumber: 'IP14P-2024-012',
            purchaseDate: '2024-09-10',
            warrantyExpiry: '2025-09-10',
            assignedTo: 'Sarah Smith',
            status: 'Maintenance',
            condition: 'Broken Screen',
        },
    ]);

    const getStatusColor = (status) => {
        const colors = {
            Available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            Assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            Maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            Retired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        };
        return colors[status] || colors.Available;
    };

    const getAssetIcon = (type) => {
        switch (type) {
            case 'Laptop': return Cpu;
            case 'Monitor': return Monitor;
            case 'Mobile': return Smartphone;
            default: return Package;
        }
    };

    const handleViewQR = (asset) => {
        setSelectedAsset(asset);
        setShowQR(true);
    };

    const stats = {
        total: assets.length,
        assigned: assets.filter((a) => a.status === 'Assigned').length,
        available: assets.filter((a) => a.status === 'Available').length,
        maintenance: assets.filter((a) => a.status === 'Maintenance').length,
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <Cpu className="text-blue-600" size={32} />
                        Smart Assets
                    </h1>
                    <p className="text-gray-500 mt-1">Manage hardware lifecycle with QR tracking.</p>
                </div>
                <Button className="bg-blue-600 shadow-lg shadow-blue-500/30">
                    <Plus className="w-4 h-4 mr-2" /> Add New Asset
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Assets', val: stats.total, icon: Package, bg: 'bg-blue-100', color: 'text-blue-600' },
                    { label: 'Assigned', val: stats.assigned, icon: User, bg: 'bg-green-100', color: 'text-green-600' },
                    { label: 'In Stock', val: stats.available, icon: Package, bg: 'bg-purple-100', color: 'text-purple-600' },
                    { label: 'Repairs', val: stats.maintenance, icon: Wrench, bg: 'bg-orange-100', color: 'text-orange-600' }
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        key={i} className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center gap-4"
                    >
                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} mb-auto`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.val}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Asset Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {assets.map((asset, idx) => {
                    const Icon = getAssetIcon(asset.assetType);
                    return (
                        <motion.div
                            key={asset.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <div className="group bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all p-6 relative overflow-hidden">
                                {asset.status === 'Available' && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-green-400/20 to-transparent rounded-bl-full" />}

                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                                            <Icon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{asset.assetName}</h3>
                                            <p className="text-xs text-gray-500 font-mono mt-1">{asset.serialNumber}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleViewQR(asset)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 hover:text-blue-600 transition-colors"
                                    >
                                        <QrCode size={20} />
                                    </button>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Status</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide ${getStatusColor(asset.status)}`}>
                                            {asset.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Assigned To</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{asset.assignedTo || '—'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Warranty</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{new Date(asset.warrantyExpiry).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1 text-xs py-2 rounded-xl">Edit</Button>
                                    <Button
                                        className={`flex-1 text-xs py-2 rounded-xl ${asset.status === 'Available' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
                                    >
                                        {asset.status === 'Available' ? 'Assign' : 'Return'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* QR Code Modal */}
            <AnimatePresence>
                {showQR && selectedAsset && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative"
                        >
                            <h3 className="text-xl font-black text-gray-900 mb-2">{selectedAsset.assetName}</h3>
                            <p className="text-gray-500 font-mono text-sm mb-6">{selectedAsset.serialNumber}</p>

                            <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-100 inline-block mb-6">
                                <QRCode
                                    value={JSON.stringify({ id: selectedAsset.id, sn: selectedAsset.serialNumber })}
                                    size={180}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button className="flex-1 rounded-xl" onClick={() => window.print()}>Print Label</Button>
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowQR(false)}>Close</Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Assets;
