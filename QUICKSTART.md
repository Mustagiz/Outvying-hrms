# HRMSPro - Quick Start Guide

## 🚀 Getting Started in 3 Steps

### Step 1: Install Dependencies
Open your terminal in the HRMS folder and run:
```bash
npm install
```

This will install all required packages including React, React Router, Tailwind CSS, and other dependencies.

### Step 2: Start the Application
Once installation is complete, start the development server:
```bash
npm start
```

The application will automatically open in your browser at `http://localhost:3000`

### Step 3: Login and Explore
Use one of these test accounts to login:

#### 👤 Employee Account
```
Email: john.doe@hrmspro.com
Password: Employee@123
```
**What you can do:**
- Clock in/out for attendance
- Apply for leaves
- View leave balance
- Upload documents
- Manage profile and bank details

#### 👔 HR Manager Account
```
Email: sarah.smith@hrmspro.com
Password: HRManager@123
```
**What you can do:**
- Everything an employee can do, PLUS:
- View all employees
- Approve/reject leave requests
- Manage onboarding/deboarding
- Generate reports
- Bulk approvals

#### 🔑 Admin Account
```
Email: admin@hrmspro.com
Password: Admin@123
```
**What you can do:**
- Everything HR can do, PLUS:
- System settings
- Advanced analytics
- User management
- Theme configuration

## 📋 Quick Feature Tour

### For Employees:
1. **Dashboard** - View your attendance summary and quick stats
2. **Attendance** - Clock in/out and view your attendance history
3. **Leave** - Apply for leaves and check your balance
4. **Documents** - Upload and manage your documents
5. **Bank Account** - Update your bank details
6. **Profile** - Edit your personal information

### For HR/Admin:
1. **Dashboard** - System-wide overview and statistics
2. **Employee Directory** - Search and view all employees
3. **Attendance** - Monitor all employee attendance
4. **Leave Management** - Approve/reject leave requests
5. **Onboarding** - Manage new employee onboarding
6. **Deboarding** - Handle employee exit process
7. **Approvals** - Bulk approval workflows
8. **Reports** - Generate and export reports
9. **Settings** (Admin only) - Configure system settings

## 🎨 Features to Try

### 1. Clock In/Out (Employee)
- Go to Attendance page
- Click "Clock In" button
- Later, click "Clock Out" button
- View your work hours

### 2. Apply for Leave (Employee)
- Go to Leave Management
- Click "Apply for Leave"
- Fill in the form
- Submit application

### 3. Approve Leaves (HR/Admin)
- Go to Leave Management or Approvals
- View pending requests
- Click Approve or Reject
- Try bulk approval by selecting multiple items

### 4. View Reports (HR/Admin)
- Go to Reports page
- Select month and year
- View attendance and leave statistics
- Export reports to CSV

### 5. Toggle Theme
- Click the sun/moon icon in the header
- Switch between light and dark mode

### 6. Add New Employee (HR/Admin)
- Go to Onboarding
- Click "Add New Employee"
- Fill in the form
- Submit to add employee

## 💡 Tips

1. **Data Persistence**: All data is saved in your browser's localStorage, so it persists across sessions
2. **Responsive Design**: Try resizing your browser or opening on mobile - it works everywhere!
3. **Search & Filter**: Most pages have search and filter options - try them out
4. **Export Data**: You can export attendance and reports to CSV format
5. **Profile Updates**: You can edit your profile information from the Profile page

## 🔧 Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can:
- Stop the other application using port 3000
- Or the app will prompt you to use a different port (press 'Y')

### Installation Issues
If you encounter installation issues:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Browser Not Opening
If the browser doesn't open automatically:
- Manually open your browser
- Navigate to `http://localhost:3000`

## 📱 Mobile Testing

To test on mobile devices on the same network:
1. Find your computer's IP address
2. On mobile, navigate to `http://YOUR_IP:3000`
3. Login and test the responsive design

## 🎯 Next Steps

After exploring the application:
1. Check out the code structure in the `src` folder
2. Review the mock data in `src/data/mockData.js`
3. Explore the reusable components in `src/components/UI.js`
4. Read the full README.md for detailed documentation

## 📞 Need Help?

- Check the README.md for detailed documentation
- Review the code comments for implementation details
- All features are fully functional with mock data

---

**Enjoy exploring HRMSPro!** 🎉
