import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const form = db.prepare(`
      SELECT fd.*, rt.display_name as record_type_name 
      FROM form_definitions fd
      JOIN record_types rt ON fd.record_type_id = rt.id
      WHERE fd.id = ?
    `).get(params.id);
    
    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }
    
    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'Failed to fetch form' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // If this form is being set as default, unset other defaults for this record type
    if (data.is_default) {
      const currentForm = db.prepare('SELECT record_type_id FROM form_definitions WHERE id = ?').get(params.id) as any;
      if (currentForm) {
        db.prepare(`
          UPDATE form_definitions 
          SET is_default = 0 
          WHERE record_type_id = ? AND id != ?
        `).run(currentForm.record_type_id, params.id);
      }
    }
    
    db.prepare(`
      UPDATE form_definitions 
      SET name = ?, is_default = ?, layout = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.name,
      data.is_default ? 1 : 0,
      data.layout,
      params.id
    );
    
    const updatedForm = db.prepare('SELECT * FROM form_definitions WHERE id = ?').get(params.id);
    
    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if this is the default form
    const form = db.prepare('SELECT is_default, record_type_id FROM form_definitions WHERE id = ?').get(params.id) as any;
    
    if (form?.is_default) {
      return NextResponse.json({ error: 'Cannot delete default form' }, { status: 400 });
    }
    
    db.prepare('DELETE FROM form_definitions WHERE id = ?').run(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
  }
}