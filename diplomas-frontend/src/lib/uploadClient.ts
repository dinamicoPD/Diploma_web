// DIPLOMA_STORAGE_V1 - direct authenticated uploads; no /api/upload or Cloudinary.
import { storageAssets } from './storageAssets';
export async function uploadImage(file: File): Promise<string> {
  return (await storageAssets.upload(file, 'image')).reference;
}
export async function uploadFont(file: File): Promise<string> {
  return (await storageAssets.upload(file, 'font')).reference;
}
