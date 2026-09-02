'use client';

import React, { useState, useEffect, useRef } from 'react';

interface ImageItem {
  id: string;
  url: string;
  group: number;
  sentence: string;
  commitment?: string;
  time: number;
}

export default function RapperPage() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'cards' | 'stage'>('cards');
  const previousDataRef = useRef<ImageItem[]>([]);

  const fetchItems = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/images', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const galleryItems = data.images || [];
        if (JSON.stringify(galleryItems) !== JSON.stringify(previousDataRef.current)) {
          previousDataRef.current = galleryItems;
          setItems(galleryItems);
        }
      }
    } catch (err) {
      console.error('Failed to fetch slogans for rapper:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(() => {
      fetchItems(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Map latest slogan per group (1-20)
  const groupSlogans: Record<number, { sentence: string; time: number }> = {};
  items.forEach((item) => {
    if (item.group >= 1 && item.group <= 20 && item.sentence && item.sentence.trim()) {
      if (!groupSlogans[item.group] || item.time > groupSlogans[item.group].time) {
        groupSlogans[item.group] = {
          sentence: item.sentence.trim(),
          time: item.time,
        };
      }
    }
  });

  const submittedCount = Object.keys(groupSlogans).length;

  return (
    <main
      className="container"
      style={{
        minHeight: '100vh',
        padding: '2rem 1.5rem 5rem',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
      dir="rtl"
    >
      {/* Header */}
      <div className="text-center animate-fade-in mb-2">
        <img
          src="/logo-pisga.png"
          alt="פסגה - פורום 100"
          style={{ maxWidth: '200px', width: '100%', height: 'auto', margin: '0 auto 1rem auto', display: 'block' }}
        />
        <h1 className="title" style={{ fontSize: '2.4rem', marginBottom: '0.25rem' }}>
          🎤 סלוגנים לראפר
        </h1>
        <p className="subtitle" style={{ fontSize: '1.15rem', color: '#38bdf8', fontWeight: 600, marginBottom: '1rem' }}>
          פורום 100 – מודל מנהיגות | מאגר 20 הסלוגנים בלבד
        </p>

        {/* Counter & View Mode Switcher */}
        <div
          style={{
            display: 'flex',
            gap: '1.25rem',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '1.75rem',
          }}
        >
          <div
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '1.1rem',
              fontWeight: 700,
            }}
          >
            🔥 התקבלו: {submittedCount} מתוך 20 קבוצות
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.08)', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? '#38bdf8' : 'transparent',
                color: viewMode === 'cards' ? '#0f172a' : '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              כרטיסיות
            </button>
            <button
              onClick={() => setViewMode('stage')}
              style={{
                background: viewMode === 'stage' ? '#38bdf8' : 'transparent',
                color: viewMode === 'stage' ? '#0f172a' : '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              תצוגת במה ענקית (Stage)
            </button>
          </div>
        </div>
      </div>

      {/* Main Slogans Presentation */}
      {isLoading && submittedCount === 0 ? (
        <div className="text-center" style={{ padding: '4rem' }}>
          <div className="loader" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#94a3b8' }}>טוען סלוגנים בלייב...</p>
        </div>
      ) : viewMode === 'stage' ? (
        /* STAGE TELEPROMPTER VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((grp) => {
            const entry = groupSlogans[grp];
            const hasSlogan = !!entry;
            return (
              <div
                key={grp}
                className="glass-panel"
                style={{
                  padding: '1.75rem 2rem',
                  borderRight: hasSlogan ? '6px solid #38bdf8' : '6px solid rgba(255,255,255,0.1)',
                  background: hasSlogan ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2rem',
                }}
              >
                <div
                  style={{
                    minWidth: '130px',
                    textAlign: 'center',
                    background: hasSlogan ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(255,255,255,0.05)',
                    color: hasSlogan ? '#fff' : '#64748b',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    boxShadow: hasSlogan ? '0 4px 15px rgba(37, 99, 235, 0.4)' : 'none',
                  }}
                >
                  קבוצה {grp}
                </div>

                <div style={{ flex: 1 }}>
                  {hasSlogan ? (
                    <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>
                      "{entry.sentence}"
                    </div>
                  ) : (
                    <div style={{ fontSize: '1.2rem', color: '#64748b', fontStyle: 'italic' }}>
                      ממתין לסלוגן מקבוצה {grp}...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map((grp) => {
            const entry = groupSlogans[grp];
            const hasSlogan = !!entry;
            return (
              <div
                key={grp}
                className="glass-panel animate-fade-in"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: hasSlogan ? '4px solid #38bdf8' : '4px solid rgba(255,255,255,0.1)',
                  background: hasSlogan ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.35)',
                  minHeight: '170px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span
                    style={{
                      background: hasSlogan ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(255,255,255,0.06)',
                      color: hasSlogan ? '#fff' : '#64748b',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    קבוצה {grp}
                  </span>
                  {hasSlogan && (
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                      ✓ עודכן
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  {hasSlogan ? (
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>
                      "{entry.sentence}"
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.95rem', color: '#64748b', fontStyle: 'italic' }}>
                      ממתין לסלוגן...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
