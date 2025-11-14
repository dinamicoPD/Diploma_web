// src/lib/firebaseClient.ts
// Importamos las funciones principales del SDK modular de Firebase
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 🔐 Configuración que copias desde la consola de Firebase
// (firebaseConfig que te mostró cuando registraste la app web)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBTZKT0q_rciqYTLysU6BBJnNCDYebkmeM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "diplomas-web-firebase.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "diplomas-web-firebase",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "diplomas-web-firebase.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1018292362286",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1018292362286:web:2f619c8eb02da6709313bf",
};

// Función para inicializar Firebase de forma lazy (solo cuando se necesita)
let app: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;

function getFirebaseApp() {
  if (!app) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
  return app;
}

// Exportamos getters lazy para evitar inicialización durante build
export const getAuthInstance = () => {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
};

export const getDbInstance = () => {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
};

export const getStorageInstance = () => {
  if (!storageInstance) {
    storageInstance = getStorage(getFirebaseApp());
  }
  return storageInstance;
};

// Para compatibilidad backward, exportamos las instancias directamente
// pero estas se inicializarán solo cuando se usen por primera vez
export const auth = getAuthInstance();
export const db = getDbInstance();
export const storage = getStorageInstance();
