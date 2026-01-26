import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Alert } from '../components/UI';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const RosterFix = () => {
    const { rosters } = useAuth();
    const [alert, setAlert] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const fixAllRosters = async () => {
        if (!window.confirm('This will update ALL rosters to use Asia/Kolkata timezone and 5-minute grace period. Continue?')) {
            return;
        }

        setIsProcessing(true);
        let count = 0;

        try {
            // Find all rosters with problematic settings
            const rostersToFix = rosters.filter(r =>
                r.timezone !== 'Asia/Kolkata' || Number(r.gracePeriod) >= 10
            );

            for (const roster of rostersToFix) {
                const q = query(
                    collection(db, 'rosters'),
                    where('employeeId', '==', roster.employeeId),
                    where('date', '==', roster.date)
                );

                const snapshot = await getDocs(q);

                for (const doc of snapshot.docs) {
                    await updateDoc(doc.ref, {
                        timezone: 'Asia/Kolkata',
                        gracePeriod: 5
                    });
                    count++;
                }
            }

            setAlert({
                type: 'success',
                message: `Updated ${count} rosters to IST timezone and 5-min grace period!`
            });
        } catch (error) {
            console.error('Roster fix error:', error);
            setAlert({ type: 'error', message: 'Failed: ' + error.message });
        }

        setIsProcessing(false);
        setTimeout(() => setAlert(null), 5000);
    };

    const problematicRosters = rosters.filter(r =>
        r.timezone !== 'Asia/Kolkata' || Number(r.gracePeriod) >= 10
    );

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Roster Configuration Fix</h1>

            {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

            <Card>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Problematic Rosters Found:</h3>
                    <p className="text-2xl font-bold text-red-600">{problematicRosters.length}</p>
                    <p className="text-sm text-gray-600 mt-2">
                        These rosters have either non-IST timezone or grace period ≥ 10 minutes
                    </p>
                </div>

                {problematicRosters.length > 0 && (
                    <div className="mb-4 max-h-60 overflow-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 text-left">Employee ID</th>
                                    <th className="p-2 text-left">Date</th>
                                    <th className="p-2 text-left">Shift</th>
                                    <th className="p-2 text-left">Timezone</th>
                                    <th className="p-2 text-left">Grace</th>
                                </tr>
                            </thead>
                            <tbody>
                                {problematicRosters.slice(0, 20).map((r, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="p-2">{r.employeeId}</td>
                                        <td className="p-2">{r.date}</td>
                                        <td className="p-2">{r.shiftName}</td>
                                        <td className="p-2 text-red-600">{r.timezone}</td>
                                        <td className="p-2 text-red-600">{r.gracePeriod}m</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {problematicRosters.length > 20 && (
                            <p className="text-xs text-gray-500 mt-2">
                                Showing first 20 of {problematicRosters.length} rosters
                            </p>
                        )}
                    </div>
                )}

                <Button
                    onClick={fixAllRosters}
                    loading={isProcessing}
                    disabled={problematicRosters.length === 0}
                    className="w-full"
                >
                    Fix All Rosters (Set to IST + 5min Grace)
                </Button>
            </Card>
        </div>
    );
};

export default RosterFix;
