'use client';
// DIPLOMA_EDITOR_LIBRARY_V4
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import StorageImage from './StorageImage';
import { deleteLibraryImage, listLibraryImages, type LibraryImage } from '@/lib/storageLibrary';
import { STORAGE_SESSION_EVENT } from '@/lib/storageAssets';

export type LibraryTarget = 'element' | 'watermark' | 'linked' | 'background';
type Props = {
  onUse: (reference: string, target: LibraryTarget) => void;
  currentReferences: string[];
};
const PAGE_SIZE = 24;

export default function StorageLibrary({ onUse, currentReferences }: Props) {
  const [page, setPage] = useState(0);
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const refresh = useCallback(async (pageNumber: number) => {
    setBusy(true);
    setError('');
    try {
      const result = await listLibraryImages(pageNumber, PAGE_SIZE);
      setImages(result.images);
      setTotal(result.total);
    } catch (cause) {
      setImages([]);
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar la biblioteca.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { void refresh(page); }, [page, refresh]);
  useEffect(() => {
    const onSession = () => {
      setImages([]);
      setPage(0);
      void refresh(0);
    };
    window.addEventListener(STORAGE_SESSION_EVENT, onSession);
    return () => window.removeEventListener(STORAGE_SESSION_EVENT, onSession);
  }, [refresh]);

  const remove = async (asset: LibraryImage) => {
    if (currentReferences.includes(asset.reference)) {
      setError('Esta imagen todavia se utiliza en el diseño abierto. Retirala, guarda el diseño y vuelve a intentar.');
      return;
    }
    const ok = window.confirm(
      `¿Eliminar DEFINITIVAMENTE "${asset.fileName}" de Supabase Storage?\n\n` +
      'Se comprobarán los diseños guardados. No se borrará si está en uso. No existe papelera para este archivo.'
    );
    if (!ok) return;
    setDeleting(asset.id);
    setError('');
    setMessage('');
    try {
      await deleteLibraryImage(asset);
      setMessage('Imagen eliminada del almacenamiento.');
      await refresh(page);
      if (images.length === 1 && page > 0) setPage(p => p - 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible eliminar la imagen.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <div>
          <strong>Mis imagenes guardadas</strong>
          <div className="small text-body-secondary">Supabase Storage / diploma-assets · Tu cuenta</div>
        </div>
        <Button size="sm" variant="outline-secondary" disabled={busy || deleting !== null}
          onClick={() => void refresh(page)}>Actualizar</Button>
      </div>
      {error && <Alert variant="danger" role="alert" className="small">{error}</Alert>}
      {message && <Alert variant="success" role="status" className="small">{message}</Alert>}
      {busy && <div role="status" className="small my-3"><Spinner size="sm" animation="border" /> Consultando archivos...</div>}
      {!busy && total === 0 && !error && <p className="small text-body-secondary">No hay imagenes registradas para este usuario. Sube un logo, fondo o marca de agua y pulsa Actualizar.</p>}
      <div className="d-grid gap-2">
        {images.map(image => {
          const inUse = currentReferences.includes(image.reference);
          return <div key={image.id} className="border rounded p-2" style={{ background: '#f8fafc' }}>
            <div className="d-flex gap-2 align-items-start">
              <div style={{width:72,height:72,flexShrink:0,background:'#fff',border:'1px solid #dbe5ef',borderRadius:6,overflow:'hidden'}}>
                <StorageImage src={image.reference} alt={image.fileName}
                  style={{width:'100%',height:'100%',objectFit:'contain'}} />
              </div>
              <div className="flex-grow-1" style={{minWidth:0}}>
                <div title={image.fileName} className="small fw-semibold text-truncate">{image.fileName}</div>
                <div className="small text-body-secondary">{(image.bytes / 1024).toFixed(0)} KB</div>
                {inUse && <span className="small text-primary">En uso en el diseño abierto</span>}
              </div>
            </div>
            <div className="d-flex gap-1 flex-wrap mt-2">
              <Button size="sm" variant="outline-primary" disabled={deleting !== null} onClick={() => onUse(image.reference, 'element')}>Al lienzo</Button>
              <Button size="sm" variant="outline-primary" disabled={deleting !== null} onClick={() => onUse(image.reference, 'watermark')}>Marca de agua</Button>
              <Button size="sm" variant="outline-primary" disabled={deleting !== null} onClick={() => onUse(image.reference, 'linked')}>Fondo vinculado</Button>
              <Button size="sm" variant="outline-secondary" disabled={deleting !== null} onClick={() => onUse(image.reference, 'background')}>Fondo principal</Button>
              <Button size="sm" variant="outline-danger" disabled={deleting !== null || inUse}
                onClick={() => void remove(image)}>{deleting === image.id ? 'Eliminando...' : 'Eliminar del Storage'}</Button>
            </div>
          </div>;
        })}
      </div>
      {total > PAGE_SIZE && (
        <div className="d-flex align-items-center justify-content-between mt-3">
          <Button size="sm" variant="outline-secondary" disabled={busy || deleting !== null || page === 0}
            onClick={() => setPage(p => Math.max(0,p-1))}>Anterior</Button>
          <span className="small" aria-live="polite">Pagina {page+1} de {Math.ceil(total/PAGE_SIZE)} · {total} imagenes</span>
          <Button size="sm" variant="outline-secondary" disabled={busy || deleting !== null || (page+1)*PAGE_SIZE >= total}
            onClick={() => setPage(p=>p+1)}>Siguiente</Button>
        </div>
      )}
      <p className="small text-body-secondary mt-3 mb-0">
        Eliminar del Storage es permanente. Quitar una imagen del lienzo no elimina el archivo de tu biblioteca.
        Se muestran solo las imagenes registradas por esta cuenta; las fuentes se administran por separado.
      </p>
    </div>
  );
}
