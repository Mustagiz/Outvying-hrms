# Update Firestore Security Rules (V3)

The "Missing or insufficient permissions" error occurs because the Firestore security rules in your Firebase Console are not yet aware of the new Payroll collections.

### **Follow these steps to fix it:**

1.  Open the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (**HRMS**).
3.  In the left sidebar, click on **Firestore Database**.
4.  Click on the **Rules** tab at the top.
5.  **Delete** everything in the editor and **Paste** the following code:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Helper function to check if user is admin or HR
    function isAdmin() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return isSignedIn() && 
        (userDoc.data.role == 'admin' ||
         userDoc.data.role == 'Admin' ||
         userDoc.data.role == 'super_admin' ||
         userDoc.data.role == 'hr');
    }
    
    // Default: allow reading users to all authenticated people
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isAdmin() || request.auth.uid == userId;
    }

    // Attendance collection
    match /attendance/{attendanceId} {
      allow read: if isSignedIn();
      allow create: if isAdmin() || (isSignedIn() && (request.resource.data.employeeId == request.auth.uid || request.resource.data.uid == request.auth.uid));
      allow update: if isAdmin() || (isSignedIn() && (resource.data.employeeId == request.auth.uid || resource.data.uid == request.auth.uid));
      allow delete: if isAdmin();
    }
    
    // --- Payroll System Rules ---
    
    // Payroll History, Loans, and Claims
    match /payrollHistory/{id} { allow read, write: if isAdmin(); }
    match /payrollLoans/{id} { allow read, write: if isAdmin(); }
    match /payrollClaims/{id} { 
      allow read, write: if isAdmin(); 
      allow create: if isSignedIn(); 
    }
    
    match /attendanceRules/{id} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // Bank Accounts
    match /bankAccounts/{accountId} {
      allow read: if isSignedIn();
      allow write: if isAdmin() || (isSignedIn() && request.auth.uid == accountId);
    }

    // Notifications
    match /notifications/{notificationId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn();
      allow update: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow delete: if isSignedIn() && resource.data.userId == request.auth.uid;
    }

    // Catch-all for other collections
    match /{document=**} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```

6.  Click the **Publish** button.
7.  **Refresh your browser** and the permissions error will disappear immediately.
