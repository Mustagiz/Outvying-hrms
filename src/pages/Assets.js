import React, { useState } from 'react';
import { Card, Button } from '../components/UI';
import { Plus, Package, User, Calendar, Wrench } from 'lucide-react';
import { showToast } from '../utils/toast';

const Assets = () => {
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
            status: 'Assigned',
            condition: 'Good',
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
        return Package;
    };

    const stats = {
        total: assets.length,
        assigned: assets.filter((a) => a.status === 'Assigned').length,
        available: assets.filter((a) => a.status === 'Available').length,
        maintenance: assets.filter((a) => a.status === 'Maintenance').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Asset Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Track and manage company assets
                    </p>
                </div>
                <Button variant="primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Asset
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.total}
                            </p>
                        </div>
                        <Package className="w-8 h-8 text-blue-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Assigned</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.assigned}
                            </p>
                        </div>
                        <User className="w-8 h-8 text-green-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.available}
                            </p>
                        </div>
                        <Package className="w-8 h-8 text-purple-600" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.maintenance}
                            </p>
                        </div>
                        <Wrench className="w-8 h-8 text-orange-600" />
                    </div>
                </Card>
            </div>

            {/* Asset List */}
            <div className="grid grid-cols-1 gap-4">
                {assets.map((asset) => {
                    const Icon = getAssetIcon(asset.assetType);
                    return (
                        <Card key={asset.id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {asset.assetName}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                                                {asset.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Serial Number</p>
                                                <p className="text-sm text-gray-900 dark:text-white font-mono">
                                                    {asset.serialNumber}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {asset.assignedTo || 'Unassigned'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Purchase Date</p>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {new Date(asset.purchaseDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Warranty Expiry</p>
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {new Date(asset.warrantyExpiry).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 mt-3">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Condition: <span className="font-medium text-gray-900 dark:text-white">{asset.condition}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    {asset.status === 'Assigned' ? (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => showToast.success('Return workflow initiated')}
                                        >
                                            Return
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => showToast.success('Assignment workflow initiated')}
                                        >
                                            Assign
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default Assets;
