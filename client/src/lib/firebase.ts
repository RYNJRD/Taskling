import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8r2renfIBTBrnhpiRcWbOe7HBypZGftg",
  authDomain: "chorely-e035f.firebaseapp.com",
  projectId: "chorely-e035f",
  storageBucket: "chorely-e035f.firebasestorage.app",
  messagingSenderId: "849038714570",
  appId: "1:849038714570:web:53c591eb595ffc761cb633",
  measurementId: "G-S212P9H432"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

