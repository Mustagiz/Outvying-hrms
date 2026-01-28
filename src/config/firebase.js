// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// Using environment variables for security
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyAcQ2A0Y_eo_mWMoZBmEl4ZJ57HkgtDhOI",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "outvying-77617.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "outvying-77617",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "outvying-77617.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1087661759985",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1087661759985:web:012c63ba2d691239bc7850",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-W6D6XWMJ3P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, analytics, db, auth, storage, firebaseConfig };
