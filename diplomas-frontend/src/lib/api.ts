// Usando Firebase para persistencia en la nube

import { db, storage } from './firebaseClient';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Tipos
export interface FontData {
  id: string;
  family: string;
  format: 'woff2' | 'woff' | 'truetype' | 'opentype';
  dataUrl: string;
  fileName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignData {
  id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any; // JSON del diseño
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  medal_images?: any;
  createdAt: string;
  updatedAt: string;
}

// Funciones para Fuentes (usando Firebase Firestore)
export async function fetchFonts(): Promise<FontData[]> {
  try {
    const q = query(collection(db, 'fonts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as FontData[];
  } catch (error) {
    console.error('Error fetching fonts:', error);
    return [];
  }
}

export async function createFont(data: Omit<FontData, 'id' | 'createdAt' | 'updatedAt'>): Promise<FontData> {
  const docRef = await addDoc(collection(db, 'fonts'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return {
    id: docRef.id,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteFont(id: string): Promise<void> {
  await deleteDoc(doc(db, 'fonts', id));
}

// Funciones para Diseños (usando Firebase Firestore)
export async function fetchDesigns(): Promise<DesignData[]> {
  try {
    const q = query(collection(db, 'designs'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    })) as DesignData[];
  } catch (error) {
    console.error('Error fetching designs:', error);
    return [];
  }
}

export async function createDesign(data: { name: string; // eslint-disable-next-line @typescript-eslint/no-explicit-any
data: any; // eslint-disable-next-line @typescript-eslint/no-explicit-any
medalImages?: any }): Promise<DesignData> {
  const docRef = await addDoc(collection(db, 'designs'), {
    name: data.name,
    data: data.data,
    medal_images: data.medalImages,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return {
    id: docRef.id,
    name: data.name,
    data: data.data,
    medal_images: data.medalImages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateDesign(id: string, data: { name?: string; // eslint-disable-next-line @typescript-eslint/no-explicit-any
data?: any; // eslint-disable-next-line @typescript-eslint/no-explicit-any
medalImages?: any }): Promise<DesignData> {
  const docRef = doc(db, 'designs', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
  // Fetch updated document
  const updated = await fetchDesigns();
  return updated.find(d => d.id === id)!;
}

export async function deleteDesign(id: string): Promise<void> {
  await deleteDoc(doc(db, 'designs', id));
}

export async function importDesigns(designsToImport: DesignData[]): Promise<void> {
  for (const design of designsToImport) {
    await addDoc(collection(db, 'designs'), {
      name: design.name,
      data: design.data,
      medal_images: design.medal_images,
      createdAt: Timestamp.fromDate(new Date(design.createdAt)),
      updatedAt: Timestamp.fromDate(new Date(design.updatedAt)),
    });
  }
}

// Funciones para Imágenes (manteniendo dataURLs locales)
export async function saveImage(dataUrl: string, filename: string): Promise<string> {
  // Para imágenes locales, devolvemos la dataURL directamente
  return dataUrl;
}

export async function getImage(filename: string): Promise<string | null> {
  // Las imágenes están embebidas como dataURLs, no necesitamos buscar
  return null;
}