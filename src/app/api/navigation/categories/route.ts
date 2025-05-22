import { NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/db-adapter';

export async function POST(request: Request) {
  const dbAdapter = createDatabaseAdapter();
  
  try {
    const category = await request.json();
    await dbAdapter.connect();
    const newCategory = await dbAdapter.addCategory(category);
    return NextResponse.json(newCategory);
  } catch (error) {
    console.error('Failed to create category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
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
      { error: 'Category ID is required' },
      { status: 400 }
    );
  }

  try {
    await dbAdapter.connect();
    await dbAdapter.deleteCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  } finally {
    await dbAdapter.disconnect();
  }
}