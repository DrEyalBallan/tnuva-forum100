'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EVENT_CONFIG } from '@/lib/eventConfig';

interface ImageItem {
  id: string;
  url: string;
  group: number;
  sentence: string;
  commitment?: string;
  time: number;
}

export default function CommitmentsSlideshowPage() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [slideDuration, setSlideDuration] = useState(5000); // 5 seconds default
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [showControls, setShowControls] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'stage'>('light');
  const previousDataRef = useRef<ImageItem[]>([]);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch items live
  const fetchItems = async () => {
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
    }
  };

  useEffect(() => {
    fetchItems();
    if (EVENT_CONFIG.isActive) {
      const interval = setInterval(fetchItems, 3000);
      return () => clearInterval(interval);
    }
  }, []);

  // Filter items that have commitments (or sentences)
  const filtered = items.filter((item) => {
    if (!item.commitment && !item.sentence) return false;
    if (selectedGroup === 'all') return true;
    return item.group.toString() === selectedGroup;
  });

  // Slide transition timer
  useEffect(() => {
    if (!isPlaying || filtered.length === 0) return;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filtered.length);
    }, slideDuration);
    return () => clearTimeout(timer);
  }, [isPlaying, filtered.length, currentIndex, slideDuration]);

  // Reset index if out of bounds
  useEffect(() => {
    if (currentIndex >= filtered.length && filtered.length > 0) {
      setCurrentIndex(0);
    }
  }, [filtered.length, currentIndex]);

  // Keyboard navigation & controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageDown') {
        setCurrentIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowRight' || e.key === 'PageUp') {
        setCurrentIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'Escape') {
        window.location.href = '/commitments';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered.length]);

  // Auto-hide controls on mouse idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3500);
  };

  const currentItem = filtered.length > 0 ? filtered[currentIndex % filtered.length] : null;
  const isVideo = currentItem?.url && currentItem.url.match(/\.(mp4|webm|ogg|mov)$/i);

  const isStageTheme = themeMode === 'stage';
  const bgColor = isStageTheme ? '#0b1329' : '#f8fafc';
  const textColor = isStageTheme ? '#ffffff' : '#0f172a';
  const cardBg = isStageTheme ? 'rgba(15, 23, 42, 0.95)' : '#ffffff';
  const cardBorder = isStageTheme ? 'rgba(56, 189, 248, 0.25)' : '#e2e8f0';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <main
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        backgroundColor: bgColor,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Rubik', system-ui, sans-serif",
        transition: 'background-color 0.4s ease',
      }}
      dir="rtl"
    >
      {/* Top Bar Header & Controls */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 50,
          background: isStageTheme
            ? 'linear-gradient(180deg, rgba(11, 19, 41, 0.95) 0%, rgba(11, 19, 41, 0) 100%)'
            : 'linear-gradient(180deg, rgba(248, 250, 252, 0.98) 0%, rgba(248, 250, 252, 0) 100%)',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* Right side: Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {EVENT_CONFIG.logoUrl && (
            <img
              src={EVENT_CONFIG.logoUrl}
              alt={EVENT_CONFIG.logoAlt}
              style={{ height: '42px', width: 'auto' }}
            />
          )}
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: textColor }}>
              {EVENT_CONFIG.navLinks.slideshowLabel}
            </h1>
            <span style={{ fontSize: '0.85rem', color: isStageTheme ? '#38bdf8' : (EVENT_CONFIG.theme.accentColor || '#0284c7'), fontWeight: 600 }}>
              {EVENT_CONFIG.eventTitle}
            </span>
          </div>
        </div>

        {/* Center: Slide Counter */}
        {filtered.length > 0 && (
          <div
            style={{
              background: isStageTheme ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe',
              color: isStageTheme ? '#38bdf8' : '#0369a1',
              border: isStageTheme ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #bae6fd',
              padding: '6px 18px',
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            שקופית {currentIndex + 1} מתוך {filtered.length}
          </div>
        )}

        {/* Left side: Navigation / Exit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setThemeMode(isStageTheme ? 'light' : 'stage')}
            style={{
              background: isStageTheme ? 'rgba(255,255,255,0.1)' : '#ffffff',
              color: textColor,
              border: isStageTheme ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
            title="החלף ערכת נושא (במה כהה / בהיר)"
          >
            {isStageTheme ? '☀️ עיצוב בהיר' : '🌙 עיצוב במה כהה'}
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              background: isStageTheme ? 'rgba(255,255,255,0.1)' : '#ffffff',
              color: textColor,
              border: isStageTheme ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }}
            title="מסך מלא"
          >
            ⛶ מסך מלא
          </button>

          <a
            href="/commitments"
            style={{
              textDecoration: 'none',
              background: EVENT_CONFIG.theme.primaryColor || '#0052cc',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(0, 82, 204, 0.3)',
            }}
          >
            ← חזרה ללוח
          </a>
        </div>
      </div>

      {/* Main Slide Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '5rem 3rem 6.5rem',
          maxWidth: '1500px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loader" style={{ width: '48px', height: '48px', margin: '0 auto 1.5rem auto' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: textColor, marginBottom: '0.75rem' }}>
              ממתין להזנת התחייבויות לפעולה...
            </h2>
            <p style={{ color: isStageTheme ? '#94a3b8' : '#64748b', fontSize: '1.1rem' }}>
              {EVENT_CONFIG.isActive
                ? 'ברגע שמשתתפים יעלו התחייבויות, השקופיות ירוצו כאן אוטומטית בלייב.'
                : 'האירוע אינו פעיל כעת. ניתן להפעילו מחדש בהגדרות הקונפיגורציה.'}
            </p>
          </div>
        ) : currentItem ? (
          <div
            key={currentItem.id || `${currentIndex}-${currentItem.url}`}
            className="animate-fade-in"
            style={{
              width: '100%',
              background: cardBg,
              border: `2px solid ${cardBorder}`,
              borderRadius: '28px',
              padding: '3rem 3.5rem',
              boxShadow: isStageTheme
                ? '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(56, 189, 248, 0.15)'
                : '0 20px 50px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.05)',
              display: 'flex',
              flexDirection: 'row',
              gap: '3rem',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '480px',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Right / Main Content: Commitment & Slogan */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'right' }}>
              {/* Group Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span
                  style={{
                    background: `linear-gradient(135deg, ${EVENT_CONFIG.theme.accentColor || '#0284c7'}, ${EVENT_CONFIG.theme.primaryColor || '#0052cc'})`,
                    color: '#ffffff',
                    padding: '8px 22px',
                    borderRadius: '12px',
                    fontSize: '1.4rem',
                    fontWeight: 900,
                    letterSpacing: '-0.3px',
                    boxShadow: '0 4px 15px rgba(0, 82, 204, 0.35)',
                  }}
                >
                  {currentItem.group === 0 ? 'העלאה כללית' : `${EVENT_CONFIG.labels.groupOptionPrefix} ${currentItem.group}`}
                </span>
                <span style={{ fontSize: '1rem', color: isStageTheme ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                  {EVENT_CONFIG.companyName}
                </span>
              </div>

              {/* Huge Commitment Quote */}
              <div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: isStageTheme ? '#38bdf8' : (EVENT_CONFIG.theme.accentColor || '#0284c7'),
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  ✨ {EVENT_CONFIG.labels.commitmentTitle}:
                </div>
                <div
                  style={{
                    fontSize: (() => {
                      const len = (currentItem.commitment || currentItem.sentence || '').length;
                      if (len > 220) return '1.75rem';
                      if (len > 140) return '2.15rem';
                      if (len > 80) return '2.6rem';
                      return '3.2rem';
                    })(),
                    fontWeight: 800,
                    lineHeight: 1.35,
                    color: textColor,
                    wordBreak: 'break-word',
                  }}
                >
                  “{currentItem.commitment || currentItem.sentence || 'מובילים מנהיגות ועשייה'}”
                </div>
              </div>

              {/* Group Slogan (if present) */}
              {currentItem.sentence && currentItem.commitment && (
                <div
                  style={{
                    background: isStageTheme ? 'rgba(56, 189, 248, 0.1)' : '#f0f9ff',
                    borderRight: `4px solid ${EVENT_CONFIG.theme.accentColor || '#0284c7'}`,
                    padding: '0.9rem 1.4rem',
                    borderRadius: '0 12px 12px 0',
                    marginTop: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isStageTheme ? '#38bdf8' : (EVENT_CONFIG.theme.accentColor || '#0284c7'), marginLeft: '8px' }}>
                    🎯 {EVENT_CONFIG.labels.sloganTitle}:
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: isStageTheme ? '#f1f5f9' : '#1e293b' }}>
                    "{currentItem.sentence}"
                  </span>
                </div>
              )}
            </div>

            {/* Left Content: Group Image / Media Preview (if available) */}
            {currentItem.url && (
              <div
                style={{
                  width: '380px',
                  maxWidth: '40%',
                  height: '360px',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: isStageTheme ? '0 10px 30px rgba(0,0,0,0.5)' : '0 10px 25px rgba(0,0,0,0.1)',
                  border: isStageTheme ? '2px solid rgba(255,255,255,0.1)' : '2px solid #e2e8f0',
                  background: '#0f172a',
                }}
              >
                {isVideo ? (
                  <video
                    src={currentItem.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <img
                    src={currentItem.url}
                    alt={`${EVENT_CONFIG.labels.groupOptionPrefix} ${currentItem.group}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom Control Bar with Slide Duration Slider */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '1.25rem 2.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          zIndex: 50,
          background: isStageTheme
            ? 'linear-gradient(0deg, rgba(11, 19, 41, 0.98) 0%, rgba(11, 19, 41, 0) 100%)'
            : 'linear-gradient(0deg, rgba(248, 250, 252, 0.98) 0%, rgba(248, 250, 252, 0) 100%)',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
      >
        {/* Play / Pause & Prev / Next Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1))}
            style={{
              background: isStageTheme ? 'rgba(255,255,255,0.1)' : '#ffffff',
              color: textColor,
              border: isStageTheme ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="שקופית קודמת (חץ ימינה)"
          >
            ⏭️
          </button>

          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            style={{
              background: isPlaying ? (EVENT_CONFIG.theme.accentColor || '#0284c7') : '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
            title="הפעל / השהה מצגת (מקש רווח)"
          >
            {isPlaying ? '⏸️ השהה' : '▶️ הפעל'}
          </button>

          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % (filtered.length || 1))}
            style={{
              background: isStageTheme ? 'rgba(255,255,255,0.1)' : '#ffffff',
              color: textColor,
              border: isStageTheme ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="שקופית הבאה (חץ שמאלה)"
          >
            ⏮️
          </button>
        </div>

        {/* Slide Duration Slider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: isStageTheme ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
            border: isStageTheme ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
            padding: '8px 20px',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: textColor, whiteSpace: 'nowrap' }}>
            ⏱️ זמן שקופית: {(slideDuration / 1000).toFixed(1)} שניות
          </span>
          <input
            type="range"
            min="2000"
            max="20000"
            step="500"
            value={slideDuration}
            onChange={(e) => setSlideDuration(parseInt(e.target.value, 10))}
            style={{
              width: '160px',
              accentColor: EVENT_CONFIG.theme.accentColor || '#0284c7',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Group Filter Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: textColor }}>
            קבוצה:
          </span>
          <select
            value={selectedGroup}
            onChange={(e) => {
              setSelectedGroup(e.target.value);
              setCurrentIndex(0);
            }}
            style={{
              background: isStageTheme ? '#1e293b' : '#ffffff',
              color: textColor,
              border: isStageTheme ? '1px solid rgba(255,255,255,0.2)' : '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <option value="all">כל הקבוצות ({items.length})</option>
            {Array.from({ length: EVENT_CONFIG.groupsCount }, (_, i) => i + 1).map((grp) => (
              <option key={grp} value={grp.toString()}>
                {EVENT_CONFIG.labels.groupOptionPrefix} {grp}
              </option>
            ))}
          </select>
        </div>
      </div>
    </main>
  );
}
