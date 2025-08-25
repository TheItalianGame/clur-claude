import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';
import { syncAllRecordTypes } from '@/lib/db/schema-sync';

let fieldsSeeded = false;
let schemaSynced = false;

export async function GET() {
  try {
    initializeDatabase();
    
    // Seed new record type fields once
    if (!fieldsSeeded) {
      try {
        await import('@/lib/db/seed-new-record-types');
        await import('@/lib/db/migrate-forms');
        fieldsSeeded = true;
      } catch (e) {
        console.error('Seeding error:', e);
      }
    }
    
    // Sync database schema once
    if (!schemaSynced) {
      try {
        syncAllRecordTypes();
        schemaSynced = true;
        console.log('Database schema synchronized successfully');
      } catch (e) {
        console.error('Schema sync error:', e);
      }
    }
    
    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json({ success: false, error: 'Failed to initialize database' }, { status: 500 });
  }
}