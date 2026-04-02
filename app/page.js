'use client';

import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981'];

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <p className="text-zinc-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
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
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Dashboard Setup</h1>
          <p className="text-zinc-400 mb-4">Datenbank muss zuerst eingerichtet werden.</p>
          <a href="/api/setup" className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg inline-block">
            Datenbank einrichten
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">TERMINIFY.AI Dashboard</h1>
          <p className="text-zinc-500 text-sm">VSL Tracking Analytics</p>
        </div>
        <div className="flex gap-2">
          {[1, 7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                days === d
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {d === 1 ? 'Heute' : `${d}T`}
            </button>
          ))}
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
        </div>
      ) : stats ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Seitenaufrufe" value={stats.total_views.toLocaleString('de-DE')} />
            <StatCard label="Besucher" value={stats.unique_visitors.toLocaleString('de-DE')} />
            <StatCard label="Ø Verweildauer" value={`${stats.avg_duration}s`} />
            <StatCard label="Ø Scroll-Tiefe" value={`${stats.avg_scroll_depth}%`} />
          </div>

          {/* Views Over Time Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Aufrufe & Besucher</h2>
            {stats.views_over_time.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.views_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 12 }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('de-DE')} />
                  <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} name="Aufrufe" dot={false} />
                  <Line type="monotone" dataKey="visitors" stroke="#06b6d4" strokeWidth={2} name="Besucher" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-zinc-500 text-center py-12">Noch keine Daten vorhanden</p>
            )}
          </div>

          {/* Bottom Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Top Pages */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Top Seiten</h2>
              {stats.top_pages.length > 0 ? (
                <div className="space-y-3">
                  {stats.top_pages.map((p, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-zinc-300 text-sm truncate mr-2">{p.page}</span>
                      <span className="text-zinc-500 text-sm font-mono">{p.views}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">Keine Daten</p>
              )}
            </div>

            {/* Top Referrers */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Top Referrer</h2>
              {stats.top_referrers.length > 0 ? (
                <div className="space-y-3">
                  {stats.top_referrers.map((r, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-zinc-300 text-sm truncate mr-2">{r.referrer}</span>
                      <span className="text-zinc-500 text-sm font-mono">{r.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-sm">Keine Daten</p>
              )}
            </div>

            {/* Devices */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Geräte</h2>
              {stats.devices.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stats.devices} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={70} label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}>
                      {stats.devices.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-zinc-500 text-sm">Keine Daten</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
