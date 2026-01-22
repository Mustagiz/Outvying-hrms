const { calculateAttendanceStatus } = require('./src/utils/biometricSync');
const { calculateAbsDuration } = require('./src/utils/helpers');

// Simple mock for localStorage
global.localStorage = {
    getItem: () => JSON.stringify([{
        name: 'Standard Office',
        fullDayHours: 8.0,
        halfDayHours: 4.0,
        minPresentHours: 1.0,
        gracePeriodMins: 15,
        isDefault: true
    }])
};

const runTests = () => {
    console.log("Starting Attendance Calculation Tests...\n");

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
            expected: { status: "Half Day", workingDays: 0.5, workHours: 4.5 }
        },
        {
            name: "LWP (Less than Half Day)",
            clockIn: "09:00", clockOut: "12:00",
            roster: { shiftName: "Morning", startTime: "09:00", fullDayHours: 8.0, halfDayHours: 4.0 },
            expected: { status: "LWP", workingDays: 0 }
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
            expected: { overtime: 1.0, workHours: 10.0 }
        }
    ];

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
            console.log("   Expected:", t.expected);
            console.log("   Got:     ", result);
        }
    });

    console.log(`\nTests Completed: ${passed}/${tests.length} passed.`);
};

// I need to mock the imports if I run this with node, but I can just use the logic directly for verification.
runTests();
