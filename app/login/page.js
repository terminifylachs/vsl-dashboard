'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const router = useRouter();

  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  // Floating particles
  useEffect(() => {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 58, 237, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${0.08 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        });
      });

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  async function handleSubmit(allDigits) {
    const code = allDigits.join('');
    if (code.length !== 4) return;

    setLoading(true);
    setError(false);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: code }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 1200);
      } else {
        setError(true);
        setDigits(['', '', '', '']);
        setTimeout(() => {
          setError(false);
          inputRefs[0].current?.focus();
          setFocusedIndex(0);
        }, 600);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(index, value) {
    if (!/^\d?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
      setFocusedIndex(index + 1);
    }

    // Auto-submit when all 4 digits entered
    if (value && index === 3) {
      handleSubmit(newDigits);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
      setFocusedIndex(index - 1);
    }
    if (e.key === 'Enter') {
      handleSubmit(digits);
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      inputRefs[3].current?.focus();
      setFocusedIndex(3);
      handleSubmit(newDigits);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0f0f2e 0%, #050510 60%)' }}>

      {/* Particle canvas */}
      <canvas id="particles" className="absolute inset-0 pointer-events-none" />

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[150px]" />

      {/* Main card */}
      <div className={`relative z-10 flex flex-col items-center transition-all duration-700 ${success ? 'scale-105 opacity-0' : 'scale-100 opacity-100'}`}>

        {/* Logo */}
        <div className="mb-8 relative group">
          {/* Glow behind logo */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity scale-110" />
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl shadow-violet-500/20"
            style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
            {/* Terminify bot icon */}
            <svg viewBox="0 0 100 100" className="w-full h-full p-4 drop-shadow-lg">
              <rect x="20" y="25" width="60" height="45" rx="12" fill="white" opacity="0.95" />
              <rect x="25" y="18" width="50" height="8" rx="4" fill="white" opacity="0.7" />
              {/* Eyes */}
              <circle cx="38" cy="44" r="5" fill="#2563eb" />
              <circle cx="62" cy="44" r="5" fill="#2563eb" />
              {/* Smile */}
              <path d="M38 55 Q50 63 62 55" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
              {/* Antenna */}
              <line x1="50" y1="18" x2="50" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <circle cx="50" cy="8" r="3" fill="#06b6d4" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
          terminify<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">.</span>
        </h1>
        <p className="text-zinc-500 text-sm mb-8">Analytics Dashboard</p>

        {/* Subtitle */}
        <div className="mb-6 text-center">
          <p className="text-zinc-300 text-sm font-medium mb-1">🔐 Zugang nur für das Team</p>
          <p className="text-zinc-600 text-xs">4-stelligen Code eingeben</p>
        </div>

        {/* PIN Input */}
        <div className="flex gap-3 mb-6" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <div key={i} className="relative">
              {/* Glow ring on focus */}
              <div className={`absolute -inset-1 rounded-2xl transition-all duration-300 ${
                focusedIndex === i ? 'bg-gradient-to-r from-violet-600 to-blue-600 opacity-50 blur-sm' : 'opacity-0'
              }`} />
              <input
                ref={inputRefs[i]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={() => setFocusedIndex(i)}
                className={`relative w-16 h-20 text-center text-3xl font-bold rounded-xl border-2 outline-none transition-all duration-300 bg-zinc-900/80 backdrop-blur-sm ${
                  error
                    ? 'border-red-500 text-red-400 animate-shake'
                    : success
                    ? 'border-emerald-500 text-emerald-400'
                    : digit
                    ? 'border-violet-500/50 text-white shadow-lg shadow-violet-500/10'
                    : focusedIndex === i
                    ? 'border-violet-500/80 text-white'
                    : 'border-zinc-700 text-white hover:border-zinc-600'
                }`}
                disabled={loading || success}
                autoComplete="off"
              />
              {/* Filled indicator dot */}
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300 ${
                digit ? 'bg-violet-500 scale-100' : 'bg-zinc-700 scale-75'
              }`} />
            </div>
          ))}
        </div>

        {/* Status messages */}
        <div className="h-6 flex items-center justify-center">
          {error && (
            <p className="text-red-400 text-sm font-medium animate-fadeIn">
              ❌ Falscher Code
            </p>
          )}
          {success && (
            <p className="text-emerald-400 text-sm font-medium animate-fadeIn">
              ✅ Willkommen!
            </p>
          )}
          {loading && (
            <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          )}
        </div>

        {/* Subtle hint */}
        <div className="mt-10 flex items-center gap-2 text-zinc-700 text-[10px]">
          <span className="w-8 h-px bg-zinc-800" />
          <span>Powered by TERMINIFY.AI</span>
          <span className="w-8 h-px bg-zinc-800" />
        </div>
      </div>

      {/* Success flash overlay */}
      {success && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-blue-600/20 animate-fadeIn" />
        </div>
      )}
    </div>
  );
}
