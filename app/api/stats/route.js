import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalViews, uniqueVisitors, topPages, topReferrers, viewsOverTime,
      devices, avgDuration, scrollDepth, ctaClicks, videoPlays,
      buttonClicks, utmSources, hourlyDistribution, todayViews, yesterdayViews,
      scrollMilestones, liveVisitors
    ] = await Promise.all([
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

      // Device breakdown
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

      // CTA / booking clicks
      sql`SELECT COUNT(*) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'cta_click' AND created_at >= ${since}`,

      // Video plays
      sql`SELECT event_data->'data'->>'video' as video, COUNT(*) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'video_play' AND created_at >= ${since} GROUP BY video ORDER BY count DESC LIMIT 10`,

      // Button clicks (non-CTA)
      sql`SELECT event_data->'data'->>'text' as text, COUNT(*) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'button_click' AND created_at >= ${since} GROUP BY text ORDER BY count DESC LIMIT 10`,

      // UTM sources
      sql`SELECT event_data->'data'->>'utm_source' as source, event_data->'data'->>'utm_medium' as medium, COUNT(*) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'utm' AND created_at >= ${since} GROUP BY source, medium ORDER BY count DESC LIMIT 10`,

      // Hourly distribution (for heatmap) - German timezone
      sql`SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'Europe/Berlin')::int as hour, COUNT(*) as count FROM page_views WHERE created_at >= ${since} GROUP BY hour ORDER BY hour`,

      // Today's views (for comparison)
      sql`SELECT COUNT(*) as count FROM page_views WHERE created_at >= DATE_TRUNC('day', NOW())`,

      // Yesterday's views (for comparison)
      sql`SELECT COUNT(*) as count FROM page_views WHERE created_at >= DATE_TRUNC('day', NOW() - INTERVAL '1 day') AND created_at < DATE_TRUNC('day', NOW())`,

      // Scroll milestones
      sql`SELECT (event_data->'data'->>'percent')::int as milestone, COUNT(DISTINCT session_id) as count FROM events WHERE event_type = 'event' AND event_data->>'name' = 'scroll_milestone' AND created_at >= ${since} GROUP BY milestone ORDER BY milestone`,

      // Live visitors (last 5 minutes)
      sql`SELECT COUNT(DISTINCT visitor_id) as count FROM page_views WHERE created_at >= NOW() - INTERVAL '5 minutes'`,
    ]);

    // Calculate conversion rate
    const views = parseInt(totalViews.rows[0]?.count || 0);
    const clicks = parseInt(ctaClicks.rows[0]?.count || 0);
    const conversionRate = views > 0 ? ((clicks / views) * 100).toFixed(1) : 0;

    return NextResponse.json({
      total_views: views,
      unique_visitors: parseInt(uniqueVisitors.rows[0]?.count || 0),
      top_pages: topPages.rows,
      top_referrers: topReferrers.rows,
      views_over_time: viewsOverTime.rows,
      devices: devices.rows,
      avg_duration: Math.round(avgDuration.rows[0]?.avg_seconds || 0),
      avg_scroll_depth: Math.round(scrollDepth.rows[0]?.avg_depth || 0),
      cta_clicks: clicks,
      conversion_rate: parseFloat(conversionRate),
      video_plays: videoPlays.rows,
      button_clicks: buttonClicks.rows,
      utm_sources: utmSources.rows,
      hourly_distribution: hourlyDistribution.rows,
      today_views: parseInt(todayViews.rows[0]?.count || 0),
      yesterday_views: parseInt(yesterdayViews.rows[0]?.count || 0),
      scroll_milestones: scrollMilestones.rows,
      live_visitors: parseInt(liveVisitors.rows[0]?.count || 0),
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
