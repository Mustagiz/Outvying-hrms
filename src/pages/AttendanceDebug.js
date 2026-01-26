import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, Button } from '../components/UI';
import { calculateAttendanceStatus } from '../utils/biometricSync';

const AttendanceDebug = () => {
    const { attendance, rosters, allUsers, attendanceRules } = useAuth();
    const [debugOutput, setDebugOutput] = useState('');

    const runDiagnostic = () => {
        let output = '=== ATTENDANCE DIAGNOSTIC REPORT ===\n\n';

        // Find Faizal's record for Jan 26
        const jan26Records = attendance.filter(a => a.date === '2026-01-26');
        output += `Total records for Jan 26, 2026: ${jan26Records.length}\n\n`;

        jan26Records.forEach(record => {
            const user = allUsers.find(u => String(u.id) === String(record.employeeId));
            const roster = rosters.find(r => String(r.employeeId) === String(record.employeeId) && r.date === record.date);

            output += `--- Employee: ${user?.name || 'Unknown'} (ID: ${record.employeeId}) ---\n`;
            output += `Clock In: ${record.clockIn}\n`;
            output += `Current Status: ${record.status}\n`;
            output += `Rule Applied: ${record.ruleApplied || 'None'}\n\n`;

            if (roster) {
                output += `ROSTER FOUND:\n`;
                output += `  Shift Name: ${roster.shiftName}\n`;
                output += `  Start Time: ${roster.startTime}\n`;
                output += `  Grace Period: ${roster.gracePeriod} mins\n`;
                output += `  Timezone: ${roster.timezone}\n`;
                output += `  Full Day Hours: ${roster.fullDayHours}\n\n`;

                // Recalculate to see what SHOULD happen
                const result = calculateAttendanceStatus(
                    record.clockIn,
                    record.clockOut,
                    record.date,
                    roster,
                    attendanceRules
                );

                output += `RECALCULATED RESULT:\n`;
                output += `  Should be Status: ${result.status}\n`;
                output += `  Work Hours: ${result.workHours}\n`;
                output += `  Rule Applied: ${result.ruleApplied}\n\n`;

                // Calculate threshold manually
                const startMinutes = parseInt(roster.startTime.split(':')[0]) * 60 + parseInt(roster.startTime.split(':')[1]);
                const graceMins = Number(roster.gracePeriod || 5);
                const threshold = startMinutes + graceMins;
                const clockInMinutes = parseInt(record.clockIn.split(':')[0]) * 60 + parseInt(record.clockIn.split(':')[1]);

                output += `MANUAL CALCULATION:\n`;
                output += `  Start Time in Minutes: ${startMinutes}\n`;
                output += `  Grace Period: ${graceMins} mins\n`;
                output += `  Late Threshold: ${threshold} mins (${Math.floor(threshold / 60)}:${String(threshold % 60).padStart(2, '0')})\n`;
                output += `  Clock In Minutes: ${clockInMinutes}\n`;
                output += `  Is Late?: ${clockInMinutes > threshold ? 'YES' : 'NO'}\n`;
            } else {
                output += `NO ROSTER ASSIGNED for this date!\n`;
                output += `Using default: Start 09:00, Grace 5 mins\n`;
            }

            output += '\n' + '='.repeat(60) + '\n\n';
        });

        // Check attendance rules
        output += `\nATTENDANCE RULES IN DATABASE:\n`;
        if (attendanceRules.length === 0) {
            output += `  No custom rules found. Using hardcoded default.\n`;
        } else {
            attendanceRules.forEach(rule => {
                output += `  ${rule.name}: Grace ${rule.gracePeriodMins} mins, Default: ${rule.isDefault ? 'YES' : 'NO'}\n`;
            });
        }

        setDebugOutput(output);
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Attendance Diagnostic Tool</h1>

            <Card>
                <Button onClick={runDiagnostic} className="mb-4">
                    Run Diagnostic for Jan 26, 2026
                </Button>

                {debugOutput && (
                    <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-xs font-mono whitespace-pre-wrap">
                        {debugOutput}
                    </pre>
                )}
            </Card>
        </div>
    );
};

export default AttendanceDebug;
