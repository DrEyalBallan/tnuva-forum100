'use client';

import React, { useState, useEffect, useRef } from 'react';
import { EVENT_CONFIG } from '@/lib/eventConfig';
import InactiveState from '@/components/InactiveState';

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

  // If event is inactive / shut off, render inactive screen with zero links and no running stream
  if (!EVENT_CONFIG.isActive) {
    return <InactiveState pageTitle="מסך הקרנה בלייב" />;
  }

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
    if (!EVENT_CONFIG.isActive) return;
    fetchImages();
    if (isPlaying) {
      const interval = setInterval(fetchImages, 3000);
      return () => clearInterval(interval);
    }
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

  // Escape key to exit playback
  useEffect(() => {
    if (!isPlaying) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlaying(false);
        setSelectedGroup('all');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Setup Hub Screen (3D Hub)
  if (!isPlaying) {
    return (
      <main className="stream-container setup-screen hub-3d">
        <div className="hub-container">
          {EVENT_CONFIG.logoUrl && (
            <img
              src={EVENT_CONFIG.logoUrl}
              alt={EVENT_CONFIG.logoAlt}
              style={{ maxWidth: '240px', width: '100%', height: 'auto', margin: '0 auto 1.5rem auto', display: 'block' }}
            />
          )}
          <h1 className="hub-title" dir="rtl">
            {EVENT_CONFIG.navLinks.streamLabel}
          </h1>
          <p className="hub-subtitle" dir="rtl">
            {EVENT_CONFIG.eventTitle} | בחרו זרם להצגת התמונות
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
                <p dir="rtl">זרם גלובלי ({allImages.length} תמונות)</p>
              </div>
            </div>

            {/* Individual Group Cards (1-N) */}
            {Array.from({ length: EVENT_CONFIG.groupsCount }, (_, i) => i + 1).map((grp) => {
              const grpCount = allImages.filter((img) => img.group === grp).length;
              return (
                <div
                  key={grp}
                  className="stream-card group-card"
                  onClick={() => {
                    setSelectedGroup(grp.toString());
                    setIsPlaying(true);
                  }}
                >
                  <div className="card-content">
                    <h2 dir="rtl">{EVENT_CONFIG.labels.groupOptionPrefix} {grp}</h2>
                    <p dir="rtl">{grpCount > 0 ? `${grpCount} תמונות` : 'זרם מקומי'}</p>
                  </div>
                </div>
              );
            })}
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
        className="back-to-hub-btn"
        onClick={() => {
          setIsPlaying(false);
          setSelectedGroup('all');
        }}
        title="חזרה לפאנל ניהול הקרנה (ESC)"
      >
        <span>← חזרה לפאנל הקרנה</span>
      </button>

      {filteredImages.length === 0 ? (
        <div className="empty-state">
          <h2 dir="rtl">
            ממתין לתמונות עבור {selectedGroup === 'all' ? 'כל הקבוצות' : `${EVENT_CONFIG.labels.groupOptionPrefix} ${selectedGroup}`}...
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
