// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } 
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// TODO: Replace with your Firebase config (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyB2Ut_oXxm_YqupBpqDCHiS_130Lu284hY",
  authDomain: "habit-tracker-4d341.firebaseapp.com",
  projectId: "habit-tracker-4d341",
  storageBucket: "habit-tracker-4d341.firebasestorage.app",
  messagingSenderId: "859581988040",
  appId: "1:859581988040:web:7aea3a9a9156484f4c39fd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword };
