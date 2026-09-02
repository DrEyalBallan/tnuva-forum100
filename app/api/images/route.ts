import { NextResponse } from 'next/server';
import { getGalleryItems } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await getGalleryItems();
    const publicItems = items.map(item => ({
      id: item.id,
      url: item.url,
      group: item.group,
      sentence: item.sentence || '',
      commitment: item.commitment || '',
      time: item.time,
    }));
    return NextResponse.json({ images: publicItems }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
  }
}
