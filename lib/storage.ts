import fs from 'fs';
import path from 'path';
import os from 'os';
import { fetchAllCloudinaryGalleryItems, deleteFromCloudinary } from './cloudinary';

export interface GalleryItem {
  id: string;
  url: string;
  group: number;
  sentence: string;
  commitment?: string;
  time: number;
  token?: string;
  filename?: string;
  dataUrl?: string;
}

let memoryStore: GalleryItem[] = [];
let isMemoryStoreInitialized = false;
let lastCloudinaryFetch = 0;

export function getUploadsDir(): string {
  const localDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.accessSync(localDir, fs.constants.W_OK);
    return localDir;
  } catch (e) {
    const tmpDir = path.join(os.tmpdir(), 'tnuva-uploads');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}
    return tmpDir;
  }
}

export function getDataFilePath(): string {
  const localDir = path.join(process.cwd(), 'data');
  const localFile = path.join(localDir, 'gallery.json');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.accessSync(localDir, fs.constants.W_OK);
    return localFile;
  } catch (e) {
    const tmpDir = path.join(os.tmpdir(), 'tnuva-data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
    } catch {}
    return path.join(tmpDir, 'gallery.json');
  }
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const now = Date.now();
  // Fetch from Cloudinary every 3 seconds or on first init
  if (!isMemoryStoreInitialized || now - lastCloudinaryFetch > 3000) {
    try {
      const cloudItems = await fetchAllCloudinaryGalleryItems();
      if (cloudItems && cloudItems.length > 0) {
        memoryStore = cloudItems;
        isMemoryStoreInitialized = true;
        lastCloudinaryFetch = now;
        return memoryStore;
      }
    } catch (err) {
      console.warn('Cloudinary sync failed, using fallback:', err);
    }
  }

  const dataFile = getDataFilePath();
  try {
    if (fs.existsSync(dataFile)) {
      const raw = fs.readFileSync(dataFile, 'utf-8');
      const items: GalleryItem[] = JSON.parse(raw);
      if (memoryStore.length === 0) {
        memoryStore = items;
      }
      isMemoryStoreInitialized = true;
      return memoryStore;
    }
  } catch (err) {
    console.warn('Filesystem read warning (using memory store fallback):', err);
  }

  if (!isMemoryStoreInitialized) {
    memoryStore = [];
    isMemoryStoreInitialized = true;
  }
  return memoryStore;
}

export async function saveGalleryItems(items: GalleryItem[]): Promise<void> {
  memoryStore = [...items];
  isMemoryStoreInitialized = true;
  const dataFile = getDataFilePath();
  try {
    fs.writeFileSync(dataFile, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to dataFile (running in memory):', err);
  }
}

export async function addGalleryItem(item: GalleryItem): Promise<void> {
  const items = await getGalleryItems();
  const updated = [item, ...items.filter((i) => i.url !== item.url)];
  await saveGalleryItems(updated);
}

export async function deleteGalleryItemsByUrls(urls: string[]): Promise<string[]> {
  const items = await getGalleryItems();
  const deletedUrls: string[] = [];
  const remaining: GalleryItem[] = [];
  const urlSet = new Set(urls);
  const uploadsDir = getUploadsDir();
  const cloudinaryIdsToDelete: string[] = [];

  for (const item of items) {
    if (urlSet.has(item.url)) {
      deletedUrls.push(item.url);
      if (item.filename && item.filename.startsWith('tnuva-forum100/')) {
        cloudinaryIdsToDelete.push(item.filename);
      } else if (item.filename) {
        const filePath = path.join(uploadsDir, item.filename);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.warn('Could not delete file:', filePath, e);
        }
      }
    } else {
      remaining.push(item);
    }
  }

  if (cloudinaryIdsToDelete.length > 0) {
    await deleteFromCloudinary(cloudinaryIdsToDelete);
  }

  await saveGalleryItems(remaining);
  return deletedUrls;
}

export async function deleteGalleryItemByToken(url: string, token: string): Promise<boolean> {
  const items = await getGalleryItems();
  const target = items.find((i) => i.url === url && i.token === token);
  if (!target) {
    return false;
  }
  await deleteGalleryItemsByUrls([url]);
  return true;
}

export async function reorderGalleryItems(orderUrls: string[]): Promise<void> {
  const items = await getGalleryItems();
  const itemMap = new Map<string, GalleryItem>();
  for (const item of items) {
    itemMap.set(item.url, item);
  }

  const newOrder: GalleryItem[] = [];
  for (const url of orderUrls) {
    const item = itemMap.get(url);
    if (item) {
      newOrder.push(item);
      itemMap.delete(url);
    }
  }

  Array.from(itemMap.values()).forEach((remainingItem) => {
    newOrder.push(remainingItem);
  });

  await saveGalleryItems(newOrder);
}
