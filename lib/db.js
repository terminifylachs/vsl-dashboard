import { sql } from '@vercel/postgres';

export async function setupDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS page_views (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      page TEXT NOT NULL,
      url TEXT,
      referrer TEXT,
      screen_width INT,
      screen_height INT,
      user_agent TEXT,
      language TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      page TEXT,
      event_data JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_pv_visitor ON page_views(visitor_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)`;
}

export { sql };
