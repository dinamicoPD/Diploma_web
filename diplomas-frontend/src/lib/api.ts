// Usando Firebase para Firestore y nuestro backend para almacenamiento de archivos

import { db } from './firebaseClient';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';

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
  data: any; // JSON del diseño con propiedades dinámicas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  medal_images?: any; // Objeto con imágenes de medallas
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

// NUEVAS FUNCIONES PARA SUBIR ARCHIVOS A TRAVÉS DEL BACKEND
export async function uploadImage(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    // Get Firebase Auth token for user identification
    const auth = await import('./firebaseClient').then(mod => mod.getAuthInstance());
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const idToken = await currentUser.getIdToken();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        // Note: Don't set Content-Type for FormData, let browser set it
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }
    
    const result = await response.json();
    return result.url; // Return the Cloudinary URL
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function uploadFont(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('font', file);
    
    // Get Firebase Auth token for user identification
    const auth = await import('./firebaseClient').then(mod => mod.getAuthInstance());
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    const idToken = await currentUser.getIdToken();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload/font`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        // Note: Don't set Content-Type for FormData, let browser set it
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload font');
    }
    
    const result = await response.json();
    return result.url; // Return the Cloudinary URL
  } catch (error) {
    console.error('Error uploading font:', error);
    throw error;
  }
}

// Mantener las funciones de imagen existentes para compatibilidad (ahora usan el backend)
export async function saveImage(dataUrl: string, filename: string): Promise<string> {
  // Convert dataUrl to Blob for upload
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], filename, { type: blob.type });
  
  // Upload through backend
  return await uploadImage(file);
}

export async function getImage(filename: string): Promise<string | null> {
  // This function is kept for compatibility but now returns null
  // Images should be managed through the uploadImage/saveImage flow
  return null;
}

// Also add a function to get image by ID from Firestore (if needed)
export async function getImageById(id: string): Promise<{ url: string } | null> {
  try {
    const docRef = doc(db, 'images', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return { url: data.url };
    }
    return null;
  } catch (error) {
    console.error('Error getting image by ID:', error);
    return null;
  }
}