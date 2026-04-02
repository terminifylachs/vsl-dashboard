import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalViews, uniqueVisitors, viewsOverTime,
      devices, avgDuration, scrollDepth, ctaClicks, videoPlays,
      buttonClicks, hourlyDistribution, todayViews, yesterdayViews,
      scrollMilestones, liveVisitors,
      vslWatchtime, vslPlays, vslCompletes, vslPauses, lastEvent
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM page_views WHERE created_at >= ${since}`,
      sql`SELECT COUNT(DISTINCT visitor_id) as count FROM page_views WHERE created_at >= ${since}`,
      sql`SELECT DATE(created_at) as date, COUNT(*) as views, COUNT(DISTINCT visitor_id) as visitors FROM page_views WHERE created_at >= ${since} GROUP BY DATE(created_at) ORDER BY date`,
      sql`SELECT
        CASE
          WHEN screen_width < 768 THEN 'Mobile'
          WHEN screen_width < 1024 THEN 'Tablet'
          ELSE 'Desktop'
        END as device,
        COUNT(*) as count
        FROM page_views WHERE created_at >= ${since} GROUP BY device ORDER BY count DESC`,
      sql`SELECT AVG((event_data->>'seconds')::int) as avg_seconds FROM events WHERE event_type = 'duration' AND created_at >= ${since}`,
      sql`SELECT AVG((event_data->>'depth')::int) as avg_depth FROM events WHERE event_type = 'scroll' AND created_at >= ${since}`,
      sql`SELECT COUNT(*) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'cta_click' AND created_at >= ${since}`,
      sql`SELECT event_data->'data'->>'video' as video, event_data->'data'->>'video_id' as video_id, COUNT(*) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'video_play' AND created_at >= ${since} GROUP BY video, video_id ORDER BY count DESC LIMIT 10`,
      sql`SELECT event_data->'data'->>'text' as text, COUNT(*) as count FROM events WHERE event_type = 'event' AND (event_data->>'name' = 'button_click' OR event_data->>'name' = 'cta_click') AND created_at >= ${since} GROUP BY text ORDER BY count DESC LIMIT 10`,
      sql`SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Europe/Berlin')::int as hour, COUNT(*) as count FROM page_views WHERE created_at >= ${since} GROUP BY hour ORDER BY hour`,
      sql`SELECT COUNT(*) as count FROM page_views WHERE created_at >= DATE_TRUNC('day', NOW())`,
      sql`SELECT COUNT(*) as count FROM page_views WHERE created_at >= DATE_TRUNC('day', NOW() - INTERVAL '1 day') AND created_at < DATE_TRUNC('day', NOW())`,
      sql`SELECT (event_data->'data'->>'percent')::int as milestone, COUNT(DISTINCT session_id) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'scroll_milestone' AND created_at >= ${since} GROUP BY milestone ORDER BY milestone`,
      sql`SELECT COUNT(DISTINCT visitor_id) as count FROM page_views WHERE created_at >= NOW() - INTERVAL '5 minutes'`,
      sql`SELECT (event_data->'data'->>'percent')::int as percent, COUNT(DISTINCT session_id) as viewers FROM events WHERE event_type = 'event' AND event_data->>'name' = 'vsl_watchtime' AND created_at >= ${since} GROUP BY percent ORDER BY percent`,
      sql`SELECT COUNT(*) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'vsl_play' AND created_at >= ${since}`,
      sql`SELECT COUNT(*) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'vsl_complete' AND created_at >= ${since}`,
      sql`SELECT (event_data->'data'->>'percent')::int as percent, COUNT(*) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'vsl_pause' AND created_at >= ${since} GROUP BY percent ORDER BY count DESC LIMIT 10`,
      // Last activity timestamp
      sql`(SELECT created_at FROM page_views ORDER BY created_at DESC LIMIT 1) UNION ALL (SELECT created_at FROM events ORDER BY created_at DESC LIMIT 1) ORDER BY created_at DESC LIMIT 1`,
    ]);

    const views = parseInt(totalViews.rows[0]?.count || 0);
    const clicks = parseInt(ctaClicks.rows[0]?.count || 0);
    const conversionRate = views > 0 ? ((clicks / views) * 100).toFixed(1) : 0;
    const plays = parseInt(vslPlays.rows[0]?.count || 0);
    const completes = parseInt(vslCompletes.rows[0]?.count || 0);
    const vslCompletionRate = plays > 0 ? ((completes / plays) * 100).toFixed(1) : 0;

    return NextResponse.json({
      total_views: views,
      unique_visitors: parseInt(uniqueVisitors.rows[0]?.count || 0),
      views_over_time: viewsOverTime.rows,
      devices: devices.rows,
      avg_duration: Math.round(avgDuration.rows[0]?.avg_seconds || 0),
      avg_scroll_depth: Math.round(scrollDepth.rows[0]?.avg_depth || 0),
      cta_clicks: clicks,
      conversion_rate: parseFloat(conversionRate),
      video_plays: videoPlays.rows,
      button_clicks: buttonClicks.rows,
      hourly_distribution: hourlyDistribution.rows,
      today_views: parseInt(todayViews.rows[0]?.count || 0),
      yesterday_views: parseInt(yesterdayViews.rows[0]?.count || 0),
      scroll_milestones: scrollMilestones.rows,
      live_visitors: parseInt(liveVisitors.rows[0]?.count || 0),
      vsl_watchtime: vslWatchtime.rows,
      vsl_plays: plays,
      vsl_completes: completes,
      vsl_completion_rate: parseFloat(vslCompletionRate),
      vsl_pause_points: vslPauses.rows,
      last_activity: lastEvent.rows[0]?.created_at || null,
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
