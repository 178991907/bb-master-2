import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { LinkItem } from '@/lib/db-adapter';

export async function GET() {
  try {
    const db = await getDatabase();
    const links = await db.getLinks();
    return NextResponse.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    return NextResponse.json(
      { error: '获取链接列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const db = await getDatabase();
    
    // 验证必要字段
    if (!data.title || !data.url || !data.categoryId) {
      return NextResponse.json(
        { error: '标题、URL和分类ID是必填项' },
        { status: 400 }
      );
    }

    const link: Omit<LinkItem, 'id'> = {
      title: data.title,
      url: data.url,
      categoryId: data.categoryId,
      createdDate: new Date().toISOString(),
      imageUrl: data.imageUrl || '',
      aiHint: data.aiHint || '',
      description: data.description || '',
      faviconUrl: data.faviconUrl || ''
    };

    const newLink = await db.addLink(link);
    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    console.error('Error creating link:', error);
    return NextResponse.json(
      { error: '创建链接失败' },
      { status: 500 }
    );
  }
}