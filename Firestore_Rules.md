# Update Firestore Security Rules (V2)

The "Missing or insufficient permissions" or "Error updating bank details" happens because the rules in your Firebase Console are blocking the app.

Follow these steps to fix it:

1.  Open the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project (**HRMS**).
3.  In the left sidebar, click on **Firestore Database**.
4.  Click on the **Rules** tab at the top.
5.  **Delete** the existing rules and **Paste** the following code:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Check if user is signed in
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Check if user has admin role
    function isAdmin() {
      let role = get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
      return isSignedIn() && 
        (role == 'admin' || role == 'super_admin' || 
         request.auth.token.email == 'admin@hrmspro.com' ||
         request.auth.token.email == 'superadmin@hrmspro.com');
    }

    // --- COLLECTION RULES ---

    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isAdmin() || request.auth.uid == userId;
    }

    match /attendance/{attendId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn() && (isAdmin() || request.auth.uid == request.resource.data.employeeId);
      allow delete: if isAdmin();
    }

    match /leaves/{leaveId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isAdmin() || (isSignedIn() && request.auth.uid == resource.data.employeeId);
    }

    // Allow employees to submit regularization requests
    match /regularizationRequests/{requestId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.resource.data.employeeId == request.auth.uid;
      allow update: if isAdmin(); // Only admins can approve/reject keys like 'status'
    }

    // NEW: Allow employees to manage their own bank accounts
    match /bankAccounts/{employeeId} {
      allow read: if isSignedIn();
      allow write: if isAdmin() || (isSignedIn() && request.auth.uid == employeeId);
    }

    // Default: Allow Admins full access, others Read-only for general data
    match /{document=**} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
  }
}
```

6.  Click the **Publish** button.
