# HRMSPro - Human Resource Management System

A comprehensive, full-featured HRMS web application built with React, JavaScript, and Tailwind CSS.

## 🚀 Features

### Core Functionality
- **Role-Based Access Control**: Three user types (Employee, HR Manager, Admin) with different permissions
- **Secure Authentication**: Login/logout with session management
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes for better user experience

### Key Modules

#### 1. Attendance Management
- Clock in/clock out functionality
- Real-time attendance tracking
- Monthly attendance reports with statistics
- Overtime tracking
- Late arrival and early departure monitoring
- Calendar view of attendance history
- Export attendance reports to CSV

#### 2. Leave Management
- Apply for different leave types (Sick, Casual, Annual, Maternity)
- Leave balance tracking
- Leave approval workflow for HR/Admin
- Leave history with status tracking
- Bulk leave approvals
- Leave regularization requests

#### 3. Employee Directory
- Complete employee listing with search and filters
- Detailed employee profile pages
- Department-wise employee grouping
- Contact information management
- Reporting hierarchy visualization
- Advanced search by name, ID, designation, or email

#### 4. Document Management
- Upload documents (Resume, ID proofs, Certificates)
- Document categorization and tagging
- View/download uploaded documents
- Document approval status tracking
- Expiry date tracking for documents
- Document statistics dashboard

#### 5. Employee Onboarding
- New employee registration form
- Onboarding checklist with progress tracking
- Document collection workflow
- Welcome timeline
- Training assignments tracking

#### 6. Employee Deboarding
- Exit process initiation
- Asset return checklist
- Exit clearance workflow
- Final settlement tracking
- Exit interview management

#### 7. Bank Account Management
- Add/update bank account details
- Salary account information
- Payment history tracking
- Secure account information display

#### 8. Approval Workflows
- Multi-level approval system
- Leave approval interface
- Bulk approval functionality
- Pending approvals dashboard
- Approval statistics

#### 9. Reports & Analytics
- Attendance reports (daily, weekly, monthly)
- Leave utilization reports
- Department-wise analytics
- Employee productivity dashboards
- Export functionality (CSV)
- Visual statistics and charts

#### 10. Dashboard Panels

**Employee Dashboard:**
- Personal attendance summary
- Leave balance overview
- Quick actions (Clock in/out, Apply leave)
- Recent activity feed

**HR Dashboard:**
- All employee attendance overview
- Pending leave approvals
- Employee statistics
- Department-wise metrics

**Admin Dashboard:**
- Complete system overview
- Advanced analytics
- System-wide statistics
- Quick access to all modules

## 🛠️ Technology Stack

- **Frontend Framework**: React 18.2.0
- **Routing**: React Router DOM 6.20.0
- **Styling**: Tailwind CSS 3.3.5
- **Icons**: Lucide React
- **State Management**: React Context API
- **Data Persistence**: LocalStorage
- **Date Handling**: date-fns

## 📦 Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd HRMS
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser and navigate to:**
   ```
   http://localhost:3000
   ```

## 🔐 Test Accounts

Use these credentials to test different user roles:

### Employee Account
- **Email**: john.doe@hrmspro.com
- **Password**: Employee@123
- **Access**: Personal dashboard, attendance, leave management, documents, profile

### HR Manager Account
- **Email**: sarah.smith@hrmspro.com
- **Password**: HRManager@123
- **Access**: All employee management, approvals, reports, onboarding/deboarding

### Admin Account
- **Email**: admin@hrmspro.com
- **Password**: Admin@123
- **Access**: Full system access including settings and advanced analytics

## 📁 Project Structure

```
HRMS/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Layout.js          # Main layout with sidebar and header
│   │   └── UI.js              # Reusable UI components
│   ├── context/
│   │   └── AuthContext.js     # Authentication and state management
│   ├── data/
│   │   └── mockData.js        # Mock data for testing
│   ├── pages/
│   │   ├── Login.js           # Login page
│   │   ├── Dashboard.js       # Dashboard with role-based views
│   │   ├── Attendance.js      # Attendance management
│   │   ├── LeaveManagement.js # Leave application and approval
│   │   ├── EmployeeDirectory.js # Employee listing and profiles
│   │   ├── Documents.js       # Document management
│   │   ├── Onboarding.js      # Employee onboarding
│   │   ├── Deboarding.js      # Employee exit process
│   │   ├── BankAccount.js     # Bank account management
│   │   ├── Approvals.js       # Approval workflows
│   │   ├── Reports.js         # Reports and analytics
│   │   ├── Settings.js        # System settings
│   │   └── Profile.js         # User profile management
│   ├── utils/
│   │   └── helpers.js         # Utility functions
│   ├── App.js                 # Main app component with routing
│   ├── index.js               # Entry point
│   └── index.css              # Global styles
├── package.json
├── tailwind.config.js
└── README.md
```

## 🎨 Features Breakdown

### For Employees
- ✅ Clock in/out for attendance
- ✅ View attendance history and statistics
- ✅ Apply for leaves
- ✅ Check leave balance
- ✅ Upload and manage documents
- ✅ Update bank account details
- ✅ View and edit profile
- ✅ Track personal performance

### For HR Managers
- ✅ View all employee attendance
- ✅ Approve/reject leave requests
- ✅ Manage employee onboarding
- ✅ Handle employee deboarding
- ✅ Verify documents
- ✅ Generate reports
- ✅ Manage employee directory
- ✅ Bulk approval operations

### For Admins
- ✅ Full system access
- ✅ Advanced analytics and reports
- ✅ System settings configuration
- ✅ User role management
- ✅ Data export functionality
- ✅ Theme customization
- ✅ Notification settings
- ✅ Database management

## 🔧 Configuration

### Theme Toggle
The application supports both light and dark themes. Users can toggle between themes using the button in the header.

### Data Persistence
All data is stored in the browser's localStorage, allowing data to persist across sessions. In a production environment, this would be replaced with API calls to a backend server.

### Mock Data
The application comes with pre-populated mock data including:
- 6 sample employees across different departments
- 6 months of attendance records
- Leave applications and balances
- Document records
- Bank account information

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1920px and above)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎯 Key Highlights

1. **Clean Architecture**: Well-organized code structure with separation of concerns
2. **Reusable Components**: Modular UI components for consistency
3. **State Management**: Centralized state using React Context API
4. **Type Safety**: Proper prop validation and error handling
5. **Performance**: Optimized with useMemo and useCallback hooks
6. **Accessibility**: Semantic HTML and ARIA labels
7. **User Experience**: Intuitive navigation and clear feedback
8. **Data Visualization**: Statistics and charts for better insights

## 🚀 Future Enhancements

- Integration with backend API
- Real-time notifications
- Advanced reporting with charts (Chart.js integration)
- Email notifications
- Calendar integration
- Payroll management
- Performance review module
- Training management
- Asset management
- Expense management

## 📄 License

This project is created for demonstration purposes.

## 👨‍💻 Development

To build for production:
```bash
npm run build
```

To run tests:
```bash
npm test
```

## 🤝 Support

For any questions or issues, please refer to the documentation or contact the development team.

---

**HRMSPro** - Simplifying Human Resource Management
