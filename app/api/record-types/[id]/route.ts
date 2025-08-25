import { NextRequest, NextResponse } from 'next/server';
import { recordTypeQueries } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recordType = recordTypeQueries.getById(id);
    if (!recordType) {
      return NextResponse.json({ error: 'Record type not found' }, { status: 404 });
    }
    return NextResponse.json(recordType);
  } catch (error) {
    console.error('Error fetching record type:', error);
    return NextResponse.json({ error: 'Failed to fetch record type' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    // Don't allow updating system record types' critical fields
    const recordType = recordTypeQueries.getById(id);
    if (!recordType) {
      return NextResponse.json({ error: 'Record type not found' }, { status: 404 });
    }
    
    if (recordType.is_system) {
      // Only allow updating display_name and color for system types
      const allowedUpdates: any = {};
      if (updates.display_name) allowedUpdates.display_name = updates.display_name;
      if (updates.color) allowedUpdates.color = updates.color;
      recordTypeQueries.update(id, allowedUpdates);
    } else {
      // Allow all updates for custom types
      recordTypeQueries.update(id, updates);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating record type:', error);
    return NextResponse.json({ error: 'Failed to update record type' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if it's a system record type
    const recordType = recordTypeQueries.getById(id);
    if (!recordType) {
      return NextResponse.json({ error: 'Record type not found' }, { status: 404 });
    }
    
    if (recordType.is_system) {
      return NextResponse.json({ error: 'Cannot delete system record types' }, { status: 403 });
    }
    
    recordTypeQueries.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting record type:', error);
    return NextResponse.json({ error: 'Failed to delete record type' }, { status: 500 });
  }
}