import { NextRequest, NextResponse } from 'next/server';
import { getGalleryItems } from '@/lib/storage';
import { EVENT_CONFIG } from '@/lib/eventConfig';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    // When event is shut off / inactive and not an admin request, return empty images to prevent live playback
    if (!EVENT_CONFIG.isActive && !isAdmin) {
      return NextResponse.json({ images: [] }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }

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
