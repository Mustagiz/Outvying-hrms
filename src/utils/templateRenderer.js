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
            <div style="font-family: 'Times New Roman', Times, serif; color: #333; line-height: 1.6;">
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px;">
                    <h1 style="margin: 0; color: #1a365d; text-transform: uppercase; letter-spacing: 2px;">Offer Letter</h1>
                    <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Corporate Employment Agreement</p>
                </div>

                <div style="margin-bottom: 20px;">
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p><strong>To:</strong><br/>
                    ${offerData.candidateName || '[Name]'}<br/>
                    ${offerData.candidateEmail || '[Email]'}</p>
                </div>

                <p>Dear <strong>${offerData.candidateName || '[Name]'}</strong>,</p>
                
                <p>We are delighted to offer you the position of <strong>${offerData.jobTitle || '[Role]'}</strong> in our <strong>${offerData.department || '[Dept]'}</strong> department at <strong>Outvying</strong>. Your expertise and background make you an ideal fit for our team.</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <h3 style="margin-top: 0; color: #2d3748; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Employment Terms</h3>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                        <tr>
                            <td style="padding: 5px 0;"><strong>Joining Date:</strong></td>
                            <td style="padding: 5px 0;">${offerData.joiningDate || '[Date]'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Annual CTC:</strong></td>
                            <td style="padding: 5px 0;">₹${offerData.annualCTC?.toLocaleString() || '0'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Monthly Gross:</strong></td>
                            <td style="padding: 5px 0;">₹${Math.round((offerData.annualCTC || 0) / 12).toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>Probation Period:</strong></td>
                            <td style="padding: 5px 0;">6 Months</td>
                        </tr>
                    </table>
                </div>

                <p>During your employment, you will be expected to adhere to the company's policies and maintaining the highest standards of professional conduct.</p>
                
                <p>We look forward to having you join us and contribute to our mutual success. Please sign and return a copy of this letter to confirm your acceptance.</p>
                
                <p style="margin-top: 40px;">Sincerely,<br/>
                <strong>HR Department</strong><br/>
                Outvying Pvt. Ltd.</p>
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

        // Handle Digital Signature
        if (offerData.signature) {
            variables['signature'] = `<img src="${offerData.signature}" alt="Signed" style="max-height: 60px; max-width: 200px; display: block; margin-top: 10px;" />`;
        } else {
            variables['signature'] = '<div style="border-bottom: 1px dashed #ccc; width: 200px; height: 40px; margin-top: 10px;"></div><small style="color:#999;">(Candidate Signature)</small>';
        }

        // Replace all variables
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            const value = variables[key] !== undefined ? variables[key] : `[${key}]`;
            htmlContent = htmlContent.replace(regex, value);
        });

        // Auto-append signature if not present in template but exists in data
        if (offerData.signature && !htmlContent.includes('{{signature}}') && !htmlContent.includes('alt="Signed"')) {
            const signatureBlock = `
                <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                    <p><strong>Accepted & Signed By:</strong></p>
                    ${variables['signature']}
                    <p style="font-size: 12px; color: #666; margin-top: 5px;">
                        Signed on: ${offerData.acceptedAt ? new Date(offerData.acceptedAt.seconds * 1000).toLocaleString() : new Date().toLocaleString()}<br/>
                        IP: ${offerData.acceptanceIP || 'N/A'}
                    </p>
                </div>
            `;
            // Insert before end of body or at the end
            if (htmlContent.includes('</body>')) {
                htmlContent = htmlContent.replace('</body>', `${signatureBlock}</body>`);
            } else {
                htmlContent += signatureBlock;
            }
        }

        return htmlContent;
    } catch (error) {
        console.error('Error rendering template:', error);
        return null;
    }
};
