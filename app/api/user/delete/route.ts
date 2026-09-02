import { NextRequest, NextResponse } from 'next/server';
import { deleteGalleryItemByToken } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { url, token } = await request.json();
    if (!url || !token) {
      return NextResponse.json({ error: 'Missing url or token' }, { status: 400 });
    }

    const success = await deleteGalleryItemByToken(url, token);
    if (!success) {
      return NextResponse.json({ error: 'Unauthorized or image not found' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('User delete error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
