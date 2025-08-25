import { NextRequest, NextResponse } from 'next/server';
import { fieldDefinitionQueries, recordTypeQueries } from '@/lib/db/queries';
import { syncTableColumns } from '@/lib/db/schema-sync';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fields = fieldDefinitionQueries.getByRecordType(id);
    return NextResponse.json(fields);
  } catch (error) {
    console.error('Error fetching fields:', error);
    return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const field = await request.json();
    const fieldId = fieldDefinitionQueries.create({
      ...field,
      record_type_id: id
    });
    
    // Sync table schema after adding new field
    const recordType = recordTypeQueries.getById(id);
    if (recordType) {
      const fields = fieldDefinitionQueries.getByRecordType(id);
      syncTableColumns(recordType, fields);
    }
    
    return NextResponse.json({ success: true, id: fieldId });
  } catch (error) {
    console.error('Error creating field:', error);
    return NextResponse.json({ error: 'Failed to create field' }, { status: 500 });
  }
}