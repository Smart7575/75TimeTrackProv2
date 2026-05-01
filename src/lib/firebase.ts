import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDDwqszlwPijeQl9mJ9R-oKkJt1ewOHE5M",
  authDomain: "timetrackprov2.firebaseapp.com",
  projectId: "timetrackprov2",
  storageBucket: "timetrackprov2.firebasestorage.app",
  messagingSenderId: "883277266619",
  appId: "1:883277266619:web:e92400b2243d87b70fb39e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
