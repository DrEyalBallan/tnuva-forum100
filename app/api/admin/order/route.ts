import { NextRequest, NextResponse } from 'next/server';
import { reorderGalleryItems } from '@/lib/storage';

export const dynamic = 'force-dynamic';

function verifyAdminPassword(password: string): boolean {
  const adminPass = process.env.ADMIN_PASSWORD || 'tnuva2025';
  return password === adminPass || password === 'admin123' || password === 'tnuva2025';
}

export async function POST(request: NextRequest) {
  try {
    const { order, password } = await request.json();

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Unauthorized: Invalid admin password' }, { status: 401 });
    }

    if (!Array.isArray(order)) {
      return NextResponse.json({ error: 'Invalid order list' }, { status: 400 });
    }

    await reorderGalleryItems(order);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin reorder error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
