import fs from 'fs';
import path from 'path';

export interface GalleryItem {
  id: string;
  url: string;
  group: number;
  sentence: string;
  commitment?: string;
  time: number;
  token?: string;
  filename?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'gallery.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

// In-memory fallback if filesystem is read-only (e.g. serverless environment)
let memoryStore: GalleryItem[] = [];
let isMemoryStoreInitialized = false;

function ensureDirectories() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Filesystem access warning (using memory store fallback):', err);
  }
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  ensureDirectories();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const items: GalleryItem[] = JSON.parse(raw);
      memoryStore = items;
      isMemoryStoreInitialized = true;
      return items;
    }
  } catch (err) {
    console.warn('Could not read gallery.json, falling back to memory store:', err);
  }
  if (!isMemoryStoreInitialized) {
    memoryStore = [];
    isMemoryStoreInitialized = true;
  }
  return memoryStore;
}

export async function saveGalleryItems(items: GalleryItem[]): Promise<void> {
  ensureDirectories();
  memoryStore = [...items];
  isMemoryStoreInitialized = true;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write to gallery.json (running in memory):', err);
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

  for (const item of items) {
    if (urlSet.has(item.url)) {
      deletedUrls.push(item.url);
      if (item.url.startsWith('/uploads/')) {
        const localPath = path.join(process.cwd(), 'public', item.url);
        try {
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
        } catch (e) {
          console.warn('Could not delete local file:', localPath, e);
        }
      }
    } else {
      remaining.push(item);
    }
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

  // Append any remaining items that were not in the order list
  Array.from(itemMap.values()).forEach((remainingItem) => {
    newOrder.push(remainingItem);
  });

  await saveGalleryItems(newOrder);
}
