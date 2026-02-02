const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Administrative password reset callable function.
 * Resets a user's password without requiring the old one.
 * Restricted to users with admin/super_admin roles in Firestore.
 */
exports.resetUserPassword = functions.https.onCall(async (data, context) => {
    // 1. Verify Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { targetUid, newPassword } = data;

    if (!targetUid || !newPassword) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with targetUid and newPassword.');
    }

    if (newPassword.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'The password must be at least 6 characters long.');
    }

    try {
        // 2. Verify Authorization (Check User Role in Firestore)
        const callerUid = context.auth.uid;
        const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();

        if (!callerDoc.exists()) {
            throw new functions.https.HttpsError('not-found', 'Caller profile not found.');
        }

        const callerRole = callerDoc.data().role;
        const isAdmin = ['admin', 'super_admin', 'Admin', 'Super Admin'].includes(callerRole);

        if (!isAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can reset passwords.');
        }

        // 3. Perform Password Reset
        await admin.auth().updateUser(targetUid, {
            password: newPassword
        });

        return { success: true, message: `Password for user ${targetUid} has been reset successfully.` };
    } catch (error) {
        console.error('Error resetting password:', error);

        // If it's already an HttpsError, re-throw it
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        // Otherwise, throw a generic internal error with the message
        throw new functions.https.HttpsError('internal', error.message || 'An unexpected error occurred during password reset.');
    }
});

/**
 * Administrative user deletion callable function.
 * Deletes a user from Firebase Auth and cleans up Firestore data.
 */
exports.deleteUserAdmin = functions.https.onCall(async (data, context) => {
    // 1. Verify Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { targetUid } = data;

    if (!targetUid) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with targetUid.');
    }

    try {
        // 2. Verify Authorization (Check User Role in Firestore)
        const callerUid = context.auth.uid;
        const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();

        if (!callerDoc.exists()) {
            throw new functions.https.HttpsError('not-found', 'Caller profile not found.');
        }

        const callerRole = callerDoc.data().role;
        const isAdmin = ['admin', 'super_admin', 'Admin', 'Super Admin'].includes(callerRole);

        if (!isAdmin) {
            throw new functions.https.HttpsError('permission-denied', 'Only admins can delete users.');
        }

        // 3. Delete from Firebase Auth
        await admin.auth().deleteUser(targetUid);

        // 4. Delete from Firestore (Cleanup)
        const db = admin.firestore();
        const batch = db.batch();

        batch.delete(db.collection('users').doc(targetUid));
        batch.delete(db.collection('bankAccounts').doc(targetUid));
        // Add more collections here if needed (e.g., leaveBalances, documents)

        await batch.commit();

        return { success: true, message: `User ${targetUid} and associated data have been deleted successfully.` };
    } catch (error) {
        console.error('Error deleting user:', error);

        if (error instanceof functions.https.HttpsError) {
            throw error;
        }

        throw new functions.https.HttpsError('internal', error.message || 'An unexpected error occurred during user deletion.');
    }
});
