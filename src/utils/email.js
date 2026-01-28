// Email integration utilities (using EmailJS or similar service)

export const email = {
    // Initialize email service (configure with your EmailJS credentials)
    init: () => {
        // This would typically use EmailJS or similar service
        // emailjs.init(process.env.REACT_APP_EMAILJS_USER_ID);
    },

    // Send email
    send: async ({ to, subject, body, template = 'default' }) => {
        try {
            // In production, integrate with EmailJS, SendGrid, or your backend
            console.log('Sending email:', { to, subject, body, template });

            // Simulated email send
            return {
                success: true,
                messageId: `msg_${Date.now()}`,
            };
        } catch (error) {
            console.error('Email send error:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    },

    // Email templates
    templates: {
        // Welcome email for new employees
        welcome: (employeeName, credentials) => ({
            subject: 'Welcome to the Team!',
            body: `
        Dear ${employeeName},

        Welcome to our organization! We're excited to have you on board.

        Your login credentials:
        Email: ${credentials.email}
        Temporary Password: ${credentials.password}

        Please change your password upon first login.

        Best regards,
        HR Team
      `,
        }),

        // Leave approval notification
        leaveApproved: (employeeName, leaveDetails) => ({
            subject: 'Leave Request Approved',
            body: `
        Dear ${employeeName},

        Your leave request has been approved.

        Leave Type: ${leaveDetails.type}
        From: ${leaveDetails.startDate}
        To: ${leaveDetails.endDate}
        Days: ${leaveDetails.days}

        Best regards,
        HR Team
      `,
        }),

        // Leave rejection notification
        leaveRejected: (employeeName, leaveDetails, reason) => ({
            subject: 'Leave Request Rejected',
            body: `
        Dear ${employeeName},

        Unfortunately, your leave request has been rejected.

        Leave Type: ${leaveDetails.type}
        From: ${leaveDetails.startDate}
        To: ${leaveDetails.endDate}
        
        Reason: ${reason}

        Please contact HR for more information.

        Best regards,
        HR Team
      `,
        }),

        // Payslip notification
        payslip: (employeeName, month, amount) => ({
            subject: `Payslip for ${month}`,
            body: `
        Dear ${employeeName},

        Your payslip for ${month} is now available.

        Net Salary: ₹${amount}

        Please log in to the HRMS portal to download your payslip.

        Best regards,
        HR Team
      `,
        }),

        // Interview invitation
        interviewInvitation: (candidateName, jobTitle, interviewDetails) => ({
            subject: `Interview Invitation - ${jobTitle}`,
            body: `
        Dear ${candidateName},

        Thank you for applying for the ${jobTitle} position.

        We would like to invite you for an interview:
        
        Date: ${interviewDetails.date}
        Time: ${interviewDetails.time}
        Location: ${interviewDetails.location}
        Interviewer: ${interviewDetails.interviewer}

        Please confirm your availability.

        Best regards,
        Recruitment Team
      `,
        }),

        // Asset assignment
        assetAssignment: (employeeName, assetDetails) => ({
            subject: 'Asset Assignment Notification',
            body: `
        Dear ${employeeName},

        The following asset has been assigned to you:

        Asset Type: ${assetDetails.type}
        Asset Name: ${assetDetails.name}
        Serial Number: ${assetDetails.serialNumber}

        Please acknowledge receipt and take good care of the asset.

        Best regards,
        IT Team
      `,
        }),

        // Expense approval
        expenseApproved: (employeeName, expenseDetails) => ({
            subject: 'Expense Claim Approved',
            body: `
        Dear ${employeeName},

        Your expense claim has been approved.

        Category: ${expenseDetails.category}
        Amount: ₹${expenseDetails.amount}
        Date: ${expenseDetails.date}

        The amount will be reimbursed in your next salary.

        Best regards,
        Finance Team
      `,
        }),

        // Training enrollment
        trainingEnrollment: (employeeName, courseDetails) => ({
            subject: `Enrollment Confirmation - ${courseDetails.title}`,
            body: `
        Dear ${employeeName},

        You have been successfully enrolled in the following course:

        Course: ${courseDetails.title}
        Instructor: ${courseDetails.instructor}
        Start Date: ${courseDetails.startDate}
        Duration: ${courseDetails.duration} hours

        Please mark your calendar.

        Best regards,
        Training Team
      `,
        }),
    },

    // Bulk email
    sendBulk: async (recipients, emailTemplate) => {
        const results = [];

        for (const recipient of recipients) {
            const result = await email.send({
                to: recipient.email,
                ...emailTemplate,
            });

            results.push({
                recipient: recipient.email,
                ...result,
            });
        }

        return results;
    },
};

export default email;
