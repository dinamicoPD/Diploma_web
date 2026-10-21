// DIPLOMA_STORAGE_V1 - no secrets, Cloudinary or server upload endpoint.
// Persistent values are supabase:// references. Blob URLs exist only in memory.
export const STORAGE_BUCKET = 'diploma-assets';
export const ASSETS_TABLE = 'diploma_storage_assets';
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_FONT_BYTES = 10 * 1024 * 1024;
export type AssetKind = 'image' | 'font';
export type FontFormat = 'woff2' | 'woff' | 'truetype' | 'opentype';
export type StoredFont = { id: string; family: string; format: FontFormat; dataUrl: string; fileName: string; createdAt: string; updatedAt: string };
export type AssetRow = {
  id: string; user_id: string; bucket_id: string; object_path: string; kind: AssetKind;
  file_name: string; mime_type: string; byte_size: number; family: string | null;
  font_format: FontFormat | null; created_at: string;
};
// Structural interface keeps this module testable without real credentials.
// The actual adapter is the existing Supabase JS v2 client.
export interface StorageAdapter {
  auth: { getSession(): Promise<{ data: { session: { user: { id: string }; access_token: string } | null }; error: unknown }> };
  storage: { from(bucket: string): {
    upload(path: string, file: Blob, opts: { contentType: string; cacheControl: string; upsert: boolean }): Promise<{ error: unknown }>;
    download(path: string): Promise<{ data: Blob | null; error: unknown }>;
    remove(paths: string[]): Promise<{ error: unknown }>;
  } };
  // Supabase's PostgREST query builder is intentionally isolated at this boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parseReference(value: string): { bucket: string; path: string; owner: string } | null {
  if (!value.startsWith('supabase://')) return null;
  const parts = value.slice('supabase://'.length).split('/');
  const [bucket, owner, folder, file] = parts;
  if (parts.length !== 4 || bucket !== STORAGE_BUCKET || !UUID.test(owner || '') ||
      !['images', 'fonts'].includes(folder) || !/^[0-9a-f-]{36}\.(png|jpg|gif|webp|ttf|otf|woff|woff2)$/i.test(file || '')) {
    throw new Error('Referencia de Storage no valida o de otro bucket.');
  }
  return { bucket, owner, path: `${owner}/${folder}/${file}` };
}
export function toReference(path: string): string {
  const ref = `supabase://${STORAGE_BUCKET}/${path}`;
  parseReference(ref);
  return ref;
}
export function errorMessage(error: unknown, operation: string): string {
  const message = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error || '');
  if (/bucket.*not found|bucket.*does not exist/i.test(message)) return 'No existe el bucket privado diploma-assets. Ejecuta el SQL de la migracion en tu proyecto Supabase.';
  if (/row.level|permission|unauthorized|not authorized|403|policy/i.test(message)) return 'Supabase rechazo el acceso. Revisa las politicas RLS y que estes usando el usuario propietario del archivo.';
  if (/relation.*does not exist|schema cache|could not find.*table/i.test(message)) return 'Falta la tabla diploma_storage_assets. Ejecuta el SQL de la migracion y vuelve a probar.';
  if (/not found|does not exist|object not found/i.test(message)) return 'No se encontro el archivo en Storage o no tienes permiso para leerlo. Revisa el usuario y el proyecto Supabase.';
  if (/size|exceed|413/i.test(message)) return 'El archivo supera el limite del bucket o del proyecto Supabase.';
  if (/mime|content.type/i.test(message)) return 'El tipo de archivo no esta permitido en el bucket. Comprueba su configuracion.';
  return `No se pudo ${operation}. Comprueba la conexion, la sesion y la configuracion de Supabase Storage.`;
}
export async function detectFile(file: File, kind: AssetKind) {
  if (!file || !file.size) throw new Error('Selecciona un archivo no vacio.');
  const max = kind === 'image' ? MAX_IMAGE_BYTES : MAX_FONT_BYTES;
  if (file.size > max) throw new Error(`El archivo supera el limite de ${max / 1024 / 1024} MiB.`);
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const starts = (...values: number[]) => values.every((v, i) => b[i] === v);
  const ascii = (offset: number, text: string) => [...text].every((c, i) => b[offset + i] === c.charCodeAt(0));
  if (kind === 'image') {
    if (starts(137, 80, 78, 71, 13, 10, 26, 10)) return { ext: 'png', mime: 'image/png', format: null };
    if (starts(255, 216, 255)) return { ext: 'jpg', mime: 'image/jpeg', format: null };
    if (ascii(0, 'GIF87a') || ascii(0, 'GIF89a')) return { ext: 'gif', mime: 'image/gif', format: null };
    if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return { ext: 'webp', mime: 'image/webp', format: null };
    throw new Error('Selecciona una imagen PNG, JPG, GIF o WEBP. SVG, HEIC y PDF no se admiten como imagenes subidas.');
  }
  if (ascii(0, 'wOF2')) return { ext: 'woff2', mime: 'font/woff2', format: 'woff2' as FontFormat };
  if (ascii(0, 'wOFF')) return { ext: 'woff', mime: 'font/woff', format: 'woff' as FontFormat };
  if (ascii(0, 'OTTO')) return { ext: 'otf', mime: 'font/otf', format: 'opentype' as FontFormat };
  if (starts(0, 1, 0, 0) || ascii(0, 'true')) return { ext: 'ttf', mime: 'font/ttf', format: 'truetype' as FontFormat };
  throw new Error('Selecciona una fuente TTF, OTF, WOFF o WOFF2 valida.');
}
export function fontFromRow(row: AssetRow): StoredFont {
  return { id: `storage-${row.id}`, family: row.family || 'Fuente', format: row.font_format || 'truetype',
    dataUrl: toReference(row.object_path), fileName: row.file_name, createdAt: row.created_at, updatedAt: row.created_at };
}
export function createStorageService(client: StorageAdapter, runtime = {
  makeUrl: (blob: Blob) => URL.createObjectURL(blob), revokeUrl: (url: string) => URL.revokeObjectURL(url),
  uuid: () => crypto.randomUUID(),
}) {
  const cache = new Map<string, Promise<string>>();
  const urls = new Set<string>();
  let generation = 0;
  async function userId(): Promise<string> {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session?.access_token || !UUID.test(data.session.user.id)) {
      throw new Error('Inicia sesion con un usuario de Supabase Auth antes de acceder a los archivos.');
    }
    return data.session.user.id;
  }
  function clear() {
    generation++;
    cache.clear();
    for (const url of urls) runtime.revokeUrl(url);
    urls.clear();
  }
  async function displayUrl(reference?: string): Promise<string | undefined> {
    if (!reference) return undefined;
    const ref = parseReference(reference);
    if (!ref) {
      if (/^(https?:\/\/|data:(image|font|application)\/|blob:|\/)/i.test(reference)) return reference;
      throw new Error('La direccion del recurso no esta permitida.');
    }
    const owner = await userId();
    if (owner !== ref.owner) throw new Error('Este archivo pertenece a otro usuario. Inicia sesion con su propietario.');
    const key = `${owner}:${reference}`;
    let pending = cache.get(key);
    if (!pending) {
      const epoch = generation;
      pending = (async () => {
        const { data, error } = await client.storage.from(ref.bucket).download(ref.path);
        if (error || !data) throw new Error(errorMessage(error, 'descargar el archivo privado'));
        if (epoch !== generation) throw new Error('La sesion cambio durante la descarga. Vuelve a abrir el diseno.');
        const url = runtime.makeUrl(data);
        urls.add(url);
        return url;
      })();
      cache.set(key, pending);
      pending.catch(() => { if (cache.get(key) === pending) cache.delete(key); });
    }
    return pending;
  }
  async function upload(file: File, kind: AssetKind, family?: string): Promise<{ reference: string; row: AssetRow }> {
    const user = await userId();
    const info = await detectFile(file, kind);
    const id = runtime.uuid();
    const path = `${user}/${kind === 'image' ? 'images' : 'fonts'}/${id}.${info.ext}`;
    const bucket = client.storage.from(STORAGE_BUCKET);
    const { error: uploadError } = await bucket.upload(path, new Blob([file], { type: info.mime }), {
      contentType: info.mime, cacheControl: '3600', upsert: false,
    });
    if (uploadError) throw new Error(errorMessage(uploadError, 'subir el archivo'));
    const fileName = file.name.replace(/[\u0000-\u001f/\\]/g, '_').slice(0, 200) || `archivo.${info.ext}`;
    const rowInput = {
      id, user_id: user, bucket_id: STORAGE_BUCKET, object_path: path, kind,
      file_name: fileName, mime_type: info.mime, byte_size: file.size,
      family: kind === 'font' ? (family || fileName.replace(/\.(woff2?|ttf|otf)$/i, '').replace(/[_-]/g, ' ')).trim().slice(0, 120) || 'Fuente' : null,
      font_format: info.format,
    };
    try {
      const { data, error } = await client.from(ASSETS_TABLE).insert(rowInput).select('*').single();
      if (error || !data) throw new Error(errorMessage(error, 'registrar el archivo'));
      return { reference: toReference(path), row: data as AssetRow };
    } catch (error) {
      // Roll back only the object just uploaded. Existing objects are never touched.
      let cleaned = false;
      try { const result = await bucket.remove([path]); cleaned = !result.error; } catch { /* report below */ }
      const reason = error instanceof Error ? error.message : 'No se pudo registrar el archivo.';
      throw new Error(reason + (cleaned ? ' La subida incompleta se retiro.' : ' Quedo un archivo sin registrar; revisalo en Storage antes de volver a subir.'));
    }
  }
  async function listFonts(): Promise<StoredFont[]> {
    const user = await userId();
    const { data, error } = await client.from(ASSETS_TABLE).select('*').eq('user_id', user).eq('kind', 'font').order('created_at', { ascending: false });
    if (error) throw new Error(errorMessage(error, 'leer el catalogo de fuentes'));
    return (data || []).map(fontFromRow);
  }
  async function unregisterFont(id: string) {
    const user = await userId();
    const rawId = id.replace(/^storage-/, '');
    if (!UUID.test(rawId)) throw new Error('Identificador de fuente no valido.');
    const { error } = await client.from(ASSETS_TABLE).delete().eq('id', rawId).eq('user_id', user).eq('kind', 'font');
    if (error) throw new Error(errorMessage(error, 'retirar la fuente del catalogo'));
    // The binary is retained: saved designs may contain a font manifest referencing it.
  }
  return { upload, displayUrl, clear, listFonts, unregisterFont };
}
