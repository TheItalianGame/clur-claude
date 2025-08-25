import { NextRequest, NextResponse } from 'next/server';
import { dynamicRecordQueries } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string, id: string }> }
) {
  try {
    const { type, id } = await params;
    const record = dynamicRecordQueries.getRecord(type, id);
    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error fetching record:', error);
    return NextResponse.json({ error: 'Failed to fetch record' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string, id: string }> }
) {
  try {
    const { type, id } = await params;
    const data = await request.json();
    dynamicRecordQueries.updateRecord(type, id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating record:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ type: string, id: string }> }
) {
  try {
    const { type, id } = await params;
    dynamicRecordQueries.deleteRecord(type, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting record:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}