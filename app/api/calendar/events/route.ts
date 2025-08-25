import { NextRequest, NextResponse } from 'next/server';
import { calendarQueries } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start') || new Date().toISOString();
    const endDate = searchParams.get('end') || new Date().toISOString();
    const employeeId = searchParams.get('employeeId') || undefined;
    
    const events = calendarQueries.getEventsForDateRange(startDate, endDate, employeeId);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar events' }, { status: 500 });
  }
}