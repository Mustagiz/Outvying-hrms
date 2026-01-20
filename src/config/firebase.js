// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAcQ2A0Y_eo_mWMoZBmEl4ZJ57HkgtDhOI",
    authDomain: "outvying-77617.firebaseapp.com",
    projectId: "outvying-77617",
    storageBucket: "outvying-77617.firebasestorage.app",
    messagingSenderId: "1087661759985",
    appId: "1:1087661759985:web:012c63ba2d691239bc7850",
    measurementId: "G-W6D6XWMJ3P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, analytics, db, auth, storage };
