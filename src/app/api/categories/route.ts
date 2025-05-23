import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { Category } from '@/lib/db-adapter';

export async function GET() {
  try {
    const db = await getDatabase();
    const categories = await db.getCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: '获取分类列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const db = await getDatabase();
    
    // 验证必要字段
    if (!data.name || !data.slug) {
      return NextResponse.json(
        { error: '名称和标识符是必填项' },
        { status: 400 }
      );
    }

    const category: Omit<Category, 'id'> = {
      name: data.name,
      slug: data.slug,
      createdDate: new Date().toISOString(),
      icon: data.icon || ''
    };

    const newCategory = await db.addCategory(category);
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: '创建分类失败' },
      { status: 500 }
    );
  }
}