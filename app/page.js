'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#7c3aed', '#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

function StatCard({ emoji, label, value, sub, trend }) {
  const trendColor = trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-zinc-500';
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '';
  return (
    <div className="glow-card stat-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{emoji}</span>
        <span className="text-zinc-400 text-sm font-medium">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {sub && <span className="text-zinc-500 text-xs">{sub}</span>}
        {trend !== undefined && trend !== null && (
          <span className={`text-xs font-medium ${trendColor}`}>{trendIcon} {Math.abs(trend)}%</span>
        )}
      </div>
    </div>
  );
}

function FunnelStep({ emoji, label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="text-lg w-8 text-center">{emoji}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-zinc-300">{label}</span>
          <span className="text-sm font-mono text-zinc-400">{value}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="funnel-bar h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
      <span className="text-xs text-zinc-500 w-12 text-right">{pct.toFixed(0)}%</span>
    </div>
  );
}

function SectionTitle({ emoji, title }) {
  return (
    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
      <span>{emoji}</span> {title}
    </h2>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats?days=${days}`);
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    setLoading(true);
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Trend calculation
  const trend = stats && stats.yesterday_views > 0
    ? Math.round(((stats.today_views - stats.yesterday_views) / stats.yesterday_views) * 100)
    : null;

  // Format duration
  const formatDuration = (s) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  // Hourly data
  const hourlyData = stats?.hourly_distribution
    ? HOUR_LABELS.map((label, i) => {
        const found = stats.hourly_distribution.find(h => parseInt(h.hour) === i);
        return { hour: label, views: parseInt(found?.count || 0) };
      })
    : [];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glow-card p-10">
          <div className="text-5xl mb-4">🗄️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Datenbank einrichten</h1>
          <p className="text-zinc-400 mb-6">Einmalig die Tabellen erstellen, dann geht's los.</p>
          <a href="/api/setup" className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/20">
            🚀 Datenbank einrichten
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/20">
            📊
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">TERMINIFY.AI</h1>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm">Analytics Dashboard</span>
              {stats && stats.live_visitors > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full live-pulse"></span>
                  {stats.live_visitors} live
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {[{ d: 1, l: '⚡ Heute' }, { d: 7, l: '📅 7 Tage' }, { d: 30, l: '📆 30 Tage' }, { d: 90, l: '📊 90 Tage' }].map(({ d, l }) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                days === d
                  ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
          <p className="text-zinc-500 text-sm">Daten werden geladen...</p>
        </div>
      ) : stats ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
            <StatCard emoji="👁️" label="Seitenaufrufe" value={stats.total_views.toLocaleString('de-DE')} sub={`Heute: ${stats.today_views}`} trend={trend} />
            <StatCard emoji="👤" label="Besucher" value={stats.unique_visitors.toLocaleString('de-DE')} />
            <StatCard emoji="🖱️" label="CTA Klicks" value={stats.cta_clicks.toLocaleString('de-DE')} sub="Buchungs-Button" />
            <StatCard emoji="📈" label="Conversion" value={`${stats.conversion_rate}%`} sub="Klick / Aufruf" />
            <StatCard emoji="⏱️" label="Ø Verweildauer" value={formatDuration(stats.avg_duration)} />
            <StatCard emoji="📜" label="Ø Scroll-Tiefe" value={`${stats.avg_scroll_depth}%`} />
          </div>

          {/* Main Charts Row */}
          <div className="grid lg:grid-cols-3 gap-4 mb-4">
            {/* Views Chart - spans 2 cols */}
            <div className="lg:col-span-2 glow-card p-5">
              <SectionTitle emoji="📈" title="Aufrufe & Besucher" />
              {stats.views_over_time.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={stats.views_over_time}>
                    <defs>
                      <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3e" />
                    <XAxis dataKey="date" stroke="#525280" tick={{ fontSize: 11 }}
                      tickFormatter={(d) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} />
                    <YAxis stroke="#525280" tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="views" stroke="#7c3aed" strokeWidth={2} fill="url(#gViews)" name="Aufrufe" />
                    <Area type="monotone" dataKey="visitors" stroke="#2563eb" strokeWidth={2} fill="url(#gVisitors)" name="Besucher" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                  <span className="text-4xl mb-2">📭</span>
                  <p>Noch keine Daten vorhanden</p>
                </div>
              )}
            </div>

            {/* Conversion Funnel */}
            <div className="glow-card p-5">
              <SectionTitle emoji="🔥" title="Conversion Funnel" />
              <div className="space-y-5 mt-2">
                <FunnelStep emoji="👁️" label="Seitenaufrufe" value={stats.total_views} total={stats.total_views} color="#7c3aed" />
                <FunnelStep emoji="📜" label="50% gescrollt" value={stats.scroll_milestones?.find(m => parseInt(m.milestone) === 50)?.count || 0} total={stats.total_views} color="#2563eb" />
                <FunnelStep emoji="📜" label="100% gescrollt" value={stats.scroll_milestones?.find(m => parseInt(m.milestone) === 100)?.count || 0} total={stats.total_views} color="#06b6d4" />
                <FunnelStep emoji="🖱️" label="CTA Klicks" value={stats.cta_clicks} total={stats.total_views} color="#10b981" />
              </div>
              <div className="mt-5 pt-4 border-t border-zinc-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Conversion Rate</span>
                  <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                    {stats.conversion_rate}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid lg:grid-cols-3 gap-4 mb-4">
            {/* Hourly Distribution */}
            <div className="glow-card p-5">
              <SectionTitle emoji="🕐" title="Besucher nach Uhrzeit" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3e" />
                  <XAxis dataKey="hour" stroke="#525280" tick={{ fontSize: 9 }} interval={2} />
                  <YAxis stroke="#525280" tick={{ fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="views" name="Aufrufe" radius={[3, 3, 0, 0]}>
                    {hourlyData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${260 - i * 4}, 70%, ${45 + (hourlyData[i]?.views || 0) * 2}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Devices */}
            <div className="glow-card p-5">
              <SectionTitle emoji="📱" title="Geräte" />
              {stats.devices.length > 0 ? (
                <div className="flex items-center">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={stats.devices} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={70} innerRadius={40} strokeWidth={0}>
                        {stats.devices.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {stats.devices.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-sm text-zinc-300">{d.device === 'Mobile' ? '📱' : d.device === 'Tablet' ? '📟' : '🖥️'} {d.device}</span>
                        <span className="text-xs text-zinc-500 font-mono">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-zinc-600 text-sm text-center py-8">Keine Daten</p>
              )}
            </div>

            {/* Video Plays */}
            <div className="glow-card p-5">
              <SectionTitle emoji="🎬" title="Video Plays" />
              {stats.video_plays?.length > 0 ? (
                <div className="space-y-3">
                  {stats.video_plays.map((v, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-zinc-300 text-sm truncate mr-2">🎥 {v.video || 'unknown'}</span>
                      <span className="text-zinc-400 text-sm font-mono bg-zinc-800 px-2 py-0.5 rounded">{v.count}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                  <span className="text-3xl mb-2">🎬</span>
                  <p className="text-sm">Noch keine Video-Plays</p>
                </div>
              )}
            </div>
          </div>

          {/* Third Row */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Top Referrers */}
            <div className="glow-card p-5">
              <SectionTitle emoji="🔗" title="Top Referrer" />
              {stats.top_referrers.length > 0 ? (
                <div className="space-y-2.5">
                  {stats.top_referrers.map((r, i) => {
                    const pct = stats.total_views > 0 ? (parseInt(r.count) / stats.total_views) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <span className="text-zinc-300 text-sm truncate mr-2">{r.referrer}</span>
                          <span className="text-zinc-500 text-xs font-mono">{r.count}</span>
                        </div>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-600 to-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-600 text-sm text-center py-8">Keine Referrer-Daten</p>
              )}
            </div>

            {/* UTM Sources */}
            <div className="glow-card p-5">
              <SectionTitle emoji="🎯" title="UTM Kampagnen" />
              {stats.utm_sources?.length > 0 ? (
                <div className="space-y-3">
                  {stats.utm_sources.map((u, i) => (
                    <div key={i} className="flex justify-between items-center bg-zinc-800/50 rounded-lg p-2.5">
                      <div>
                        <span className="text-zinc-200 text-sm font-medium">{u.source || '–'}</span>
                        <span className="text-zinc-500 text-xs ml-2">/ {u.medium || '–'}</span>
                      </div>
                      <span className="text-zinc-400 text-sm font-mono">{u.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                  <span className="text-3xl mb-2">🎯</span>
                  <p className="text-sm">Keine UTM-Daten</p>
                  <p className="text-xs text-zinc-700 mt-1">?utm_source=... nutzen</p>
                </div>
              )}
            </div>

            {/* Button Clicks */}
            <div className="glow-card p-5">
              <SectionTitle emoji="🖱️" title="Button Klicks" />
              {stats.button_clicks?.length > 0 ? (
                <div className="space-y-3">
                  {stats.button_clicks.map((b, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-zinc-300 text-sm truncate mr-2">{b.text || 'unknown'}</span>
                      <span className="text-zinc-400 text-sm font-mono bg-zinc-800 px-2 py-0.5 rounded">{b.count}x</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-zinc-600">
                  <span className="text-3xl mb-2">🖱️</span>
                  <p className="text-sm">Noch keine Button-Klicks</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-zinc-700 text-xs">
            🔄 Auto-Refresh alle 30 Sekunden · Daten der letzten {days} Tage
          </div>
        </>
      ) : null}
    </div>
  );
}
