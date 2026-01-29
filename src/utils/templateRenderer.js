// Template rendering utility
export const renderTemplate = async (templateId, templates, offerData) => {
    if (!templateId) {
        // Return default template
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

    const template = templates.find(t => t.id === templateId);
    if (!template) return null;

    try {
        const response = await fetch(template.storageUrl);
        let htmlContent = await response.text();

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
            place: 'Mumbai',
            workLocation: 'Mumbai, Maharashtra',
            reportingManager: offerData.reportingManager || 'HR Department',
            probationPeriod: '6 months',
            noticePeriod: '30 days'
        };

        // Replace all variables
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            htmlContent = htmlContent.replace(regex, variables[key]);
        });

        return htmlContent;
    } catch (error) {
        console.error('Error rendering template:', error);
        return null;
    }
};
