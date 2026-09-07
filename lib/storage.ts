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

let deletedIdentifiers = new Set<string>();
let isDeletedStoreInitialized = false;

function getDeletedDataFilePath(): string {
  const localDir = path.join(process.cwd(), 'data');
  const localFile = path.join(localDir, 'deleted.json');
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
    return path.join(tmpDir, 'deleted.json');
  }
}

export function getDeletedIdentifiers(): Set<string> {
  if (isDeletedStoreInitialized) return deletedIdentifiers;
  const filePath = getDeletedDataFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const list: string[] = JSON.parse(raw);
      deletedIdentifiers = new Set(list);
    }
  } catch {}
  isDeletedStoreInitialized = true;
  return deletedIdentifiers;
}

export function saveDeletedIdentifiers(set: Set<string>): void {
  deletedIdentifiers = set;
  isDeletedStoreInitialized = true;
  const filePath = getDeletedDataFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(Array.from(set)), 'utf-8');
  } catch {}
}

export function extractItemKeys(item: Partial<GalleryItem> | string): string[] {
  const keys: string[] = [];
  if (typeof item === 'string') {
    keys.push(item);
    const match = item.match(/\/upload\/(?:[^\/]+\/)*(?:v\d+\/)?([^\.]+)/);
    if (match && match[1]) {
      const clean = match[1];
      keys.push(clean);
      const withoutFolder = clean.replace(/^tnuva-forum100\//, '');
      keys.push(withoutFolder);
      keys.push(`tnuva-forum100/${withoutFolder}`);
    }
  } else if (item) {
    if (item.id) keys.push(item.id);
    if (item.filename) {
      const fn = item.filename;
      keys.push(fn);
      const withoutFolder = fn.replace(/^tnuva-forum100\//, '');
      keys.push(withoutFolder);
      keys.push(`tnuva-forum100/${withoutFolder}`);
    }
    if (item.url) {
      keys.push(...extractItemKeys(item.url));
    }
  }
  return Array.from(new Set(keys.filter(Boolean)));
}

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
  const deletedSet = getDeletedIdentifiers();

  // Fetch from Cloudinary every 3 seconds or on first init
  if (!isMemoryStoreInitialized || now - lastCloudinaryFetch > 3000) {
    try {
      const cloudItems = await fetchAllCloudinaryGalleryItems();
      if (cloudItems && cloudItems.length > 0) {
        // Filter out any items that were deleted
        const activeItems = cloudItems.filter((item) => {
          const keys = extractItemKeys(item);
          return !keys.some((k) => deletedSet.has(k));
        });
        memoryStore = activeItems;
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
      const activeItems = items.filter((item) => {
        const keys = extractItemKeys(item);
        return !keys.some((k) => deletedSet.has(k));
      });
      if (memoryStore.length === 0) {
        memoryStore = activeItems;
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
  // Remove item from deleted set if re-uploaded
  const deletedSet = getDeletedIdentifiers();
  const keys = extractItemKeys(item);
  let changed = false;
  keys.forEach((k) => {
    if (deletedSet.delete(k)) changed = true;
  });
  if (changed) {
    saveDeletedIdentifiers(deletedSet);
  }

  const updated = [item, ...items.filter((i) => i.url !== item.url && i.id !== item.id)];
  await saveGalleryItems(updated);
}

export async function deleteGalleryItemsByUrls(urls: string[]): Promise<string[]> {
  const items = await getGalleryItems();
  const deletedUrls: string[] = [];
  const remaining: GalleryItem[] = [];
  const uploadsDir = getUploadsDir();
  const cloudinaryIdsToDelete: string[] = [];

  const targetKeysSet = new Set<string>();
  for (const u of urls) {
    extractItemKeys(u).forEach((k) => targetKeysSet.add(k));
  }

  // Update persistent deleted items set
  const deletedSet = getDeletedIdentifiers();
  targetKeysSet.forEach((k) => deletedSet.add(k));

  for (const item of items) {
    const itemKeys = extractItemKeys(item);
    const isTarget = itemKeys.some((k) => targetKeysSet.has(k));

    if (isTarget) {
      deletedUrls.push(item.url);
      itemKeys.forEach((k) => deletedSet.add(k));

      // Collect Cloudinary public IDs to destroy
      if (item.filename) {
        cloudinaryIdsToDelete.push(item.filename);
        cloudinaryIdsToDelete.push(item.filename.replace(/^tnuva-forum100\//, ''));
        cloudinaryIdsToDelete.push(`tnuva-forum100/${item.filename.replace(/^tnuva-forum100\//, '')}`);
      }
      const match = item.url.match(/\/upload\/(?:[^\/]+\/)*(?:v\d+\/)?([^\.]+)/);
      if (match && match[1]) {
        cloudinaryIdsToDelete.push(match[1]);
        cloudinaryIdsToDelete.push(match[1].replace(/^tnuva-forum100\//, ''));
        cloudinaryIdsToDelete.push(`tnuva-forum100/${match[1].replace(/^tnuva-forum100\//, '')}`);
      }

      // Also delete local file if any
      if (item.filename) {
        const filePath = path.join(uploadsDir, item.filename);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.warn('Could not delete local file:', filePath, e);
        }
      }
    } else {
      remaining.push(item);
    }
  }

  saveDeletedIdentifiers(deletedSet);

  if (cloudinaryIdsToDelete.length > 0) {
    const uniqueIds = Array.from(new Set(cloudinaryIdsToDelete));
    await deleteFromCloudinary(uniqueIds);
  }

  await saveGalleryItems(remaining);
  return deletedUrls;
}

export async function deleteGalleryItemByToken(url: string, token: string): Promise<boolean> {
  const items = await getGalleryItems();
  const targetKeys = new Set(extractItemKeys(url));
  const target = items.find((i) => {
    const keys = extractItemKeys(i);
    return keys.some((k) => targetKeys.has(k)) && i.token === token;
  });
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
    itemMap.set(item.id, item);
  }

  const newOrder: GalleryItem[] = [];
  for (const url of orderUrls) {
    const item = itemMap.get(url);
    if (item) {
      newOrder.push(item);
      itemMap.delete(item.url);
      itemMap.delete(item.id);
    }
  }

  Array.from(itemMap.values()).forEach((remainingItem) => {
    if (!newOrder.some((i) => i.id === remainingItem.id)) {
      newOrder.push(remainingItem);
    }
  });

  await saveGalleryItems(newOrder);
}
