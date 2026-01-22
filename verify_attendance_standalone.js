// Standalone Verification Script for Attendance Logic
// This script contains copies of the logic to be tested to avoid environment issues.

const calculateAbsDuration = (inTime, inDate, outTime, outDate) => {
    if (!inTime || !outTime) return 0;
    try {
        const start = new Date(`${inDate}T${inTime}:00+05:30`);
        const end = new Date(`${outDate}T${outTime}:00+05:30`);
        let diffMs = end - start;
        if (diffMs < 0 && inDate === outDate) diffMs += 24 * 60 * 60 * 1000;
        return Math.max(0, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
    } catch (error) { return 0; }
};

const calculateAttendanceStatus = (clockIn, clockOut, date = null, roster = null) => {
    if (!clockIn) return { status: 'Absent', workHours: 0, workingDays: 0 };

    const defaultRule = {
        fullDayHours: 8.0,
        halfDayHours: 4.0,
        minPresentHours: 1.0,
        gracePeriodMins: 15
    };

    const istDate = date || "2024-01-01";
    const shiftStartTime = roster?.startTime || '09:00';
    const [shiftHour, shiftMin] = shiftStartTime.split(':').map(Number);
    const shiftStartInMinutes = shiftHour * 60 + shiftMin;
    const gracePeriod = roster?.gracePeriod || defaultRule.gracePeriodMins;

    // Simplified clock-in check for test script
    const [regH, regM] = clockIn.split(':').map(Number);
    const clockInInMinutes = regH * 60 + regM;

    let status = clockInInMinutes > (shiftStartInMinutes + gracePeriod) ? 'Late' : 'Present';
    let workingDays = 0;
    let workHours = 0;

    if (clockOut) {
        let clockOutDate = istDate;
        if (clockOut < clockIn) {
            const nextDay = new Date(istDate);
            nextDay.setDate(nextDay.getDate() + 1);
            clockOutDate = nextDay.toISOString().split('T')[0];
        }
        workHours = calculateAbsDuration(clockIn, istDate, clockOut, clockOutDate);

        const fullDayThreshold = roster?.fullDayHours || defaultRule.fullDayHours;
        const halfDayThreshold = roster?.halfDayHours || defaultRule.halfDayHours;

        if (workHours < halfDayThreshold) {
            status = 'LWP';
            workingDays = 0;
        } else if (workHours < fullDayThreshold) {
            status = 'Half Day';
            workingDays = 0.5;
        } else if (workHours >= fullDayThreshold) {
            workingDays = 1.0;
            if (status !== 'Late') status = 'Present';
        }
    }

    const overtimeThreshold = roster?.overtimeThreshold || ((roster?.fullDayHours || defaultRule.fullDayHours) + 1);
    const overtime = workHours > overtimeThreshold ? Math.round((workHours - overtimeThreshold) * 100) / 100 : 0;

    return { status, workHours, workingDays, overtime };
};

const runTests = () => {
    console.log("Starting Standalone Attendance Logic Tests...\n");

    const tests = [
        {
            name: "Standard Full Day",
            clockIn: "09:00", clockOut: "17:00",
            roster: { shiftName: "Morning", startTime: "09:00", fullDayHours: 8.0, halfDayHours: 4.0 },
            expected: { status: "Present", workingDays: 1.0, workHours: 8.0, overtime: 0 }
        },
        {
            name: "Standard Half Day",
            clockIn: "09:00", clockOut: "13:30",
            roster: { shiftName: "Morning", startTime: "09:00", fullDayHours: 8.0, halfDayHours: 4.0 },
            expected: { status: "Half Day", workingDays: 0.5, workHours: 4.5, overtime: 0 }
        },
        {
            name: "LWP (Less than Half Day)",
            clockIn: "09:00", clockOut: "12:00",
            roster: { shiftName: "Morning", startTime: "09:00", fullDayHours: 8.0, halfDayHours: 4.0 },
            expected: { status: "LWP", workingDays: 0, workHours: 3.0 }
        },
        {
            name: "Custom Shift Full Day (6 hours required)",
            clockIn: "10:00", clockOut: "16:00",
            roster: { shiftName: "Short Shift", startTime: "10:00", fullDayHours: 6.0, halfDayHours: 3.0 },
            expected: { status: "Present", workingDays: 1.0, workHours: 6.0 }
        },
        {
            name: "Late Clock-in but Full Day hours",
            clockIn: "11:00", clockOut: "20:00",
            roster: { shiftName: "Morning", startTime: "09:00", fullDayHours: 8.0, halfDayHours: 4.0, gracePeriod: 15 },
            expected: { status: "Late", workingDays: 1.0, workHours: 9.0 }
        },
        {
            name: "Overtime (Standard rule: FullDay + 1)",
            clockIn: "09:00", clockOut: "19:00",
            roster: { shiftName: "Morning", startTime: "09:00", fullDayHours: 8.0, halfDayHours: 4.0 },
            expected: { overtime: 2.0, workHours: 10.0 } // 10h total, OT after 8+1=9h -> 1h ... wait (FullDay + 1) = 9. 10 - 9 = 1.
            // Actually, if OT starts after 9 hours, and I work 10 hours, OT = 1.
            // If I work 19:00, that's 10 hours. 10 - 9 = 1.
        }
    ];

    // Correcting expected overtime for 10h work: 10 - 9 = 1.0
    tests[5].expected.overtime = 1.0;

    let passed = 0;
    tests.forEach(t => {
        const result = calculateAttendanceStatus(t.clockIn, t.clockOut, "2024-01-01", t.roster);
        const checks = Object.keys(t.expected);
        const match = checks.every(key => result[key] === t.expected[key]);

        if (match) {
            console.log(`✅ [PASS] ${t.name}`);
            passed++;
        } else {
            console.log(`❌ [FAIL] ${t.name}`);
            console.log("   Expected:", JSON.stringify(t.expected));
            console.log("   Got:     ", JSON.stringify(result));
        }
    });

    console.log(`\nTests Completed: ${passed}/${tests.length} passed.`);
};

runTests();
