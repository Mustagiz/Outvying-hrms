export const renderTemplate = async (templateId, templates, offerData) => {
    let template = null;

    // 1. Try to find the specific template by ID
    if (templateId) {
        template = templates.find(t => t.id === templateId);
    }

    // 2. If no specific ID or not found, try to find a database-defined "Default" template
    if (!template && templates && templates.length > 0) {
        template = templates.find(t => t.isDefault === true);
    }

    // 3. If still nothing, return the hardcoded "Sample" format
    if (!template) {
        return `
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
                <p>Dear <strong>${offerData.candidateName || '[Name]'}</strong>,</p>
                <p>We are delighted to offer you the position of <strong>${offerData.jobTitle || '[Role]'}</strong> in our <strong>${offerData.department || '[Dept]'}</strong> department at Outvying. Your joining date is confirmed as <strong>${offerData.joiningDate || '[Date]'}</strong>.</p>
                <p>Your total annual compensation package will be <strong>₹${offerData.annualCTC?.toLocaleString() || '0'}</strong>, with a monthly gross of <strong>₹${Math.round((offerData.annualCTC || 0) / 12).toLocaleString()}</strong>.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Basic Salary: ₹${offerData.breakdown?.basic?.toLocaleString() || '0'}</li>
                    <li>Provident Fund: Comprehensive protection plan</li>
                    <li>Probation Period: 6 Months</li>
                </ul>
                <p className="mt-4 italic">Welcome to the team!</p>
            </div>
        `;
    }

    try {
        let htmlContent = template.htmlContent;

        // If not in Firestore, fetch from Storage (legacy fallback)
        if (!htmlContent && template.storageUrl) {
            console.log('[RENDER] Fetching legacy content from Storage...');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await fetch(template.storageUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            htmlContent = await response.text();
        }

        if (!htmlContent) {
            console.warn('[RENDER] No content found for template:', templateId);
            return null;
        }

        // Variable replacement map
        const variables = {
            candidateName: offerData.candidateName || '[Name]',
            candidateEmail: offerData.candidateEmail || '[Email]',
            jobTitle: offerData.jobTitle || '[Job Title]',
            designation: offerData.jobTitle || '[Designation]',
            department: offerData.department || '[Department]',
            annualCTC: offerData.annualCTC?.toLocaleString('en-IN') || '0',
            monthlyCTC: Math.round((offerData.annualCTC || 0) / 12).toLocaleString('en-IN'),
            joiningDate: offerData.joiningDate ? new Date(offerData.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '[Date]',
            basicSalary: offerData.breakdown?.basic?.toLocaleString('en-IN') || '0',
            hra: offerData.breakdown?.hra?.toLocaleString('en-IN') || '0',
            companyName: 'Outvying',
            currentDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            place: offerData.place || 'Mumbai',
            workLocation: offerData.place || 'Mumbai, Maharashtra',
            reportingManager: offerData.reportingManager || 'HR Department',
            probationPeriod: '6 months',
            noticePeriod: '30 days',
            ...offerData.customData // Inject custom variables
        };

        // Replace all variables
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            const value = variables[key] !== undefined ? variables[key] : `[${key}]`;
            htmlContent = htmlContent.replace(regex, value);
        });

        return htmlContent;
    } catch (error) {
        console.error('Error rendering template:', error);
        return null;
    }
};
