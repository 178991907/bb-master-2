import { NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/db-adapter';

export async function POST(request: Request) {
  const dbAdapter = createDatabaseAdapter();
  
  try {
    const link = await request.json();
    await dbAdapter.connect();
    const newLink = await dbAdapter.addLink(link);
    return NextResponse.json(newLink);
  } catch (error) {
    console.error('Failed to create link:', error);
    return NextResponse.json(
      { error: 'Failed to create link' },
      { status: 500 }
    );
  } finally {
    await dbAdapter.disconnect();
  }
}

export async function DELETE(request: Request) {
  const dbAdapter = createDatabaseAdapter();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Link ID is required' },
      { status: 400 }
    );
  }

  try {
    await dbAdapter.connect();
    await dbAdapter.deleteLink(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete link:', error);
    return NextResponse.json(
      { error: 'Failed to delete link' },
      { status: 500 }
    );
  } finally {
    await dbAdapter.disconnect();
  }
}