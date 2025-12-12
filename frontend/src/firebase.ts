import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBXUItScwlB48lyBl_qTegq005nOrxPW_0",
  authDomain: "educonecta-2b823.firebaseapp.com",
  projectId: "educonecta-2b823",
  storageBucket: "educonecta-2b823.firebasestorage.app",
  messagingSenderId: "176082449458",
  appId: "1:176082449458:web:123fd90021bbc223ddb82b",
  measurementId: "G-WMKN648RGQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export messaging for notifications
export const messaging = getMessaging(app);

// Initialize analytics (optional, but included since it was in your snippet)
export const analytics = getAnalytics(app);
