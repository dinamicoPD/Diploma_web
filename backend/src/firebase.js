// Configuración de Firebase para el backend
const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBTZKT0q_rciqYTLysU6BBJnNCDYebkmeM",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "diplomas-web-firebase.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "diplomas-web-firebase",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "diplomas-web-firebase.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1018292362286",
  appId: process.env.FIREBASE_APP_ID || "1:1018292362286:web:2f619c8eb02da6709313bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

module.exports = { db };