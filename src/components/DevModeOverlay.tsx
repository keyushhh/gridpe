import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { useCustomToaster } from '@/contexts/CustomToasterContext';
import { motion } from 'framer-motion';

// ─── DevModeOverlay ───────────────────────────────────────────────────────────
// A global floating dev-tools panel. Renders only in Vite dev server in browser.
// Mounted inside <Router> in App.tsx but outside all <Routes>.
// No useNavigate, no real-time subscriptions, no complex hooks.
// ──────────────────────────────────────────────────────────────────────────────

const DevModeOverlay: React.FC = () => {
  // Gate: only show in browser dev, never in native Capacitor builds
  const cap = (window as any).Capacitor;
  const isNative = !!(cap?.isNativePlatform?.()) || !!(cap?.platform && cap.platform !== 'web');

  // ── State ──────────────────────────────────────────────────────────────────

  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<'ok' | 'err'>('ok');

  const { profile, setProfile } = useUser();
  const { showToaster } = useCustomToaster();

  // Night hours toggle state (synced with localStorage)
  const [nightForced, setNightForced] = useState(
    () => localStorage.getItem('dev_force_night_hours') === 'true',
  );

  // ── Draggable position ─────────────────────────────────────────────────────

  const BUTTON_SIZE = 52;

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(val, max));

  const [pos, setPos] = useState(() => {
    const fallbackX = (window.innerWidth ?? 375) - BUTTON_SIZE - 20;
    const fallbackY = (window.innerHeight ?? 812) - BUTTON_SIZE - 100;
    try {
      const raw = localStorage.getItem('dev_overlay_pos');
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p.x === 'number' && typeof p.y === 'number') {
          return {
            x: clamp(p.x, 0, window.innerWidth - BUTTON_SIZE),
            y: clamp(p.y, 0, window.innerHeight - BUTTON_SIZE),
          };
        }
      }
    } catch { /* ignore */ }
    return { x: fallbackX, y: fallbackY };
  });

  // Re-clamp on window resize
  useEffect(() => {
    const onResize = () =>
      setPos(p => ({
        x: clamp(p.x, 0, window.innerWidth - BUTTON_SIZE),
        y: clamp(p.y, 0, window.innerHeight - BUTTON_SIZE),
      }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const ok = (msg: string) => { setResult(msg); setResultType('ok'); };
  const err = (msg: string) => { setResult(msg); setResultType('err'); };

  /** Fetch the user's latest active order id */
  const getActiveOrderId = async (): Promise<string | null> => {
    if (!profile?.id) return null;
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', profile.id)
      .not('status', 'in', '("delivered","success","cancelled","failed")')
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) { err(error.message); return null; }
    if (!data || data.length === 0) { err('No active order found.'); return null; }
    return data[0].id;
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleToggleNight = () => {
    const next = !nightForced;
    setNightForced(next);
    localStorage.setItem('dev_force_night_hours', String(next));
    // Dispatch event so Homepage immediately re-evaluates
    window.dispatchEvent(new CustomEvent('dev-force-night-toggle'));
    ok(next ? 'Night hours forced ON (11PM–6AM)' : 'Night hours override OFF');
  };

  const handleSimulatePickup = async () => {
    const orderId = await getActiveOrderId();
    if (!orderId) return;
    try {
      const { error: e } = await supabase
        .from('orders')
        .update({ status: 'picked_up' })
        .eq('id', orderId);
      if (e) throw e;
      ok(`Pickup simulated → ${orderId.slice(0, 8)}`);
      showToaster('Order picked up!', 'success');
    } catch (e: any) { err(e.message ?? String(e)); }
  };

  const handleSimulateDelivery = async () => {
    const orderId = await getActiveOrderId();
    if (!orderId) return;
    try {
      const { error: e } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);
      if (e) throw e;
      window.dispatchEvent(new CustomEvent('dev-order-delivered', { detail: { orderId } }));
      ok(`Delivery simulated → ${orderId.slice(0, 8)}`);
      showToaster('Order delivered!', 'success');
    } catch (e: any) { err(e.message ?? String(e)); }
  };

  const handleTriggerRating = () => {
    window.dispatchEvent(new CustomEvent('dev-mode-test-rating'));
    ok('Rider rating sheet triggered.');
    showToaster('Rating sheet triggered!', 'success');
  };

  const handleResetTerms = async () => {
    if (!profile?.id) { err('Profile not loaded.'); return; }
    try {
      const { error: e } = await supabase
        .from('profiles')
        .update({ terms_accepted_at: null, terms_version: null } as any)
        .eq('id', profile.id);
      if (e) throw e;
      setProfile({ ...profile, terms_accepted_at: null, terms_version: null });
      ok('Terms reset in DB + context.');
      showToaster('Terms reset!', 'success');
    } catch (e: any) { err(e.message ?? String(e)); }
  };

  const handleForceTermsGate = () => {
    if (!profile) { err('Profile not loaded.'); return; }
    setProfile({ ...profile, terms_accepted_at: null, terms_version: null });
    ok('Local terms state cleared — gate should appear.');
    showToaster('Terms gate forced open!', 'success');
  };

  const handleSeedDevData = async () => {
    if (!profile?.id) { err('Profile not loaded.'); return; }
    try {
      const { error: updateErr } = await supabase
        .from('wallets')
        .update({ available_balance: 100000 })
        .eq('user_id', profile.id);
      if (updateErr) throw updateErr;
      window.dispatchEvent(new CustomEvent('dev-force-update'));
      ok('Seeded ₹1,00,000 balance!');
      showToaster('Dev data seeded!', 'success');
    } catch (e: any) { err(e.message ?? String(e)); }
  };

  // ── Menu item definitions ──────────────────────────────────────────────────

  const actions: { label: string; emoji: string; onClick: () => void; accent?: string }[] = [
    {
      label: nightForced ? '🌙 Disable Night Hours' : '🌙 Force Time (11PM – 6AM)',
      emoji: '',
      onClick: handleToggleNight,
      accent: nightForced ? '#f59e0b' : undefined,
    },
    { label: 'Simulate Pickup', emoji: '📦', onClick: handleSimulatePickup },
    { label: 'Simulate Delivery', emoji: '🏁', onClick: handleSimulateDelivery },
    { label: 'Trigger Rider Rating', emoji: '⭐', onClick: handleTriggerRating },
    { label: 'Reset Terms', emoji: '📄', onClick: handleResetTerms },
    { label: 'Force Terms Gate', emoji: '🔓', onClick: handleForceTermsGate },
    { label: 'Seed Dev Data', emoji: '🌱', onClick: handleSeedDevData },
    { label: 'Force Update', emoji: '🔴', onClick: () => window.dispatchEvent(new CustomEvent('dev-force-update')) },
    { label: 'Simulate Offline', emoji: '🔌', onClick: () => window.dispatchEvent(new CustomEvent('dev-simulate-offline')), accent: '#ef4444' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  const btnBase: React.CSSProperties = {
    padding: '10px 14px',
    backgroundColor: '#1f2937',
    border: 'none',
    borderRadius: '8px',
    color: '#e5e7eb',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '13px',
    textAlign: 'left',
    transition: 'background-color 0.15s',
    width: '100%',
  };

  if (!import.meta.env.DEV || isNative) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: isOpen ? undefined : pos.x,
        top: isOpen ? undefined : pos.y,
        bottom: isOpen ? 20 : undefined,
        right: isOpen ? 20 : undefined,
        zIndex: 99999,
      }}
    >
      {/* ── Floating button ─────────────────────────────────────────────── */}
      {!isOpen && (
        <motion.button
          drag
          dragMomentum={false}
          onDragEnd={(e, info) => {
            const next = {
              x: clamp(pos.x + info.offset.x, 0, window.innerWidth - BUTTON_SIZE),
              y: clamp(pos.y + info.offset.y, 0, window.innerHeight - BUTTON_SIZE),
            };
            setPos(next);
            localStorage.setItem('dev_overlay_pos', JSON.stringify(next));
          }}
          onClick={() => {
            setIsOpen(true);
            setResult(null);
          }}
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            borderRadius: '50%',
            backgroundColor: '#6366f1',
            color: '#fff',
            border: 'none',
            fontSize: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          🛠
        </motion.button>
      )}

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          style={{
            width: 300,
            backgroundColor: 'rgba(15,17,23,0.96)',
            color: '#fff',
            borderRadius: 14,
            padding: 20,
            boxShadow: '0 20px 50px rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#a5b4fc' }}>🛠 Dev Controls</span>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 18, padding: '2px 6px' }}
            >
              ✕
            </button>
          </div>

          {/* Result toast */}
          {result && (
            <div
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 12,
                marginBottom: 10,
                backgroundColor: resultType === 'ok' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                color: resultType === 'ok' ? '#86efac' : '#fca5a5',
                border: `1px solid ${resultType === 'ok' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                wordBreak: 'break-word',
              }}
            >
              {result}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                style={{
                  ...btnBase,
                  ...(a.accent ? { borderLeft: `3px solid ${a.accent}` } : {}),
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#374151')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1f2937')}
              >
                {a.emoji ? `${a.emoji} ` : ''}{a.label}
              </button>
            ))}

            {/* Close */}
            <button
              onClick={() => setIsOpen(false)}
              style={{
                ...btnBase,
                textAlign: 'center',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#d1d5db',
                marginTop: 4,
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevModeOverlay;
