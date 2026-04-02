import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, session_id, visitor_id, page, url, referrer, screen_width, screen_height, user_agent, language, data } = body;

    if (!session_id || !visitor_id || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (type === 'pageview') {
      await sql`
        INSERT INTO page_views (session_id, visitor_id, page, url, referrer, screen_width, screen_height, user_agent, language)
        VALUES (${session_id}, ${visitor_id}, ${page}, ${url}, ${referrer}, ${screen_width}, ${screen_height}, ${user_agent}, ${language})
      `;
    } else {
      await sql`
        INSERT INTO events (session_id, visitor_id, event_type, page, event_data)
        VALUES (${session_id}, ${visitor_id}, ${type}, ${page}, ${JSON.stringify(data)})
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Track error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
