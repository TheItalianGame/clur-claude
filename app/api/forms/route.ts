import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { nanoid } from 'nanoid';

// Run migration on first load
let migrationRun = false;

export async function GET(request: Request) {
  try {
    // Run migration once
    if (!migrationRun) {
      try {
        await import('@/lib/db/migrate-forms');
        migrationRun = true;
      } catch (e) {
        console.error('Migration error:', e);
      }
    }
    const { searchParams } = new URL(request.url);
    const recordTypeId = searchParams.get('record_type_id');
    
    let forms;
    if (recordTypeId) {
      forms = db.prepare(`
        SELECT * FROM form_definitions 
        WHERE record_type_id = ? 
        ORDER BY is_default DESC, created_at DESC
      `).all(recordTypeId);
    } else {
      forms = db.prepare(`
        SELECT fd.*, rt.display_name as record_type_name 
        FROM form_definitions fd
        JOIN record_types rt ON fd.record_type_id = rt.id
        ORDER BY fd.created_at DESC
      `).all();
    }
    
    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = nanoid();
    
    // If this form is being set as default, unset other defaults for this record type
    if (data.is_default) {
      db.prepare(`
        UPDATE form_definitions 
        SET is_default = 0 
        WHERE record_type_id = ?
      `).run(data.record_type_id);
    }
    
    const form = db.prepare(`
      INSERT INTO form_definitions (id, record_type_id, name, is_default, layout)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      data.record_type_id,
      data.name,
      data.is_default ? 1 : 0,
      data.layout
    );
    
    const newForm = db.prepare('SELECT * FROM form_definitions WHERE id = ?').get(id);
    
    return NextResponse.json(newForm);
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}