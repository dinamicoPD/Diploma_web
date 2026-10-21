'use client';
// DIPLOMA_STORAGE_V1
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { storageAssets, reportStorageError, STORAGE_SESSION_EVENT } from '@/lib/storageAssets';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string };
export default function StorageImage({ src, alt = '', onError, ...props }: Props) {
  const [resolved, setResolved] = useState<{ reference?: string; url?: string }>({});
  const [epoch, setEpoch] = useState(0);
  useEffect(() => {
    const changed = () => { setResolved({}); setEpoch(value => value + 1); };
    window.addEventListener(STORAGE_SESSION_EVENT, changed);
    return () => window.removeEventListener(STORAGE_SESSION_EVENT, changed);
  }, []);
  useEffect(() => {
    let active = true;
    void storageAssets.displayUrl(src).then(url => {
      if (active) setResolved({ reference: src, url });
    }).catch(error => { if (active) { setResolved({ reference: src }); reportStorageError(error); } });
    return () => { active = false; };
  }, [src, epoch]);
  const privateRef = src?.startsWith('supabase://');
  // No blob or temporary URL is written back to application state or the database.
  const legacyUrl = src && /^(https?:\/\/|data:image\/|blob:|\/)/i.test(src) ? src : undefined;
  const display = resolved.reference === src ? resolved.url : (privateRef ? undefined : legacyUrl);
  return <img {...props} alt={alt} src={display || undefined}
    data-storage-ref={privateRef ? src : undefined}
    onError={event => {
      if (privateRef) reportStorageError(new Error('No se pudo mostrar una imagen privada. Comprueba Storage y vuelve a abrir el diseno.'));
      onError?.(event);
    }} />;
}
