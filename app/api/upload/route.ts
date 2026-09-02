import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { addGalleryItem, GalleryItem, getUploadsDir } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const groupStr = (formData.get('group') as string) || '1';
    const sentence = (formData.get('sentence') as string) || '';
    const commitment = (formData.get('commitment') as string) || '';
    const clientToken = (formData.get('token') as string) || Math.random().toString(36).slice(2, 12);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const group = parseInt(groupStr, 10) || 1;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const originalName = file.name ? file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_') : 'image.jpg';
    const ext = path.extname(originalName) || '.jpg';
    const uniqueId = Math.random().toString(36).slice(2, 10);
    const timestamp = Date.now();
    const filename = `G${group}_${timestamp}_${uniqueId}${ext}`;

    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, filename);
    
    try {
      fs.writeFileSync(filePath, buffer);
    } catch (fsErr) {
      console.warn('Could not write file to uploadsDir, storing in memory fallback:', fsErr);
    }

    const mimeType = file.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    const fileUrl = `/uploads/${filename}`;

    const galleryItem: GalleryItem = {
      id: `${timestamp}-${uniqueId}`,
      url: fileUrl,
      group,
      sentence,
      commitment,
      time: timestamp,
      token: clientToken,
      filename,
      dataUrl,
    };

    await addGalleryItem(galleryItem);

    return NextResponse.json({
      url: fileUrl,
      token: clientToken,
      item: {
        id: galleryItem.id,
        url: fileUrl,
        group,
        sentence,
        commitment,
        time: timestamp,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 });
  }
}
