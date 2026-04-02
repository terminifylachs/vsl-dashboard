import { setupDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await setupDatabase();
    return NextResponse.json({ success: true, message: 'Database tables created' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
