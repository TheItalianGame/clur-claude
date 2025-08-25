import { NextRequest, NextResponse } from 'next/server';
import { fieldDefinitionQueries } from '@/lib/db/queries';
import { syncTableColumns } from '@/lib/db/schema-sync';
import { recordTypeQueries } from '@/lib/db/queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, fieldId: string }> }
) {
  try {
    const { id, fieldId } = await params;
    const updates = await request.json();
    
    fieldDefinitionQueries.update(fieldId, updates);
    
    // Sync table schema after field update
    const recordType = recordTypeQueries.getById(id);
    if (recordType) {
      const fields = fieldDefinitionQueries.getByRecordType(id);
      syncTableColumns(recordType, fields);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating field:', error);
    return NextResponse.json({ error: 'Failed to update field' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, fieldId: string }> }
) {
  try {
    const { id, fieldId } = await params;
    
    // Check if it's a system field
    const field = fieldDefinitionQueries.getById(fieldId);
    if (field && field.is_system) {
      return NextResponse.json({ error: 'Cannot delete system fields' }, { status: 403 });
    }
    
    fieldDefinitionQueries.delete(fieldId);
    
    // Note: Column deletion in SQLite requires table recreation
    // For now, we just remove the field definition
    // The column will remain in the table but unused
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting field:', error);
    return NextResponse.json({ error: 'Failed to delete field' }, { status: 500 });
  }
}