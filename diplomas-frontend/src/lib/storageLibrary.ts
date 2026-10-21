// DIPLOMA_EDITOR_LIBRARY_V4 - catalogo del bucket privado del usuario autenticado.
import { supabase } from './supabaseClient';
import { ASSETS_TABLE, STORAGE_BUCKET, parseReference, toReference, errorMessage } from './storageCore';

export type LibraryImage = {
  id: string;
  userId: string;
  fileName: string;
  mimeType: string;
  bytes: number;
  createdAt: string;
  path: string;
  reference: string;
};
export type LibraryPage = { images: LibraryImage[]; total: number };

async function currentUserId(): Promise<string> {
  // getUser consulta Supabase Auth y no confia solamente en los datos locales de sesion.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.id) throw new Error('Inicia sesion en el editor para ver tu biblioteca privada.');
  return user.id;
}

export async function listLibraryImages(page = 0, perPage = 24): Promise<LibraryPage> {
  const userId = await currentUserId();
  const offset = Math.max(0, Math.trunc(page)) * perPage;
  const { data, count, error } = await supabase.from(ASSETS_TABLE)
    .select('id,user_id,object_path,file_name,mime_type,byte_size,created_at', { count: 'exact' })
    .eq('user_id', userId).eq('kind', 'image')
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);
  if (error) throw new Error(errorMessage(error, 'consultar las imagenes de la biblioteca'));
  const images: LibraryImage[] = [];
  for (const row of data || []) {
    const path = String(row.object_path);
    const reference = toReference(path);
    const parsed = parseReference(reference);
    if (!parsed || parsed.owner !== userId || !path.includes('/images/')) continue;
    images.push({ id: String(row.id), userId, fileName: String(row.file_name || 'Imagen'),
      mimeType: String(row.mime_type || ''), bytes: Number(row.byte_size || 0),
      createdAt: String(row.created_at || ''), path, reference });
  }
  return { images, total: count || 0 };
}

// Comprueba TODAS las paginas accesibles del catalogo de disenos antes de borrar.
// Fallar cerrado: si no podemos comprobarlos, el archivo NO se elimina.
async function assertUnusedBySavedDesigns(reference: string): Promise<void> {
  const batchSize = 300;
  let page = 0;
  for (;;) {
    const { data, error } = await supabase.from('designs')
      .select('id,name,data,medal_images')
      .order('id', { ascending: true })
      .range(page * batchSize, (page + 1) * batchSize - 1);
    if (error) throw new Error('No se pudieron revisar los diseños guardados. No se eliminó la imagen para evitar perder referencias.');
    const rows = data || [];
    for (const item of rows) {
      if (JSON.stringify({ data: item.data, medal_images: item.medal_images }).includes(reference)) {
        throw new Error(`La imagen esta en el diseno guardado "${String(item.name || item.id)}". Quitala del diseno, guardalo y vuelve a intentar.`);
      }
    }
    if (rows.length < batchSize) break;
    page++;
    if (page >= 100) throw new Error('Hay demasiados disenos para revisar su uso con seguridad. No se borro el archivo.');
  }
}

export async function deleteLibraryImage(image: LibraryImage): Promise<void> {
  const userId = await currentUserId();
  const parsed = parseReference(image.reference);
  if (!parsed || parsed.bucket !== STORAGE_BUCKET || parsed.owner !== userId ||
      image.userId !== userId || parsed.path !== image.path || !parsed.path.includes('/images/')) {
    throw new Error('No puedes borrar una imagen que no pertenece a tu usuario.');
  }
  // Comprobar que el asset sigue registrado para este usuario.
  const { data: record, error: lookupError } = await supabase.from(ASSETS_TABLE)
    .select('id').eq('id', image.id).eq('user_id', userId)
    .eq('kind', 'image').eq('object_path', image.path).maybeSingle();
  if (lookupError || !record) throw new Error('No se encontro el archivo de este usuario en el catalogo. Actualiza la biblioteca.');
  await assertUnusedBySavedDesigns(image.reference);
  const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET).remove([image.path]);
  if (removeError) throw new Error(errorMessage(removeError, 'eliminar el archivo de Storage'));
  // Primero se elimina el objeto privado; despues la ficha del catalogo.
  const { error: metadataError } = await supabase.from(ASSETS_TABLE).delete()
    .eq('id', image.id).eq('user_id', userId).eq('kind', 'image');
  if (metadataError) throw new Error('El archivo se elimino de Storage, pero no se pudo retirar su ficha. Actualiza la biblioteca y contacta al administrador.');
}
