/**
 * AI HR Assistant Utility
 * Logic for handling common HR queries and intent matching
 */

const COMPANY_FAQ = [
    {
        keywords: ['leave', 'vacation', 'holiday', 'time off'],
        response: 'Our leave policy includes 21 days of annual leave, 12 days of sick leave, and standard public holidays. You can apply for leave via the "Leave Management" section.',
        action: 'Navigate to Leave Management'
    },
    {
        keywords: ['payroll', 'salary', 'payday', 'payslip'],
        response: 'Salaries are credited on the last working day of each month. You can download your payslips from the "Payroll" section.',
        action: 'Navigate to Payroll'
    },
    {
        keywords: ['attendance', 'clock', 'check in', 'check-in', 'clock-in'],
        response: 'You should clock in by 9:30 AM. Attendance is tracked via the Dashboard or the Attendance page. Late arrivals beyond 15 minutes are marked.',
        action: 'Navigate to Attendance'
    },
    {
        keywords: ['insurance', 'medical', 'benefits', 'health'],
        response: 'All full-time employees are covered under our comprehensive group health insurance. Details can be found in the Employee Handbook under the Documents section.',
        action: 'Navigate to Documents'
    },
    {
        keywords: ['reimbursement', 'expense', 'claim'],
        response: 'Expenses can be submitted through the "Expense Management" module. Please ensure you upload clear receipts for all claims.',
        action: 'Navigate to Expenses'
    },
    {
        keywords: ['hi', 'hello', 'hey', 'start'],
        response: 'Hello! I am your HR AI Assistant. I can help you with policies, payroll info, or navigate you to different modules. What can I help you with today?',
    }
];

export const processQuery = (input) => {
    const query = input.toLowerCase();

    // Find best match based on keywords
    let bestMatch = null;
    let maxMatches = 0;

    COMPANY_FAQ.forEach(item => {
        const matches = item.keywords.filter(kw => query.includes(kw)).length;
        if (matches > maxMatches) {
            maxMatches = matches;
            bestMatch = item;
        }
    });

    if (bestMatch && maxMatches > 0) {
        return {
            text: bestMatch.response,
            action: bestMatch.action || null,
            success: true
        };
    }

    return {
        text: "I'm not quite sure about that. Would you like to speak with an HR representative or check the Employee Handbook in Documents?",
        action: 'Navigate to Documents',
        success: false
    };
};

/**
 * AI Score for Resumes (Phase 8.2)
 * Simulated ranking based on keywords
 */
export const scoreCandidate = (skills, requirements) => {
    const skillList = skills.toLowerCase().split(',').map(s => s.trim());
    const reqList = requirements.toLowerCase().split(',').map(r => r.trim());

    const matches = skillList.filter(s => reqList.includes(s));
    const score = Math.round((matches.length / reqList.length) * 100);

    return {
        score,
        matches,
        missing: reqList.filter(r => !skillList.includes(r))
    };
};
