import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
    en: {
        translation: {
            // Common
            common: {
                save: 'Save',
                cancel: 'Cancel',
                delete: 'Delete',
                edit: 'Edit',
                add: 'Add',
                search: 'Search',
                filter: 'Filter',
                export: 'Export',
                import: 'Import',
                loading: 'Loading...',
                noData: 'No data available',
                error: 'An error occurred',
                success: 'Success',
                confirm: 'Confirm',
                back: 'Back',
                next: 'Next',
                submit: 'Submit',
                close: 'Close',
            },

            // Navigation
            nav: {
                dashboard: 'Dashboard',
                employees: 'Employees',
                attendance: 'Attendance',
                leave: 'Leave',
                payroll: 'Payroll',
                recruitment: 'Recruitment',
                training: 'Training',
                assets: 'Assets',
                expenses: 'Expenses',
                reports: 'Reports',
                settings: 'Settings',
                profile: 'Profile',
                logout: 'Logout',
            },

            // Dashboard
            dashboard: {
                title: 'Dashboard',
                welcome: 'Welcome back, {{name}}',
                totalEmployees: 'Total Employees',
                activeToday: 'Active Today',
                onLeave: 'On Leave',
                pendingApprovals: 'Pending Approvals',
                recentActivity: 'Recent Activity',
                quickActions: 'Quick Actions',
            },

            // Employees
            employees: {
                title: 'Employees',
                addEmployee: 'Add Employee',
                employeeDetails: 'Employee Details',
                firstName: 'First Name',
                lastName: 'Last Name',
                email: 'Email',
                phone: 'Phone',
                department: 'Department',
                designation: 'Designation',
                dateOfJoining: 'Date of Joining',
                status: 'Status',
                active: 'Active',
                inactive: 'Inactive',
            },

            // Attendance
            attendance: {
                title: 'Attendance',
                clockIn: 'Clock In',
                clockOut: 'Clock Out',
                workHours: 'Work Hours',
                present: 'Present',
                absent: 'Absent',
                late: 'Late',
                halfDay: 'Half Day',
                regularize: 'Regularize',
                history: 'History',
            },

            // Leave
            leave: {
                title: 'Leave Management',
                applyLeave: 'Apply Leave',
                leaveType: 'Leave Type',
                startDate: 'Start Date',
                endDate: 'End Date',
                reason: 'Reason',
                status: 'Status',
                pending: 'Pending',
                approved: 'Approved',
                rejected: 'Rejected',
                balance: 'Leave Balance',
                casual: 'Casual Leave',
                sick: 'Sick Leave',
                annual: 'Annual Leave',
            },

            // Recruitment
            recruitment: {
                title: 'Recruitment',
                jobs: 'Job Postings',
                applicants: 'Applicants',
                interviews: 'Interviews',
                jobTitle: 'Job Title',
                location: 'Location',
                salary: 'Salary',
                deadline: 'Deadline',
                applied: 'Applied',
                screening: 'Screening',
                interview: 'Interview',
                hired: 'Hired',
                rejected: 'Rejected',
            },

            // Training
            training: {
                title: 'Training & Development',
                courses: 'Courses',
                enrollments: 'Enrollments',
                certifications: 'Certifications',
                courseTitle: 'Course Title',
                instructor: 'Instructor',
                duration: 'Duration',
                capacity: 'Capacity',
                enrolled: 'Enrolled',
                completed: 'Completed',
            },

            // Assets
            assets: {
                title: 'Asset Management',
                assetType: 'Asset Type',
                serialNumber: 'Serial Number',
                assignedTo: 'Assigned To',
                available: 'Available',
                assigned: 'Assigned',
                maintenance: 'Maintenance',
                retired: 'Retired',
                assign: 'Assign',
                return: 'Return',
            },

            // Expenses
            expenses: {
                title: 'Expense Management',
                submitExpense: 'Submit Expense',
                category: 'Category',
                amount: 'Amount',
                date: 'Date',
                description: 'Description',
                receipt: 'Receipt',
                submitted: 'Submitted',
                approved: 'Approved',
                rejected: 'Rejected',
                reimbursed: 'Reimbursed',
            },

            // Validation Messages
            validation: {
                required: '{{field}} is required',
                invalidEmail: 'Invalid email address',
                invalidPhone: 'Invalid phone number',
                minLength: '{{field}} must be at least {{min}} characters',
                maxLength: '{{field}} must not exceed {{max}} characters',
                passwordMismatch: 'Passwords do not match',
                invalidDate: 'Invalid date',
            },

            // Toast Messages
            toast: {
                loginSuccess: 'Login successful',
                loginError: 'Login failed',
                saveSuccess: 'Saved successfully',
                saveError: 'Failed to save',
                deleteSuccess: 'Deleted successfully',
                deleteError: 'Failed to delete',
                updateSuccess: 'Updated successfully',
                updateError: 'Failed to update',
            },
        },
    },
    hi: {
        translation: {
            // Common (Hindi)
            common: {
                save: 'सहेजें',
                cancel: 'रद्द करें',
                delete: 'हटाएं',
                edit: 'संपादित करें',
                add: 'जोड़ें',
                search: 'खोजें',
                filter: 'फ़िल्टर',
                export: 'निर्यात',
                import: 'आयात',
                loading: 'लोड हो रहा है...',
                noData: 'कोई डेटा उपलब्ध नहीं',
                error: 'एक त्रुटि हुई',
                success: 'सफलता',
                confirm: 'पुष्टि करें',
                back: 'पीछे',
                next: 'आगे',
                submit: 'जमा करें',
                close: 'बंद करें',
            },

            // Navigation (Hindi)
            nav: {
                dashboard: 'डैशबोर्ड',
                employees: 'कर्मचारी',
                attendance: 'उपस्थिति',
                leave: 'छुट्टी',
                payroll: 'वेतन',
                recruitment: 'भर्ती',
                training: 'प्रशिक्षण',
                assets: 'संपत्ति',
                expenses: 'खर्च',
                reports: 'रिपोर्ट',
                settings: 'सेटिंग्स',
                profile: 'प्रोफ़ाइल',
                logout: 'लॉगआउट',
            },

            // Dashboard (Hindi)
            dashboard: {
                title: 'डैशबोर्ड',
                welcome: 'वापसी पर स्वागत है, {{name}}',
                totalEmployees: 'कुल कर्मचारी',
                activeToday: 'आज सक्रिय',
                onLeave: 'छुट्टी पर',
                pendingApprovals: 'लंबित अनुमोदन',
                recentActivity: 'हाल की गतिविधि',
                quickActions: 'त्वरित कार्य',
            },

            // Add more Hindi translations as needed
        },
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // Default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // React already escapes
        },
    });

export default i18n;
