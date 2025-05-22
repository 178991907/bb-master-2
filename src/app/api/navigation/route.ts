import { NextResponse } from 'next/server';
import { createDatabaseAdapter } from '@/lib/db-adapter';

export async function GET() {
  const dbAdapter = createDatabaseAdapter();
  
  try {
    await dbAdapter.connect();
    const [categories, links] = await Promise.all([
      dbAdapter.getCategories(),
      dbAdapter.getLinks()
    ]);
    
    return NextResponse.json({ categories, links });
  } catch (error) {
    console.error('Failed to fetch navigation data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch navigation data' },
      { status: 500 }
    );
  } finally {
    await dbAdapter.disconnect();
  }
}