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

export default function CommitmentsPage() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
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
      console.error('Failed to fetch commitments:', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    const interval = setInterval(() => {
      fetchItems(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Filter items that have a commitment (or show all entries)
  const filtered = items.filter((item) => {
    if (!item.commitment && !item.sentence) return false;
    if (selectedGroup === 'all') return true;
    return item.group.toString() === selectedGroup;
  });

  return (
    <main className="container" style={{ minHeight: '100vh', padding: '2.5rem 1.5rem 4rem' }} dir="rtl">
      {/* Header */}
      <div className="text-center animate-fade-in mb-2">
        <img
          src="/logo-pisga.png"
          alt="פסגה - פורום 100"
          style={{ maxWidth: '220px', width: '100%', height: 'auto', margin: '0 auto 1.25rem auto', display: 'block' }}
        />
        <h1 className="title">
          פורום 100 – מודל מנהיגות
        </h1>
        <h2 style={{ fontSize: '1.75rem', color: '#0284c7', fontWeight: 800, marginBottom: '0.5rem' }}>
          📜 לוח התחייבויות לפעולה
        </h2>
        <p className="subtitle" style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          ההתחייבויות של כלל הקבוצות להובלת מנהיגות, עשייה ומצוינות
        </p>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <a
            href="/stream"
            className="save-order-button"
            style={{ textDecoration: 'none', background: '#0052cc', padding: '9px 20px', borderRadius: '10px' }}
          >
            📺 מעבר למסך הקרנה
          </a>
          <a
            href="/"
            className="logout-button"
            style={{ textDecoration: 'none', padding: '9px 20px', borderRadius: '10px' }}
          >
            📱 עמוד משתמש להעלאה
          </a>
          <a
            href="/admin"
            className="logout-button"
            style={{ textDecoration: 'none', padding: '9px 20px', borderRadius: '10px' }}
          >
            ⚙️ פאנל ניהול
          </a>
        </div>

        {/* Group Filter Bar */}
        <div
          style={{
            display: 'flex',
            gap: '0.6rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            maxWidth: '900px',
            margin: '0 auto 2.5rem auto',
            background: '#ffffff',
            padding: '1rem',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 15px rgba(15, 23, 42, 0.04)'
          }}
        >
          <button
            onClick={() => setSelectedGroup('all')}
            style={{
              background: selectedGroup === 'all' ? '#0284c7' : '#f1f5f9',
              color: selectedGroup === 'all' ? '#ffffff' : '#334155',
              border: selectedGroup === 'all' ? 'none' : '1px solid #cbd5e1',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            כל הקבוצות ({items.length})
          </button>
          {Array.from({ length: 20 }, (_, i) => i + 1).map((grp) => {
            const count = items.filter((i) => i.group === grp).length;
            const isSelected = selectedGroup === grp.toString();
            return (
              <button
                key={grp}
                onClick={() => setSelectedGroup(grp.toString())}
                style={{
                  background: isSelected ? '#0284c7' : '#ffffff',
                  color: isSelected ? '#ffffff' : count > 0 ? '#0f172a' : '#94a3b8',
                  border: isSelected ? 'none' : '1px solid #e2e8f0',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontWeight: isSelected || count > 0 ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                קבוצה {grp} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Commitments Cards Grid */}
      {isLoading ? (
        <div className="text-center" style={{ padding: '3rem' }}>
          <div className="loader" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto' }} />
          <p style={{ color: '#64748b' }}>טוען התחייבויות...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="glass-panel text-center"
          style={{ maxWidth: '600px', margin: '2rem auto', padding: '3rem 2rem' }}
        >
          <p style={{ fontSize: '1.25rem', color: '#64748b' }}>
            טרם הוזנו התחייבויות לפעולה {selectedGroup !== 'all' ? `עבור קבוצה ${selectedGroup}` : ''}.
          </p>
          <a
            href="/"
            className="btn-primary"
            style={{ marginTop: '1.5rem', textDecoration: 'none', display: 'inline-flex' }}
          >
            🚀 להזנת התחייבות והעלאת תמונה
          </a>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.75rem',
            maxWidth: '1200px',
            margin: '0 auto',
          }}
        >
          {filtered.map((item, index) => {
            const isVideo = item.url.match(/\.(mp4|webm|ogg|mov)$/i);
            return (
              <div
                key={item.id || item.url || index}
                className="glass-panel animate-fade-in"
                style={{
                  padding: '1.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  borderTop: '4px solid #0284c7',
                  background: '#ffffff',
                }}
              >
                {/* Card Top: Group & Time */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span
                      style={{
                        background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                        color: '#0369a1',
                        padding: '5px 14px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        border: '1px solid #7dd3fc'
                      }}
                    >
                      {item.group === 0 ? 'כללי' : `קבוצה ${item.group}`}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {new Date(item.time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Commitment Box */}
                  <div
                    style={{
                      background: '#f8fafc',
                      borderRight: '4px solid #0284c7',
                      border: '1px solid #e2e8f0',
                      borderRightWidth: '4px',
                      borderRightColor: '#0284c7',
                      padding: '1.1rem 1.25rem',
                      borderRadius: '0 12px 12px 0',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0284c7', marginBottom: '0.35rem' }}>
                      ✨ התחייבות לפעולה:
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.45 }}>
                      {item.commitment || <span style={{ color: '#94a3b8', fontSize: '1rem' }}>ללא פירוט התחייבות</span>}
                    </div>
                  </div>

                  {/* Slogan */}
                  {item.sentence && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', marginBottom: '0.2rem' }}>
                        🎯 סלוגן הקבוצה:
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#334155' }}>
                        "{item.sentence}"
                      </div>
                    </div>
                  )}
                </div>

                {/* Media Thumbnail */}
                {item.url && (
                  <div style={{ borderRadius: '10px', overflow: 'hidden', maxHeight: '180px', marginTop: '0.5rem', border: '1px solid #e2e8f0' }}>
                    {isVideo ? (
                      <video
                        src={item.url}
                        muted
                        playsInline
                        style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt="תמונת הקבוצה"
                        loading="lazy"
                        style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
