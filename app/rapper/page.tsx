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

  // Collect ALL slogans per group (1-20), allowing multiple slogans per group without overwriting
  const groupSlogans: Record<number, Array<{ id: string; sentence: string; time: number }>> = {};
  for (let i = 1; i <= 20; i++) {
    groupSlogans[i] = [];
  }

  items.forEach((item) => {
    if (item.group >= 1 && item.group <= 20 && item.sentence && item.sentence.trim()) {
      // Avoid exact duplicates by id/sentence
      const exists = groupSlogans[item.group].some(
        (s) => s.id === item.id || (s.sentence === item.sentence.trim() && Math.abs(s.time - item.time) < 1000)
      );
      if (!exists) {
        groupSlogans[item.group].push({
          id: item.id || item.url,
          sentence: item.sentence.trim(),
          time: item.time,
        });
      }
    }
  });

  // Sort each group's slogans by time (newest first)
  for (let i = 1; i <= 20; i++) {
    groupSlogans[i].sort((a, b) => b.time - a.time);
  }

  const groupsWithSlogansCount = Object.keys(groupSlogans).filter(
    (grp) => groupSlogans[parseInt(grp, 10)].length > 0
  ).length;

  const totalSlogansCount = Object.values(groupSlogans).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

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
          פורום 100 – מודל מנהיגות | מאגר הסלוגנים של כל הקבוצות
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
            🔥 {totalSlogansCount} סלוגנים ({groupsWithSlogansCount} מתוך 20 קבוצות)
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
      {isLoading && totalSlogansCount === 0 ? (
        <div className="text-center" style={{ padding: '4rem' }}>
          <div className="loader" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#94a3b8' }}>טוען סלוגנים בלייב...</p>
        </div>
      ) : viewMode === 'stage' ? (
        /* STAGE TELEPROMPTER VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((grp) => {
            const slogansList = groupSlogans[grp] || [];
            const hasSlogans = slogansList.length > 0;
            return (
              <div
                key={grp}
                className="glass-panel"
                style={{
                  padding: '1.75rem 2rem',
                  borderRight: hasSlogans ? '6px solid #38bdf8' : '6px solid rgba(255,255,255,0.1)',
                  background: hasSlogans ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.4)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '2rem',
                }}
              >
                <div
                  style={{
                    minWidth: '130px',
                    textAlign: 'center',
                    background: hasSlogans ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(255,255,255,0.05)',
                    color: hasSlogans ? '#fff' : '#64748b',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    boxShadow: hasSlogans ? '0 4px 15px rgba(37, 99, 235, 0.4)' : 'none',
                    flexShrink: 0,
                  }}
                >
                  קבוצה {grp}
                  {slogansList.length > 1 && (
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.9, marginTop: '4px' }}>
                      ({slogansList.length} סלוגנים)
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {hasSlogans ? (
                    slogansList.map((slog, idx) => (
                      <div
                        key={slog.id || idx}
                        style={{
                          background: slogansList.length > 1 ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
                          padding: slogansList.length > 1 ? '0.75rem 1rem' : '0',
                          borderRadius: '8px',
                          borderRight: slogansList.length > 1 ? '3px solid #38bdf8' : 'none',
                        }}
                      >
                        {slogansList.length > 1 && (
                          <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700, marginLeft: '8px' }}>
                            #{idx + 1}:
                          </span>
                        )}
                        <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.35 }}>
                          "{slog.sentence}"
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '1.2rem', color: '#64748b', fontStyle: 'italic', paddingTop: '8px' }}>
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map((grp) => {
            const slogansList = groupSlogans[grp] || [];
            const hasSlogans = slogansList.length > 0;
            return (
              <div
                key={grp}
                className="glass-panel animate-fade-in"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: hasSlogans ? '4px solid #38bdf8' : '4px solid rgba(255,255,255,0.1)',
                  background: hasSlogans ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.35)',
                  minHeight: '170px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      background: hasSlogans ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(255,255,255,0.06)',
                      color: hasSlogans ? '#fff' : '#64748b',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}
                  >
                    קבוצה {grp}
                  </span>
                  {hasSlogans && (
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                      {slogansList.length === 1 ? '✓ סלוגן 1' : `✓ ${slogansList.length} סלוגנים`}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6rem', justifyContent: 'center' }}>
                  {hasSlogans ? (
                    slogansList.map((slog, idx) => (
                      <div
                        key={slog.id || idx}
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          lineHeight: 1.35,
                          borderBottom: idx < slogansList.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                          paddingBottom: idx < slogansList.length - 1 ? '0.4rem' : '0',
                        }}
                      >
                        {slogansList.length > 1 && (
                          <span style={{ fontSize: '0.85rem', color: '#38bdf8', marginLeft: '6px' }}>
                            #{idx + 1}
                          </span>
                        )}
                        "{slog.sentence}"
                      </div>
                    ))
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
