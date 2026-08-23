//==================================================
// Lesson Payment Management System
// Firebase Realtime Database
//==================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    set,
    update,
    remove,
    get,
    child,
    onValue
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

//==================================================
// FIREBASE CONFIG
//==================================================

const firebaseConfig = {
  apiKey: "AIzaSyB78-XIa4cPsOAQMWefhzGYkMGAlwNtJx8",
  authDomain: "set-3-6e04d.firebaseapp.com",
  databaseURL: "https://set-3-6e04d-default-rtdb.firebaseio.com",
  projectId: "set-3-6e04d",
  storageBucket: "set-3-6e04d.firebasestorage.app",
  messagingSenderId: "906900598918",
  appId: "1:906900598918:web:bf83e8df4f13147fe02107"
};

//==================================================
// INITIALIZE FIREBASE
//==================================================

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

//==================================================
// DATABASE REFERENCES
//==================================================

export const teachersRef = ref(db, "lessonPayment/teachers");
export const studentsRef = ref(db, "lessonPayment/students");
export const paymentsRef = ref(db, "lessonPayment/teacherPayments");

//==================================================
// EXPORT FIREBASE FUNCTIONS
//==================================================

export {
    db,
    ref,
    push,
    set,
    update,
    remove,
    get,
    child,
    onValue
};
