/* Firebase Web SDK configuration is public by design.
   Security comes from Firebase Authentication + Realtime Database Rules.
   NEVER place service-account credentials, private keys or payment secrets here. */
const firebaseConfig = {
  apiKey: "AIzaSyDTBkc0S0Gu-Dacv0DnfBxTCvIs5dTwarg",
  authDomain: "school-37083.firebaseapp.com",
  databaseURL: "https://school-37083-default-rtdb.firebaseio.com",
  projectId: "school-37083",
  storageBucket: "school-37083.appspot.com",
  messagingSenderId: "394300516757",
  appId: "1:394300516757:web:45ffae1763844e7ce6ae9c",
  measurementId: "G-CS8TB0WMQ9"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
try { db.setPersistenceEnabled(true); } catch (e) { /* Persistence may already be enabled or unavailable. */ }
