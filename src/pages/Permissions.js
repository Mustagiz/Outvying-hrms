/**
 * Permissions Management Page
 * Allows Super Admins to define custom roles and permission matrices
 */

import React, { useState } from 'react';
import { Shield, ShieldAlert, Check, X, Save, Lock, UserCog } from 'lucide-react';
import { PERMISSIONS, DEFAULT_ROLES } from '../utils/permissionsHelper';
import { motion } from 'framer-motion';

const Permissions = () => {
    const [roles, setRoles] = useState([
        { id: '1', name: 'Super Admin', permissions: ['*'], count: 2 },
        { id: '2', name: 'HR Manager', permissions: ['employees.*', 'attendance.approve'], count: 5 },
        { id: '3', name: 'Finance Lead', permissions: ['payroll.*'], count: 3 },
    ]);

    const [selectedRole, setSelectedRole] = useState(roles[0]);

    const togglePermission = (permissionKey) => {
        if (selectedRole.name === 'Super Admin') return; // Cannot modify super admin

        const currentPerms = [...selectedRole.permissions];
        const index = currentPerms.indexOf(permissionKey);

        if (index > -1) {
            currentPerms.splice(index, 1);
        } else {
            currentPerms.push(permissionKey);
        }

        const updatedRole = { ...selectedRole, permissions: currentPerms };
        setSelectedRole(updatedRole);
        setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h1>
                    <p className="text-gray-600 dark:text-gray-400">Define custom permissions and access levels for different staff roles.</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                    <UserCog size={20} />
                    Create New Role
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Role List */}
                <div className="lg:col-span-1 space-y-4">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            onClick={() => setSelectedRole(role)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${selectedRole.id === role.id
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-400'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold">{role.name}</span>
                                <Shield size={16} className={selectedRole.id === role.id ? 'text-blue-200' : 'text-blue-500'} />
                            </div>
                            <p className={`text-xs ${selectedRole.id === role.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                {role.count} Assigned Users
                            </p>
                        </button>
                    ))}
                </div>

                {/* Permissions Matrix */}
                <div className="lg:col-span-3">
                    <motion.div
                        key={selectedRole.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                    <Lock size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedRole.name} Permissions</h2>
                                    <p className="text-xs text-gray-500">Configure access to specific modules and actions</p>
                                </div>
                            </div>
                            <button className="px-6 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 font-bold hover:bg-green-700 transition-all active:scale-95">
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>

                        <div className="p-6">
                            {Object.entries(PERMISSIONS).map(([category, actions]) => (
                                <div key={category} className="mb-10 last:mb-0">
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                        {category}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(actions).map(([label, value]) => {
                                            const isActive = selectedRole.permissions.includes(value) || selectedRole.permissions.includes('*');
                                            const isRestricted = selectedRole.name === 'Super Admin';

                                            return (
                                                <button
                                                    key={value}
                                                    disabled={isRestricted}
                                                    onClick={() => togglePermission(value)}
                                                    className={`group relative flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all ${isActive
                                                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                                                            : 'border-gray-50 dark:border-gray-700 bg-gray-50/10 hover:border-gray-200'
                                                        } ${isRestricted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isActive
                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                                                        }`}>
                                                        {isActive && <Check size={14} strokeWidth={4} />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {label.replace('_', ' ')}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{value}</p>
                                                    </div>
                                                    {isRestricted && (
                                                        <ShieldAlert size={14} className="absolute top-2 right-2 text-blue-500/30" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Permissions;
