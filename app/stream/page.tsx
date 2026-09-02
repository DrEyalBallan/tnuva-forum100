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

export default function StreamPage() {
  const [allImages, setAllImages] = useState<ImageItem[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [slideDuration, setSlideDuration] = useState(4000); // 4 seconds default
  const previousImagesRef = useRef<ImageItem[]>([]);

  // Fetch images from API
  const fetchImages = async () => {
    try {
      const res = await fetch('/api/images', { cache: 'no-store' });
      const data = await res.json();
      if (data.images && JSON.stringify(data.images) !== JSON.stringify(previousImagesRef.current)) {
        previousImagesRef.current = data.images;
        setAllImages(data.images);
      }
    } catch (err) {
      console.error('Failed to fetch images:', err);
    }
  };

  // Poll for new images when playing
  useEffect(() => {
    if (!isPlaying) return;
    fetchImages();
    const interval = setInterval(fetchImages, 3000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Filter images whenever allImages or selectedGroup changes
  useEffect(() => {
    if (selectedGroup === 'all') {
      setFilteredImages(allImages);
    } else {
      const grpNum = parseInt(selectedGroup, 10);
      setFilteredImages(allImages.filter((img) => img.group === grpNum));
    }
  }, [allImages, selectedGroup]);

  // Slideshow transition timer
  useEffect(() => {
    if (!isPlaying || filteredImages.length === 0) return;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredImages.length);
    }, slideDuration);
    return () => clearTimeout(timer);
  }, [isPlaying, filteredImages, currentIndex, slideDuration]);

  // Setup Hub Screen (3D Hub)
  if (!isPlaying) {
    return (
      <main className="stream-container setup-screen hub-3d">
        <div className="hub-container">
          <h1 className="hub-title" dir="rtl">
            פאנל ניהול הקרנה
          </h1>
          <p className="hub-subtitle" dir="rtl">
            בחר זרם להצגת התמונות בלייב
          </p>

          {/* Slide Duration Control */}
          <div className="duration-control" dir="rtl">
            <label>
              משך תצוגה לכל תמונה: {slideDuration / 1000} שניות
            </label>
            <input
              type="range"
              min="1000"
              max="20000"
              step="500"
              value={slideDuration}
              onChange={(e) => setSlideDuration(parseInt(e.target.value, 10))}
            />
          </div>

          {/* Links to Rapper & Commitments Boards */}
          <div style={{ margin: '0.5rem auto 2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/rapper"
              className="save-order-button"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                padding: '12px 24px',
                fontSize: '1.05rem',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
              }}
            >
              🎤 עמוד סלוגנים לראפר
            </a>
            <a
              href="/commitments"
              className="save-order-button"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                padding: '12px 24px',
                fontSize: '1.05rem',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
              }}
            >
              📜 לוח התחייבויות לפעולה
            </a>
          </div>

          {/* 3D Stream Grid */}
          <div className="stream-grid">
            {/* Global All-Groups Card */}
            <div
              className="stream-card all-card"
              onClick={() => {
                setSelectedGroup('all');
                setIsPlaying(true);
              }}
            >
              <div className="card-content">
                <h2 dir="rtl">כל הקבוצות</h2>
                <p dir="rtl">זרם גלובלי</p>
              </div>
            </div>

            {/* Individual Group Cards (1-20) */}
            {Array.from({ length: 20 }, (_, i) => i + 1).map((grp) => (
              <div
                key={grp}
                className="stream-card group-card"
                onClick={() => {
                  setSelectedGroup(grp.toString());
                  setIsPlaying(true);
                }}
              >
                <div className="card-content">
                  <h2 dir="rtl">קבוצה {grp}</h2>
                  <p dir="rtl">זרם מקומי</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Active Slideshow Projection View
  const activeItem = filteredImages.length > 0 ? filteredImages[currentIndex % filteredImages.length] : null;
  const isVideo = activeItem?.url?.match(/\.(mp4|webm|ogg|mov)$/i);

  return (
    <main className="stream-container">
      {/* Back button to return to hub */}
      <button
        className="back-button"
        onClick={() => {
          setIsPlaying(false);
          setSelectedGroup('all');
        }}
        style={{ zIndex: 1000 }}
      >
        ← חזרה לראשי
      </button>

      {filteredImages.length === 0 ? (
        <div className="empty-state">
          <h2 dir="rtl">
            ממתין לתמונות עבור {selectedGroup === 'all' ? 'כל הקבוצות' : `קבוצה ${selectedGroup}`}...
          </h2>
          <div className="loader" style={{ width: '48px', height: '48px', marginTop: '1.5rem', margin: '1.5rem auto 0' }} />
        </div>
      ) : (
        <div className="image-roller">
          <div className="image-wrapper animate-fade-in-slow" key={currentIndex}>
            {isVideo ? (
              <video
                src={activeItem?.url}
                autoPlay
                muted
                loop
                playsInline
                className="vj-video"
              />
            ) : (
              <img
                src={activeItem?.url}
                alt="הקרנת תמונה"
                className="vj-image"
                loading="eager"
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
