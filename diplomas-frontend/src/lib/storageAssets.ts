// DIPLOMA_STORAGE_V1
import { supabase } from './supabaseClient';
import { createStorageService, type StorageAdapter, type StoredFont, fontFromRow } from './storageCore';
export { type StoredFont } from './storageCore';
export const storageAssets = createStorageService(supabase as unknown as StorageAdapter);
export const STORAGE_SESSION_EVENT = 'diploma-storage-session';
export const STORAGE_ERROR_EVENT = 'diploma-storage-error';

export function reportStorageError(error: unknown) {
  const message = error instanceof Error ? error.message : 'No se pudo completar la operacion con los archivos.';
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(STORAGE_ERROR_EVENT, { detail: message }));
}
let subscriptions = 0;
let dispose: (() => void) | undefined;
export function watchStorageSession() {
  subscriptions++;
  if (!dispose) {
    let lastUser: string | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user.id;
      if (user !== lastUser || event === 'SIGNED_OUT') {
        lastUser = user;
        storageAssets.clear();
        // No async Supabase method is called inside this auth callback.
        if (typeof window !== 'undefined') window.dispatchEvent(new Event(STORAGE_SESSION_EVENT));
      }
    });
    dispose = () => subscription.unsubscribe();
  }
  return () => { subscriptions--; if (!subscriptions) { dispose?.(); dispose = undefined; storageAssets.clear(); } };
}
export async function createStorageFont(input: { family: string; dataUrl: string; fileName: string }): Promise<StoredFont> {
  if (!input.dataUrl.startsWith('data:')) throw new Error('Selecciona nuevamente el archivo de la fuente desde tu computador.');
  const response = await fetch(input.dataUrl);
  const blob = await response.blob();
  const file = new File([blob], input.fileName, { type: blob.type });
  const { row } = await storageAssets.upload(file, 'font', input.family);
  return fontFromRow(row);
}
export async function fetchLegacyAndStorageFonts(): Promise<StoredFont[]> {
  const stored = await storageAssets.listFonts();
  // Read-only compatibility with the original fonts table (camelCase or lower-case).
  const { data, error } = await supabase.from('fonts').select('*').order('created_at', { ascending: false });
  if (error) {
    console.warn('No se leyeron las fuentes antiguas; las nuevas usan diploma_storage_assets.');
    return stored;
  }
  const legacy = (data || []).map(f => ({
    id: String(f.id), family: String(f.family || f.name || 'Fuente'),
    format: (f.format === 'ttf' ? 'truetype' : f.format === 'otf' ? 'opentype' : f.format) as StoredFont['format'],
    dataUrl: f.dataUrl || f.dataurl || f.url || '', fileName: f.fileName || f.filename || f.name || '',
    createdAt: f.created_at || '', updatedAt: f.updated_at || f.created_at || '',
  })).filter(f => Boolean(f.dataUrl));
  return [...stored, ...legacy];
}
export async function deleteStorageOrLegacyFont(id: string) {
  if (id.startsWith('storage-')) return storageAssets.unregisterFont(id);
  const { error } = await supabase.from('fonts').delete().eq('id', id);
  if (error) throw new Error('No se pudo eliminar la fuente antigua. Revisa sus permisos.');
}
export function mergeFonts(a: StoredFont[], b: StoredFont[]): StoredFont[] {
  const map = new Map(a.map(font => [font.id, font]));
  for (const font of b) if (font && typeof font.id === 'string' && typeof font.dataUrl === 'string') map.set(font.id, font);
  return [...map.values()];
}
