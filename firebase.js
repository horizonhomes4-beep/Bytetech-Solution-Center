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
  apiKey: "AIzaSyBZejxfnivyOSpoYazSzROJ9tBHhTE-M3I",
  authDomain: "chat-cf0b3.firebaseapp.com",
  databaseURL: "https://chat-cf0b3-default-rtdb.firebaseio.com",
  projectId: "chat-cf0b3",
  storageBucket: "chat-cf0b3.appspot.com",
  messagingSenderId: "440281445260",
  appId: "1:440281445260:web:06d323761375fff1b19ca9"
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
