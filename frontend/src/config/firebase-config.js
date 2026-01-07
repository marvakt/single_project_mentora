import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBI799hG0AHdm8u1IqRgc9Gf2LBXZndyb8",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mentora-d09b4.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mentora-d09b4",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mentora-d09b4.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "63609156196",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:63609156196:web:75f116b6e862407bc76571",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LLVZM4ZBTR"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { app, messaging };
