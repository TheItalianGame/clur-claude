import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // First ensure schema updates are applied
    await import('@/lib/db/apply-updates');
    
    const categories = db.prepare(`
      SELECT c.*, 
        COUNT(rt.id) as record_type_count
      FROM record_categories c
      LEFT JOIN record_types rt ON c.id = rt.category_id
      GROUP BY c.id
      ORDER BY c.order_index, c.display_name
    `).all();
    
    // If no categories exist, return empty array
    if (!categories || categories.length === 0) {
      return NextResponse.json([]);
    }
    
    // For each category, get its record types
    const categoriesWithTypes = categories.map((category: any) => {
      const recordTypes = db.prepare(`
        SELECT * FROM record_types 
        WHERE category_id = ? 
          AND show_in_sidebar = 1
        ORDER BY order_index, display_name
      `).all(category.id);
      
      return {
        ...category,
        record_types: recordTypes || []
      };
    });
    
    return NextResponse.json(categoriesWithTypes || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    // Return empty array instead of error to prevent frontend crash
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, display_name, icon, color, order_index } = body;
    
    // Check if category already exists
    const existing = db.prepare('SELECT id FROM record_categories WHERE id = ?').get(id);
    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    
    // Insert new category
    db.prepare(`
      INSERT INTO record_categories (id, name, display_name, icon, color, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, name, display_name, icon || 'Folder', color || '#6B7280', order_index || 999);
    
    return NextResponse.json({ 
      id, 
      name, 
      display_name, 
      icon: icon || 'Folder', 
      color: color || '#6B7280',
      order_index: order_index || 999
    });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}