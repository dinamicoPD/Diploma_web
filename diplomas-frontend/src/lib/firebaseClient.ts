// src/lib/firebaseClient.ts
// Importamos las funciones principales del SDK modular de Firebase
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// 🔐 Configuración que copias desde la consola de Firebase
// (firebaseConfig que te mostró cuando registraste la app web)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,       // Clave pública
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializamos la app solo una vez (necesario en Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exportamos instancias reutilizables en toda la app
export const auth = getAuth(app);         // Autenticación
export const db = getFirestore(app);      // Firestore (BD)
export const storage = getStorage(app);   // Storage (imágenes, archivos)
