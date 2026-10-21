'use client';
// DIPLOMA_STORAGE_V1
import { useEffect, useState } from 'react';
import { fetchLegacyAndStorageFonts, mergeFonts, watchStorageSession, reportStorageError,
  STORAGE_ERROR_EVENT, STORAGE_SESSION_EVENT, type StoredFont } from '@/lib/storageAssets';
import { registerFont, clearFontFaces } from '@/lib/storageRender';

type Props = { fontAssets?: StoredFont[]; loadFonts?: boolean };
export default function StorageStatus({ fontAssets, loadFonts = false }: Props) {
  const [message, setMessage] = useState('');
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    const showError = (event: Event) => setMessage(String((event as CustomEvent).detail || 'Error de Storage.'));
    const changed = () => { clearFontFaces(); setEpoch(value => value + 1); setMessage(''); };
    window.addEventListener(STORAGE_ERROR_EVENT, showError);
    window.addEventListener(STORAGE_SESSION_EVENT, changed);
    const stop = watchStorageSession();
    return () => { window.removeEventListener(STORAGE_ERROR_EVENT, showError); window.removeEventListener(STORAGE_SESSION_EVENT, changed); stop(); };
  }, []);
  useEffect(() => {
    let active = true;
    const install = async () => {
      const saved = Array.isArray(fontAssets) ? fontAssets : [];
      const catalog = loadFonts ? await fetchLegacyAndStorageFonts() : [];
      if (!active) return;
      const all = mergeFonts(catalog, saved);
      for (const font of all) void registerFont(font).catch(reportStorageError);
    };
    void install().catch(error => { if (active) reportStorageError(error); });
    return () => { active = false; };
  }, [fontAssets, loadFonts, epoch]);
  return message ? <div role="alert" className="alert alert-danger my-3">
    <strong>Almacenamiento:</strong> {message}
    <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => setMessage('')}>Cerrar aviso</button>
  </div> : null;
}
