// Usando Supabase para datos y nuestro backend para almacenamiento de archivos (Cloudinary)

import { supabase } from './supabaseClient';
// DIPLOMA_STORAGE_V1
import { createStorageFont, fetchLegacyAndStorageFonts, deleteStorageOrLegacyFont } from './storageAssets';

import { uploadImage, uploadFont } from './uploadClient';

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

// Funciones para Fuentes (usando Supabase)
export async function fetchFonts(): Promise<FontData[]> {
  return fetchLegacyAndStorageFonts();
}
export async function createFont(data: Omit<FontData, 'id' | 'createdAt' | 'updatedAt'>): Promise<FontData> {
  return createStorageFont(data);
}
export async function deleteFont(id: string): Promise<void> {
  return deleteStorageOrLegacyFont(id);
}

// Funciones para Diseños (usando Supabase)
export async function fetchDesigns(): Promise<DesignData[]> {
  try {
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data.map(design => ({
      id: design.id,
      ...design,
      createdAt: design.created_at || new Date().toISOString(),
      updatedAt: design.updated_at || new Date().toISOString(),
    })) as DesignData[];
  } catch (error) {
    console.error('Error fetching designs:', error);
    return [];
  }
}

export async function createDesign(data: { name: string; // eslint-disable-next-line @typescript-eslint/no-explicit-any
data: any; // eslint-disable-next-line @typescript-eslint/no-explicit-any
medalImages?: any }): Promise<DesignData> {
  const cleanData = { ...data.data };
  Object.keys(cleanData).forEach(key => {
    if (cleanData[key] === undefined) {
      delete cleanData[key];
    }
  });
  
  const { data: newDesign, error } = await supabase
    .from('designs')
    .insert([{
      name: data.name,
      data: cleanData,
      medal_images: data.medalImages,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: newDesign.id,
    name: newDesign.name,
    data: newDesign.data,
    medal_images: newDesign.medal_images,
    createdAt: newDesign.created_at,
    updatedAt: newDesign.updated_at,
  };
}

export async function updateDesign(id: string, data: { name?: string; // eslint-disable-next-line @typescript-eslint/no-explicit-any
data?: any; // eslint-disable-next-line @typescript-eslint/no-explicit-any
medalImages?: any }): Promise<DesignData> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.data !== undefined) {
    const cleanData = { ...data.data };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    updateData.data = cleanData;
  }
  if (data.medalImages !== undefined) updateData.medal_images = data.medalImages;
  
  const { data: updatedDesign, error } = await supabase
    .from('designs')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  
  return {
    id: updatedDesign.id,
    name: updatedDesign.name,
    data: updatedDesign.data,
    medal_images: updatedDesign.medal_images,
    createdAt: updatedDesign.created_at,
    updatedAt: updatedDesign.updated_at,
  };
}

export async function deleteDesign(id: string): Promise<void> {
  const { error } = await supabase.from('designs').delete().eq('id', id);
  if (error) throw error;
}

export async function importDesigns(designsToImport: DesignData[]): Promise<void> {
  for (const design of designsToImport) {
    const cleanData = { ...design.data };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) {
        delete cleanData[key];
      }
    });
    
    const { error } = await supabase
      .from('designs')
      .insert([{
        name: design.name,
        data: cleanData,
        medal_images: design.medal_images,
        created_at: design.createdAt,
        updated_at: design.updatedAt,
      }]);
    
    if (error) throw error;
  }
}

// NUEVAS FUNCIONES PARA SUBIR ARCHIVOS A TRAVÉS DEL BACKEND (usando Cloudinary)
// DIPLOMA_AUTH_UPLOAD_V1
export { uploadImage, uploadFont };

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

// Also add a function to get image by ID from Supabase (if needed)
export async function getImageById(id: string): Promise<{ url: string } | null> {
  try {
    const { data, error } = await supabase
      .from('images')
      .select('url')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return { url: data.url };
  } catch (error) {
    console.error('Error getting image by ID:', error);
    return null;
  }
}