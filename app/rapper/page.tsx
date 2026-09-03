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
        padding: '2.5rem 1.5rem 5rem',
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
          style={{ maxWidth: '240px', width: '100%', height: 'auto', margin: '0 auto 1.25rem auto', display: 'block' }}
        />
        <h1 className="title" style={{ fontSize: '2.4rem', marginBottom: '0.25rem' }}>
          🎤 סלוגנים לראפר
        </h1>
        <p className="subtitle" style={{ fontSize: '1.15rem', color: '#0284c7', fontWeight: 700, marginBottom: '1.5rem' }}>
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
            marginBottom: '2.5rem',
          }}
        >
          <div
            style={{
              background: '#f0f9ff',
              border: '1.5px solid #bae6fd',
              color: '#0369a1',
              padding: '8px 22px',
              borderRadius: '20px',
              fontSize: '1.1rem',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
            }}
          >
            🔥 {totalSlogansCount} סלוגנים ({groupsWithSlogansCount} מתוך 20 קבוצות)
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              background: '#ffffff',
              padding: '5px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            }}
          >
            <button
              onClick={() => setViewMode('cards')}
              style={{
                background: viewMode === 'cards' ? '#0284c7' : 'transparent',
                color: viewMode === 'cards' ? '#ffffff' : '#475569',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              כרטיסיות
            </button>
            <button
              onClick={() => setViewMode('stage')}
              style={{
                background: viewMode === 'stage' ? '#0284c7' : 'transparent',
                color: viewMode === 'stage' ? '#ffffff' : '#475569',
                border: 'none',
                padding: '7px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
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
          <p style={{ color: '#64748b' }}>טוען סלוגנים בלייב...</p>
        </div>
      ) : viewMode === 'stage' ? (
        /* STAGE TELEPROMPTER VIEW (Light Theme) */
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
                  borderRight: hasSlogans ? '6px solid #0284c7' : '6px solid #e2e8f0',
                  background: hasSlogans ? '#ffffff' : '#f8fafc',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '2rem',
                  boxShadow: hasSlogans ? '0 8px 25px rgba(15, 23, 42, 0.06)' : 'none',
                }}
              >
                <div
                  style={{
                    minWidth: '130px',
                    textAlign: 'center',
                    background: hasSlogans ? 'linear-gradient(135deg, #0284c7, #0052cc)' : '#f1f5f9',
                    color: hasSlogans ? '#ffffff' : '#94a3b8',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    boxShadow: hasSlogans ? '0 4px 15px rgba(0, 82, 204, 0.25)' : 'none',
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
                          background: slogansList.length > 1 ? '#f8fafc' : 'transparent',
                          padding: slogansList.length > 1 ? '0.85rem 1.25rem' : '0',
                          borderRadius: '10px',
                          border: slogansList.length > 1 ? '1px solid #e2e8f0' : 'none',
                          borderRight: slogansList.length > 1 ? '4px solid #0284c7' : 'none',
                        }}
                      >
                        {slogansList.length > 1 && (
                          <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 800, marginLeft: '8px' }}>
                            #{idx + 1}:
                          </span>
                        )}
                        <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.35 }}>
                          "{slog.sentence}"
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '1.2rem', color: '#94a3b8', fontStyle: 'italic', paddingTop: '8px' }}>
                      ממתין לסלוגן מקבוצה {grp}...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID CARDS VIEW (Light Theme) */
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
                  borderTop: hasSlogans ? '4px solid #0284c7' : '4px solid #e2e8f0',
                  background: hasSlogans ? '#ffffff' : '#f8fafc',
                  minHeight: '170px',
                  boxShadow: hasSlogans ? '0 4px 15px rgba(15, 23, 42, 0.05)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      background: hasSlogans ? 'linear-gradient(135deg, #e0f2fe, #bae6fd)' : '#f1f5f9',
                      color: hasSlogans ? '#0369a1' : '#94a3b8',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '1rem',
                      border: hasSlogans ? '1px solid #7dd3fc' : '1px solid #e2e8f0',
                    }}
                  >
                    קבוצה {grp}
                  </span>
                  {hasSlogans && (
                    <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 700 }}>
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
                          color: '#0f172a',
                          lineHeight: 1.35,
                          borderBottom: idx < slogansList.length - 1 ? '1px solid #f1f5f9' : 'none',
                          paddingBottom: idx < slogansList.length - 1 ? '0.4rem' : '0',
                        }}
                      >
                        {slogansList.length > 1 && (
                          <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 800, marginLeft: '6px' }}>
                            #{idx + 1}
                          </span>
                        )}
                        "{slog.sentence}"
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.95rem', color: '#94a3b8', fontStyle: 'italic' }}>
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
