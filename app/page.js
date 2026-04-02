'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

function StatCard({ emoji, label, value, sub, trend }) {
  const trendColor = trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-zinc-500';
  const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '';
  return (
    <div className="glow-card stat-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{emoji}</span>
        <span className="text-zinc-400 text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-0.5">
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
    <div className="flex items-center gap-3">
      <span className="text-base w-6 text-center">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-0.5">
          <span className="text-xs text-zinc-300">{label}</span>
          <span className="text-xs font-mono text-zinc-500">{value} · {pct.toFixed(0)}%</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div className="funnel-bar h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ emoji, title, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
        <span>{emoji}</span> {title}
      </h2>
      {right && <span className="text-xs text-zinc-500">{right}</span>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-medium" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return '–';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours}h`;
  const days = Math.floor(hours / 24);
  return `vor ${days}d`;
}

function formatTime(dateStr) {
  if (!dateStr) return '–';
  return new Date(dateStr).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/Berlin'
  });
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/stats?days=${days}`);
      if (!res.ok) throw new Error('Failed to load stats');
      const data = await res.json();
      setStats(data);
      setLastFetch(new Date().toISOString());
      setError(null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => {
    setLoading(true);
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const trend = stats?.yesterday_views > 0
    ? Math.round(((stats.today_views - stats.yesterday_views) / stats.yesterday_views) * 100)
    : null;

  const formatDuration = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  const hourlyData = stats?.hourly_distribution
    ? HOUR_LABELS.map((label, i) => {
        const found = stats.hourly_distribution.find(h => parseInt(h.hour) === i);
        return { hour: label, views: parseInt(found?.count || 0) };
      })
    : [];

  const maxHourly = Math.max(...hourlyData.map(h => h.views), 1);

  // Build VSL retention curve
  const watchtimeData = stats?.vsl_watchtime
    ? [{ percent: 0, viewers: stats.vsl_plays || 0, retention: 100 },
      ...([10,20,30,40,50,60,70,80,90,100].map(p => {
        const found = stats.vsl_watchtime.find(w => parseInt(w.percent) === p);
        const viewers = parseInt(found?.viewers || 0);
        const retention = stats.vsl_plays > 0 ? Math.round((viewers / stats.vsl_plays) * 100) : 0;
        return { percent: p, viewers, retention };
      }))]
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
    <div className="min-h-screen p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-lg shadow-lg shadow-violet-500/20">📊</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">TERMINIFY.AI</h1>
              {stats?.live_visitors > 0 && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full live-pulse"></span>
                  {stats.live_visitors} live
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-xs">Analytics Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Last update info */}
          {stats && (
            <div className="text-right hidden md:block">
              <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
                Aktualisiert: {formatTime(lastFetch)}
              </div>
              {stats.last_activity && (
                <div className="text-[10px] text-zinc-600">
                  Letzte Aktivität: {formatTimeAgo(stats.last_activity)}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-1 bg-zinc-900/80 border border-zinc-800 rounded-lg p-0.5">
            {[{ d: 1, l: '⚡ Heute' }, { d: 7, l: '📅 7T' }, { d: 30, l: '📆 30T' }, { d: 90, l: '📊 90T' }].map(({ d, l }) => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  days === d ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-500/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin"></div>
          <p className="text-zinc-500 text-xs">Laden...</p>
        </div>
      ) : stats ? (
        <>
          {/* Mobile: last update */}
          {stats && (
            <div className="md:hidden mb-4 flex items-center gap-2 text-[10px] text-zinc-500">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full"></span>
              Aktualisiert: {formatTime(lastFetch)}
              {stats.last_activity && <span>· Letzte Aktivität: {formatTimeAgo(stats.last_activity)}</span>}
            </div>
          )}

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
            <StatCard emoji="👁️" label="Aufrufe" value={stats.total_views.toLocaleString('de-DE')} sub={`Heute: ${stats.today_views}`} trend={trend} />
            <StatCard emoji="👤" label="Besucher" value={stats.unique_visitors.toLocaleString('de-DE')} />
            <StatCard emoji="🖱️" label="CTA Klicks" value={stats.cta_clicks.toLocaleString('de-DE')} sub="Buchungs-Button" />
            <StatCard emoji="📈" label="Conversion" value={`${stats.conversion_rate}%`} sub="Klick / Aufruf" />
            <StatCard emoji="⏱️" label="Verweildauer" value={formatDuration(stats.avg_duration)} />
            <StatCard emoji="📜" label="Scroll-Tiefe" value={`${stats.avg_scroll_depth}%`} />
          </div>

          {/* Row 1: Traffic Chart + VSL Watchtime */}
          <div className="grid lg:grid-cols-5 gap-3 mb-3">
            <div className="lg:col-span-3 glow-card p-4">
              <SectionTitle emoji="📈" title="Aufrufe & Besucher" />
              {stats.views_over_time.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={stats.views_over_time}>
                    <defs>
                      <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3}/><stop offset="100%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity={0.3}/><stop offset="100%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3e" />
                    <XAxis dataKey="date" stroke="#525280" tick={{ fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} />
                    <YAxis stroke="#525280" tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="views" stroke="#7c3aed" strokeWidth={2} fill="url(#gV)" name="Aufrufe" />
                    <Area type="monotone" dataKey="visitors" stroke="#2563eb" strokeWidth={2} fill="url(#gU)" name="Besucher" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-52 text-zinc-600">
                  <span className="text-3xl mb-2">📭</span><p className="text-sm">Noch keine Daten</p>
                </div>
              )}
            </div>

            {/* VSL Watchtime Retention */}
            <div className="lg:col-span-2 glow-card p-4">
              <SectionTitle emoji="🎥" title="VSL Watchtime" right={stats.vsl_plays > 0 ? `${stats.vsl_plays} Plays · ${stats.vsl_completion_rate}% komplett` : ''} />
              {watchtimeData.length > 1 && stats.vsl_plays > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <AreaChart data={watchtimeData}>
                      <defs>
                        <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4}/><stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3e" />
                      <XAxis dataKey="percent" stroke="#525280" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} />
                      <YAxis stroke="#525280" tick={{ fontSize: 10 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                      <Tooltip content={({ active, payload }) => active && payload?.length ? (
                        <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 shadow-xl text-xs">
                          <p className="text-zinc-400">Video bei {payload[0].payload.percent}%</p>
                          <p className="text-amber-400 font-medium">{payload[0].payload.retention}% schauen noch</p>
                          <p className="text-zinc-500">{payload[0].payload.viewers} Zuschauer</p>
                        </div>
                      ) : null} />
                      <Area type="monotone" dataKey="retention" stroke="#f59e0b" strokeWidth={2} fill="url(#gW)" name="Retention" />
                    </AreaChart>
                  </ResponsiveContainer>
                  {stats.vsl_pause_points?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-800">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">⏸️ Häufigste Abbruchstellen</p>
                      <div className="flex flex-wrap gap-1">
                        {stats.vsl_pause_points.slice(0, 5).map((p, i) => (
                          <span key={i} className="text-[11px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">{p.percent}% ({p.count}x)</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-52 text-zinc-600">
                  <span className="text-3xl mb-2">🎥</span>
                  <p className="text-sm">Noch keine Video-Daten</p>
                  <p className="text-xs text-zinc-700 mt-1">Daten kommen sobald jemand das VSL schaut</p>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Funnel + Hourly Heatmap */}
          <div className="grid lg:grid-cols-5 gap-3 mb-3">
            {/* Conversion Funnel */}
            <div className="lg:col-span-2 glow-card p-4">
              <SectionTitle emoji="🔥" title="Conversion Funnel" />
              <div className="space-y-3">
                <FunnelStep emoji="👁️" label="Seitenaufrufe" value={stats.total_views} total={stats.total_views} color="#7c3aed" />
                <FunnelStep emoji="▶️" label="VSL gestartet" value={stats.vsl_plays} total={stats.total_views} color="#8b5cf6" />
                <FunnelStep emoji="📜" label="50% gescrollt" value={parseInt(stats.scroll_milestones?.find(m => parseInt(m.milestone) === 50)?.count || 0)} total={stats.total_views} color="#2563eb" />
                <FunnelStep emoji="🎥" label="VSL 50%+ geschaut" value={parseInt(stats.vsl_watchtime?.find(w => parseInt(w.percent) === 50)?.viewers || 0)} total={stats.total_views} color="#06b6d4" />
                <FunnelStep emoji="✅" label="VSL komplett" value={stats.vsl_completes} total={stats.total_views} color="#10b981" />
                <FunnelStep emoji="🖱️" label="CTA geklickt" value={stats.cta_clicks} total={stats.total_views} color="#f59e0b" />
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center">
                <span className="text-xs text-zinc-400">Gesamt-Conversion</span>
                <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">{stats.conversion_rate}%</span>
              </div>
            </div>

            {/* Right column: Hourly + Devices */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              {/* Hourly Heatmap */}
              <div className="glow-card p-4 flex-1">
                <SectionTitle emoji="🕐" title="Besucher nach Uhrzeit" right="Hover für Details" />
                <div className="flex items-end gap-[2px] h-[100px]">
                  {hourlyData.map((h, i) => {
                    const pct = maxHourly > 0 ? (h.views / maxHourly) * 100 : 0;
                    const isActive = h.views > 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative cursor-default">
                        <div className="w-full rounded-t-sm transition-all" style={{
                          height: `${Math.max(pct, 4)}%`,
                          background: isActive ? `linear-gradient(to top, #7c3aed, #2563eb)` : '#1a1a3e',
                          opacity: isActive ? 0.5 + (pct / 200) : 0.3
                        }} />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 border border-zinc-700 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 shadow-lg">
                          🕐 {h.hour} → <strong>{h.views}</strong> Besucher
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1.5 px-0.5">
                  {[0, 3, 6, 9, 12, 15, 18, 21].map(h => (
                    <span key={h} className="text-[9px] text-zinc-600">{h}h</span>
                  ))}
                </div>
              </div>

              {/* Devices + Testimonials side by side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Devices */}
                <div className="glow-card p-4">
                  <SectionTitle emoji="📱" title="Geräte" />
                  {stats.devices.length > 0 ? (
                    <div className="space-y-2.5">
                      {stats.devices.map((d, i) => {
                        const total = stats.devices.reduce((s, x) => s + parseInt(x.count), 0);
                        const pct = total > 0 ? ((parseInt(d.count) / total) * 100).toFixed(0) : 0;
                        const icon = d.device === 'Mobile' ? '📱' : d.device === 'Tablet' ? '📟' : '🖥️';
                        const colors = ['#7c3aed', '#2563eb', '#06b6d4'];
                        return (
                          <div key={i}>
                            <div className="flex justify-between mb-0.5">
                              <span className="text-xs text-zinc-300">{icon} {d.device}</span>
                              <span className="text-xs text-zinc-500">{pct}% · {d.count}</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[i] || '#7c3aed' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-zinc-600 text-xs">Keine Daten</p>}
                </div>

                {/* Testimonial Videos */}
                <div className="glow-card p-4">
                  <SectionTitle emoji="🎬" title="Testimonials" right={stats.video_plays?.length > 0 ? `${stats.video_plays.reduce((s, v) => s + parseInt(v.count), 0)} Plays` : ''} />
                  {stats.video_plays?.length > 0 ? (
                    <div className="space-y-2.5">
                      {stats.video_plays.map((v, i) => {
                        const totalPlays = stats.video_plays.reduce((s, x) => s + parseInt(x.count), 0);
                        const pct = totalPlays > 0 ? (parseInt(v.count) / totalPlays) * 100 : 0;
                        return (
                          <div key={i}>
                            <div className="flex justify-between mb-0.5">
                              <span className="text-xs text-zinc-300 truncate mr-1">🎥 {v.video || v.video_id || 'Video'}</span>
                              <span className="text-xs text-zinc-500 shrink-0">{v.count}x</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-zinc-600 text-xs text-center py-3">Noch keine Plays</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Button Klicks (full width) */}
          <div className="glow-card p-4">
            <SectionTitle emoji="🖱️" title="Alle Klicks" right={stats.button_clicks?.length > 0 ? `${stats.button_clicks.reduce((s, b) => s + parseInt(b.count), 0)} total` : ''} />
            {stats.button_clicks?.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                {stats.button_clicks.map((b, i) => {
                  const label = (b.text || '').replace(/\s+/g, ' ').substring(0, 50);
                  const totalClicks = stats.button_clicks.reduce((s, x) => s + parseInt(x.count), 0);
                  const pct = totalClicks > 0 ? (parseInt(b.count) / totalClicks) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-xs text-zinc-300 truncate mr-2">{label || '–'}</span>
                        <span className="text-xs text-zinc-500 shrink-0">{b.count}x</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-zinc-600 text-xs text-center py-2">Noch keine Klicks</p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-center gap-3 text-[10px] text-zinc-700">
            <span>🔄 Auto-Refresh alle 30s</span>
            <span>·</span>
            <span>Letzte {days} Tage</span>
            {stats.last_activity && (
              <>
                <span>·</span>
                <span>Letzter Besucher: {formatTimeAgo(stats.last_activity)}</span>
              </>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
