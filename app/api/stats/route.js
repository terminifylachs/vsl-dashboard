import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [totalViews, uniqueVisitors, topPages, topReferrers, viewsOverTime, devices, avgDuration, scrollDepth] = await Promise.all([
      // Total page views
      sql`SELECT COUNT(*) as count FROM page_views WHERE created_at >= ${since}`,

      // Unique visitors
      sql`SELECT COUNT(DISTINCT visitor_id) as count FROM page_views WHERE created_at >= ${since}`,

      // Top pages
      sql`SELECT page, COUNT(*) as views FROM page_views WHERE created_at >= ${since} GROUP BY page ORDER BY views DESC LIMIT 10`,

      // Top referrers
      sql`SELECT referrer, COUNT(*) as count FROM page_views WHERE created_at >= ${since} AND referrer IS NOT NULL AND referrer != '' GROUP BY referrer ORDER BY count DESC LIMIT 10`,

      // Views over time (by day)
      sql`SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT visitor_id) as visitors FROM page_views WHERE created_at >= ${since} GROUP BY DATE(created_at) ORDER BY date`,

      // Device breakdown (by screen width)
      sql`SELECT
        CASE
          WHEN screen_width < 768 THEN 'Mobile'
          WHEN screen_width < 1024 THEN 'Tablet'
          ELSE 'Desktop'
        END as device,
        COUNT(*) as count
        FROM page_views WHERE created_at >= ${since} GROUP BY device ORDER BY count DESC`,

      // Average duration
      sql`SELECT AVG((event_data->>'seconds')::int) as avg_seconds FROM events WHERE event_type = 'duration' AND created_at >= ${since}`,

      // Average scroll depth
      sql`SELECT AVG((event_data->>'depth')::int) as avg_depth FROM events WHERE event_type = 'scroll' AND created_at >= ${since}`,
    ]);

    return NextResponse.json({
      total_views: parseInt(totalViews.rows[0]?.count || 0),
      unique_visitors: parseInt(uniqueVisitors.rows[0]?.count || 0),
      top_pages: topPages.rows,
      top_referrers: topReferrers.rows,
      views_over_time: viewsOverTime.rows,
      devices: devices.rows,
      avg_duration: Math.round(avgDuration.rows[0]?.avg_seconds || 0),
      avg_scroll_depth: Math.round(scrollDepth.rows[0]?.avg_depth || 0),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
