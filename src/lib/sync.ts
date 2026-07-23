import fs from 'fs/promises';
import path from 'path';
import { extractPublicIdFromUrl, deleteImage } from './cloudinary';

const SYNC_FILE_PATH = path.join(process.cwd(), 'data', 'sync_state.json');

async function getSyncState() {
  try {
    const data = await fs.readFile(SYNC_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error: any) {
    // If file doesn't exist or is invalid, return empty state
    if (error.code === 'ENOENT') {
      return {};
    }
    console.error('Error reading sync state:', error);
    return {};
  }
}

async function saveSyncState(state: any) {
  try {
    await fs.mkdir(path.dirname(SYNC_FILE_PATH), { recursive: true });
    await fs.writeFile(SYNC_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving sync state:', error);
  }
}

export async function syncAndDeleteOrphans(proveedor: string, currentUrls: string[]) {
  if (!proveedor) return;

  const state = await getSyncState();
  const previousUrls: string[] = state[proveedor] || [];

  // Find URLs that were in the previous state but are NOT in the current URLs
  const orphanUrls = previousUrls.filter(oldUrl => !currentUrls.includes(oldUrl));

  if (orphanUrls.length > 0) {
    console.log(`[Sync] Found ${orphanUrls.length} orphan URLs for provider ${proveedor}. Deleting from Cloudinary...`);
    
    // Process deletions
    const deletePromises = orphanUrls.map(async (url) => {
      const publicId = extractPublicIdFromUrl(url);
      if (publicId) {
        try {
          await deleteImage(publicId);
          console.log(`[Sync] Deleted orphan image: ${publicId}`);
        } catch (err: any) {
          console.error(`[Sync] Failed to delete image ${publicId}:`, err.message);
        }
      }
    });

    // Wait for all deletions to finish
    await Promise.allSettled(deletePromises);
  }

  // Update the state with the new current URLs
  state[proveedor] = currentUrls;
  await saveSyncState(state);
  console.log(`[Sync] State updated for provider ${proveedor}. Total tracked URLs: ${currentUrls.length}`);
}
