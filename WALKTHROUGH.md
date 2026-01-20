# Admin Access Fix Walkthrough

I have addressed the issue where the Admin Panel was not accessible, and the Employee Panel was shown instead.

## Changes Made

### Authentication Logic Update
- **File**: `src/context/AuthContext.js`
- **Change**: Updated the `onAuthStateChanged` listener.
- **Reason**: Previously, if a user logged in successfully via Firebase Auth but did not have a corresponding document in the Firestore `users` collection, the system defaulted their role to `employee`.
- **Fix**: Added a check to see if the logged-in user's email is `admin@hrmspro.com`. If it is, the role is forced to `admin` even if the Firestore document is missing.

## Verification Steps

To verify the fix, please follow these steps:

1.  **Reload the Application**: Refresh your browser tab to ensure the new code is loaded.
2.  **Login**: Log in using the admin credentials:
    -   **Email**: `admin@hrmspro.com`
    -   **Password**: `Admin@123` (or your current admin password)
3.  **Check Sidebar**: Verify that the sidebar now shows Admin-specific options such as:
    -   Admin Management
    -   Settings
    -   User Management
    -   Biometric Config
4.  **Confirm Access**: Click on one of these links to ensure you can access the admin pages.

> [!TIP]
> If you are currently logged in, you may need to **Logout** and **Login** again, or simply **Reload** the page for the changes to take effect.

### Onboarding Form Update
- **File**: `src/pages/Onboarding.js`
- **Change**: Updated `handleInputChange` to copy the `email` value to `userId`.
- **Reason**: To simplify the process of setting up a new user, making the email the default login ID.

#### Verification
1.  Navigate to **Onboarding** in the sidebar.
2.  Click **Add New Employee**.
3.  Enter an email address (e.g., `new.user@hrmspro.com`).
4.  Observe that the **User ID** field automatically fills with `new.user@hrmspro.com`.

### Bulk Upload
- **File**: `src/pages/Onboarding.js`
- **Change**: Replace placeholder with CSV parsing logic.
- **Reason**: To allow adding multiple employees at once via CSV.

#### Verification
1.  Navigate to **Onboarding** in the sidebar.
2.  Click **Bulk Upload** button.
3.  Click **Download Template** to get the CSV format.
4.  Add test data to the CSV file (ensure valid emails and first names).
5.  Upload the CSV file.
#### Verification
1.  Navigate to **Onboarding** in the sidebar.
2.  Click **Bulk Upload** button.
3.  Click **Download Template** to get the CSV format.
4.  Add test data to the CSV file (ensure valid emails and first names).
5.  Upload the CSV file.
6.  Verify that a success alert appears and no errors are shown.

### Admin Permissions Repair
- **File**: `src/pages/Settings.js`, `src/context/AuthContext.js`
- **Change**: Added "Repair Admin Permissions" button.
- **Reason**: To fix "Missing Permissions" errors by creating a valid Admin profile in the database.

#### Verification
1.  Go to **Settings**.
2.  Scroll down to "Data Management".
3.  Click **"Repair Admin Permissions"**.
4.  Wait for the success message: "Admin profile restored".
### Add Employee Login Fix
- **File**: `src/pages/Settings.js` (Export config), `src/context/AuthContext.js` (Secondary App logic)
- **Change**: Updated `addUser` to use a secondary Firebase App instance.
- **Reason**: To create real Firebase Authentication users (with email/password) without logging out the administrator.

#### Verification
1.  **Login as Admin**.
2.  Go to **Onboarding** -> **Add New Employee**.
3.  Fill form with a **new** email (e.g., `test.login@hrmspro.com`) and password.
4.  Submit.
5.  **Logout** from Admin.
6.  **Login** with the new credentials (`test.login@hrmspro.com`).
7.  Verify you are logged in successfully as an Employee.

### Attendance Clock-In Fix
- **File**: `src/context/AuthContext.js`
- **Change**: Polyfilled `currentUser.id` to fall back to `currentUser.uid` if undefined.
- **Reason**: Fixes "Unsupported field value: undefined" error when clocking in, as `clockIn` expects an `id`.

#### Verification
1.  Login as an Employee (or Admin).
2.  Navigate to **Attendance**.
3.  Click **Clock In**.
4.  Verify that a success message appears (e.g., "Clocked in successfully").

### Attendance Filtering and History Fix
- **File**: `src/pages/Attendance.js`, `src/context/AuthContext.js`
- **Change**: Standardized all employee ID comparisons to use `String()` wrapping. Removed `parseInt` from filtering logic.
- **Reason**: The transition from numeric mock IDs to Firebase string UIDs broke strict comparisons and integer parsing in the attendance module.

#### Verification
1.  Login as a real Employee.
2.  Navigate to **Attendance Management**.
3.  Clock in/out and verify the status updates in real-time.
4.  Verify that the **Attendance History** table correctly shows records for your user.
5.  As Admin, verify that selecting a specific employee in the filter correctly updates the history list.

### Once-per-day and 8-Hour Rule Fix
- **File**: `src/pages/Attendance.js`, `src/context/AuthContext.js`
- **Change**: 
    - Used deterministic IDs (`userId_date`) for attendance records to prevent duplicates.
    - Updated monthly statistics tracking to only count days as "Present" if work hours are 8 or more.
- **Reason**: To enforce strict attendance policies and ensure meaningful "Present" day reporting.

#### Verification
1.  Clock in as an employee.
2.  Clock out immediately.
3.  Observe that you cannot clock in again for the same day (buttons disabled).
4.  Check the database or logs to ensure no duplicate records exist for the same day.
5.  In the statistics section, verify that "Present Days" remains `0` until a day has `8+` hours of work recorded.

### Leave Accrual Logic Update
- **File**: `src/context/AuthContext.js`
- **Change**: 
    - Updated Paid Leave (PL) to accrue at **1.0 per month** (instead of 1.5).
    - Updated Casual Leave (CL) to accrue at **0.5 per month** (instead of a fixed 6/year).
    - Both accruals now require at least **15 working days** in a month.
- **Reason**: To align system leave policies with user requirements.

#### Verification
1.  Login as an Employee.
2.  Navigate to **Leave Management**.
3.  Check the total "Paid Leave" and "Casual Leave" balance numbers.
4.  Verify they match your worked history (e.g., if you worked 2 months with 15+ days, you should have 2.0 PL and 1.0 CL).

### Profile Update Fix
- **File**: `src/pages/Profile.js`, `src/context/AuthContext.js`
- **Change**: 
    - Exported `updateUserProfile` from `AuthContext`.
    - Made `handleSubmit` in `Profile.js` asynchronous to correctly wait for the database update.
- **Reason**: The function was missing from the context and the call was finishing before the database could respond.

#### Verification
1.  Login as an employee.
2.  Go to **My Profile**.
3.  Click **Edit Profile**, change your phone number or address, and click **Save Changes**.
4.  Verify the "Success" alert appears and the info is updated in the view.

### Bank Account Update Fix
- **File**: `src/pages/BankAccount.js`
- **Change**: 
    - Updated ID comparisons to be string-safe (`String(employeeId)`).
    - Removed `parseInt` from employee selection (which was breaking string UIDs).
    - Made `handleSubmit` asynchronous to correctly wait for the database response.
- **Reason**: Similar to the profile fix, strict ID checks and non-async calls were preventing successful updates for users with string-based UIDs.

#### Verification
1.  Login as an employee.
2.  Go to **Bank Account Details**.
3.  Click **Edit Details**, update your bank info, and click **Save Changes**.
4.  Verify the success message appears and the details refresh instantly.

### Roster Management CRUD Fix
- **File**: `src/pages/Roster.js`
- **Change**: 
    - Made `handleSubmit` and `handleDelete` asynchronous to wait for the database.
    - Added comprehensive error handling and logging.
    - Verified the "Actions" column visibility for Admin roles.
- **Reason**: The operations were firing without being awaited, causing the UI to show broken or no feedback and potentially leading to stale state views.

#### Verification
1.  Login as an admin.
2.  Go to **Roster Management**.
3.  In the List view, find an assigned shift and click the **Edit (Blue Pen)** icon.
4.  Modify the shift details and save; verify the update.
5.  Click the **Delete (Red Trash)** icon and confirm; verify the record is removed.

### User Management Updates (Admin)
- **File**: `src/pages/UserManagement.js`, `src/context/AuthContext.js`
- **Change**: 
    - Implemented `resetPassword` to send Firebase reset links.
    - Implemented `updateUserId` to update login email using the secondary app pattern.
    - Standardized all user IDs to the Firebase UID for consistency across collections.
- **Reason**: Administrators needed a way to manage accounts without knowing user passwords, and the email update required re-authentication.

#### Verification
1.  Login as an admin.
2.  Go to **User Management**.
3.  Click **Password** for a user; verify the success alert for sending the reset link.
4.  Click **User ID** for a user, enter their *current* password and a *new* email address.
5.  Verify the update succeeds and their email changes in the table.

### Dynamic Leave Policy & Type Sync
- **Files**: `src/pages/LeavePolicy.js`, `src/pages/LeaveManagement.js`, `src/context/AuthContext.js`
- **Change**: 
    - Migrated leave policies and types from `localStorage` to Firestore.
    - Added real-time listeners for leave types.
    - Updated the "Apply for Leave" dropdown to use live data.
- **Reason**: Previously, leave types added by admins were only stored in their local browser. Employees were seeing outdated mock data. Now, updates are shared instantly across the entire system.

#### Verification
1.  Login as an admin.
2.  Go to **Leave Policy Management**.
3.  Add a new leave type (e.g., "Maternity Leave") and save.
4.  Logout and login as an employee (or check in a different browser).
5.  Go to **Leave Management** -> **Apply for Leave**.
6.  Verify that "Maternity Leave" now appears in the **Leave Type** dropdown.

### User Password Change
- **Files**: `src/pages/Profile.js`, `src/context/AuthContext.js`
- **Change**: 
    - Added `changePassword` function with re-authentication support.
    - Added a "Security" card to the Profile page with Current/New Password fields.
- **Reason**: Users need to be able to keep their accounts secure by updating their credentials without administrator intervention.

#### Verification
1.  Login as any user.
2.  Go to **My Profile**.
3.  Scroll to the **Security** section.
4.  Enter your current password and a new 6+ character password.
5.  Click **Update Password**; verify the success message.

### Bulk Employee Onboarding
- **Files**: `src/pages/Onboarding.js`, `src/context/AuthContext.js`
- **Change**: 
    - Updated `addUser` to use unique Firebase app names, preventing collisions during rapid sequential creation.
    - Added logic to `addUser` to automatically create bank account records if bank details are provided.
    - Improved `handleBulkUpload` in `Onboarding.js` to construct addresses and check results properly.
- **Reason**: Bulk upload was failing because Firebase couldn't create secondary apps with the same name quickly enough, and data like bank details weren't being mapped to the correct collections.

#### Verification
1.  Login as **Admin**.
2.  Go to **Employee Onboarding**.
3.  Click **Bulk Upload** and download the template.
4.  Fill the template with test data (include bank/address info).
5.  Upload the CSV and verify the success summary (e.g., "Successfully uploaded 5 employees!").
6.  Check **Bank Account Details** to verify the new employees' bank info is present.

### Leave Eligibility Rules
- **Files**: `src/pages/LeaveManagement.js`, `src/context/AuthContext.js`
- **Change**: 
    - Calculated "Working Days" based on attendance records.
    - Filtered the leave type dropdown to hide "Paid Leave" and "Casual Leave" unless an employee has 15+ working days AND a positive balance.
    - Ensured "Leave Without Pay (LWP)" is always available as a default option.
    - Added a backend check in `applyLeave` to enforce these rules.
- **Reason**: To align with company policy where new employees are only eligible for paid leave types after an initial 15-day probation/working period.

#### Verification
1.  Login as a **New Employee** (with < 15 attendance records).
2.  Go to **Leave Management** -> **Apply Leave**.
3.  Verify that only **LWP** (and other non-restricted types) appear in the dropdown.
4.  Mark 15 days of attendance for that employee (manually in DB or via clock-in logic).
5.  Re-check the dropdown; verify that **PL** and **CL** now appear (if balance > 0).### Manual Leave Allocation (Admin)
- **Files**: `src/pages/LeaveManagement.js`, `src/context/AuthContext.js`
- **Change**: 
    - Created `manualLeaveAllocations` collection in Firestore.
    - Added "Manage Balances" tab in Leave Management for Admins.
    - Admins can now add or deduct Paid/Casual leave balances manually for any employee.
    - Balances are recalculated in real-time to include these adjustments.
- **Reason**: Allows HR/Admin to handle special cases, carry-forwards, or manual adjustments without affecting attendance history.

#### Verification
1.  Login as **Admin**.
2.  Go to **Leave Management** -> **Manage Balances** tab.
3.  Click **Allocate** next to an employee.
4.  Enter the amount (e.g., `5` for 5 days) and a reason.
5.  Verify that the employee's balance increases immediately.
6.  Try a negative number (e.g., `-2`) to deduct leaves.
