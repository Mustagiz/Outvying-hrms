import { db } from '../config/firebase';
import { collection, addDoc, getDocs, setDoc, doc } from 'firebase/firestore';
import {
    attendance as mockAttendance,
    leaves as mockLeaves,
    rosters as mockRosters,
    announcements as mockAnnouncements,
    // We don't import users directly for Auth creation, but for Firestore profile seeding
    users as mockUsers
} from '../data/mockData';

// Helper to check if collection is empty
const isCollectionEmpty = async (collectionName) => {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.empty;
};

// Seeding Function
export const seedDatabase = async () => {
    console.log("Starting Database Seed...");

    // 1. Seed Announcements (Global)
    if (await isCollectionEmpty('announcements')) {
        console.log("Seeding Announcements...");
        for (const item of mockAnnouncements) {
            await addDoc(collection(db, 'announcements'), item);
        }
    } else {
        console.log("Announcements already exist. Skipping.");
    }

    // 2. Seed Rosters
    // Problem: Roster linked to "1", "2". 
    // If real users aren't created, these are orphaned.
    // For now, we upload them as-is. Admin can delete/reassign.
    if (await isCollectionEmpty('rosters')) {
        console.log("Seeding Rosters...");
        for (const item of mockRosters) {
            await addDoc(collection(db, 'rosters'), item);
        }
    }

    // 3. Seed Users (Firestore Profiles Only)
    // This allows the "Admin Panel" to at least see the Employee Directory with the old data.
    // BUT they won't be linked to real Auth accounts yet.
    if (await isCollectionEmpty('users')) {
        console.log("Seeding User Profiles...");
        for (const user of mockUsers) {
            // Using setDoc to keep ID consistent if possible, but mock IDs are integers (1, 2)
            // Firestore IDs should be strings.
            // We'll use the 'employeeId' (EMP001) or email as the document ID for easier manual mapping later?
            // Actually, best to just let Firestore generate ID or use 'mock_'+id
            await setDoc(doc(db, 'users', `mock_${user.id}`), {
                ...user,
                uid: `mock_${user.id}`, // Placeholder
                isMock: true
            });
        }
    }

    // 4. Seed Attendance & Leaves
    if (await isCollectionEmpty('attendance')) {
        for (const item of mockAttendance) {
            await addDoc(collection(db, 'attendance'), { ...item, employeeId: `mock_${item.employeeId}` });
        }
    }

    if (await isCollectionEmpty('leaves')) {
        for (const item of mockLeaves) {
            await addDoc(collection(db, 'leaves'), { ...item, employeeId: `mock_${item.employeeId}` });
        }
    }

    console.log("Seeding Complete!");
    return { success: true, message: "Mock data uploaded (linked to 'mock_X' IDs)" };
};
