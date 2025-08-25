import { NextRequest, NextResponse } from 'next/server';
import { recordTypeQueries, fieldDefinitionQueries, formDefinitionQueries, calendarQueries } from '@/lib/db/queries';
import { generateDefaultFormLayout } from '@/lib/form-templates';
import { syncTableColumns } from '@/lib/db/schema-sync';

export async function GET() {
  try {
    // First ensure schema updates are applied
    await import('@/lib/db/apply-updates');
    
    const recordTypes = recordTypeQueries.getAll();
    return NextResponse.json(recordTypes);
  } catch (error) {
    console.error('Error fetching record types:', error);
    return NextResponse.json({ error: 'Failed to fetch record types' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordType, fields, formLayout, calendarSettings } = body;
    
    // Ensure category_id is set (default to 'cat-custom' if not provided)
    const recordTypeWithCategory = {
      ...recordType,
      category_id: recordType.category_id || 'cat-custom'
    };
    
    // Create record type
    const recordTypeId = recordTypeQueries.create(recordTypeWithCategory);
    
    // Create field definitions
    const createdFields: any[] = [];
    fields.forEach((field: any, index: number) => {
      const fieldId = `field-${recordTypeId}-${index}`;
      fieldDefinitionQueries.create({
        ...field,
        id: fieldId,
        record_type_id: recordTypeId,
        order_index: index
      });
      createdFields.push({ ...field, id: fieldId, order_index: index });
    });
    
    // Generate default form layout based on fields
    const defaultLayout = formLayout || generateDefaultFormLayout(createdFields);
    
    // Create default form
    formDefinitionQueries.create({
      id: `form-${recordTypeId}`,
      record_type_id: recordTypeId,
      name: 'Default Form',
      is_default: true,
      layout: JSON.stringify(defaultLayout)
    });
    
    // Sync database schema for the new record type
    const newRecordType = recordTypeQueries.getById(recordTypeId);
    if (newRecordType) {
      syncTableColumns(newRecordType, createdFields);
      console.log(`Created table for new record type: ${recordType.display_name}`);
    }
    
    // Create calendar settings
    if (calendarSettings) {
      calendarQueries.createSettings({
        id: `cal-${recordTypeId}`,
        record_type_id: recordTypeId,
        date_field: calendarSettings.date_field,
        title_field: calendarSettings.title_field,
        show_on_calendar: calendarSettings.show_on_calendar !== false
      });
    }
    
    return NextResponse.json({ success: true, id: recordTypeId });
  } catch (error) {
    console.error('Error creating record type:', error);
    return NextResponse.json({ error: 'Failed to create record type' }, { status: 500 });
  }
}