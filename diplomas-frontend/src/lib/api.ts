// Usando localStorage para persistencia local

const STORAGE_DESIGNS = 'diplomas_designs_v1';
const STORAGE_FONTS = 'diplomas_fonts_v1';

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

// Funciones para Fuentes
export async function fetchFonts(): Promise<FontData[]> {
  const stored = localStorage.getItem(STORAGE_FONTS);
  return stored ? JSON.parse(stored) : [];
}

export async function createFont(data: Omit<FontData, 'id' | 'createdAt' | 'updatedAt'>): Promise<FontData> {
  const fonts = await fetchFonts();
  const newFont: FontData = {
    id: Math.random().toString(36).slice(2),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  fonts.push(newFont);
  localStorage.setItem(STORAGE_FONTS, JSON.stringify(fonts));
  return newFont;
}

export async function deleteFont(id: string): Promise<void> {
  const fonts = await fetchFonts();
  const filtered = fonts.filter(f => f.id !== id);
  localStorage.setItem(STORAGE_FONTS, JSON.stringify(filtered));
}

// Funciones para Diseños
export async function fetchDesigns(): Promise<DesignData[]> {
  const stored = localStorage.getItem(STORAGE_DESIGNS);
  return stored ? JSON.parse(stored) : [];
}

export async function createDesign(data: { name: string; // eslint-disable-next-line @typescript-eslint/no-explicit-any
data: any; // eslint-disable-next-line @typescript-eslint/no-explicit-any
medalImages?: any }): Promise<DesignData> {
  const designs = await fetchDesigns();
  const newDesign: DesignData = {
    id: Math.random().toString(36).slice(2),
    name: data.name,
    data: data.data,
    medal_images: data.medalImages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  designs.push(newDesign);
  localStorage.setItem(STORAGE_DESIGNS, JSON.stringify(designs));
  return newDesign;
}

export async function updateDesign(id: string, data: { name?: string; // eslint-disable-next-line @typescript-eslint/no-explicit-any
data?: any; // eslint-disable-next-line @typescript-eslint/no-explicit-any
medalImages?: any }): Promise<DesignData> {
  const designs = await fetchDesigns();
  const index = designs.findIndex(d => d.id === id);
  if (index === -1) throw new Error('Design not found');
  if (data.name) designs[index].name = data.name;
  if (data.data) designs[index].data = data.data;
  if (data.medalImages !== undefined) designs[index].medal_images = data.medalImages;
  designs[index].updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_DESIGNS, JSON.stringify(designs));
  return designs[index];
}

export async function deleteDesign(id: string): Promise<void> {
  const designs = await fetchDesigns();
  const filtered = designs.filter(d => d.id !== id);
  localStorage.setItem(STORAGE_DESIGNS, JSON.stringify(filtered));
}

export async function importDesigns(designsToImport: DesignData[]): Promise<void> {
  const existing = await fetchDesigns();
  const merged = [...existing, ...designsToImport];
  localStorage.setItem(STORAGE_DESIGNS, JSON.stringify(merged));
}

const STORAGE_IMAGES = 'diplomas_images_v1';

export async function saveImage(dataUrl: string, filename: string): Promise<string> {
  const images = JSON.parse(localStorage.getItem(STORAGE_IMAGES) || '{}');
  images[filename] = dataUrl;
  localStorage.setItem(STORAGE_IMAGES, JSON.stringify(images));
  return filename;
}

export async function getImage(filename: string): Promise<string | null> {
  const images = JSON.parse(localStorage.getItem(STORAGE_IMAGES) || '{}');
  return images[filename] || null;
}