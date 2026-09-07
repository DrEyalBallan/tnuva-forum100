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

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingUrls, setDeletingUrls] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [selectedGroupToDelete, setSelectedGroupToDelete] = useState('1');
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check saved session on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? sessionStorage.getItem('admin_authenticated') : null;
    if (saved === 'true') {
      setIsAuthenticated(true);
      const savedPass = sessionStorage.getItem('admin_pass') || 'admin123';
      setPassword(savedPass);
    }
  }, []);

  // Fetch images when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchImages();
    }
  }, [isAuthenticated]);

  // Periodic polling for new images only when event is active, authenticated, and not in reorder mode
  useEffect(() => {
    if (!isAuthenticated || isReorderMode || !EVENT_CONFIG.isActive) return;
    const interval = setInterval(() => {
      fetchImages(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isReorderMode]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = password.trim();
    if (cleanPass === 'admin123' || cleanPass === 'tnuva2025' || cleanPass === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError('');
      sessionStorage.setItem('admin_authenticated', 'true');
      sessionStorage.setItem('admin_pass', cleanPass);
    } else {
      setLoginError('סיסמה שגויה. אנא נסה שוב.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    sessionStorage.removeItem('admin_pass');
    setPassword('');
  };

  const fetchImages = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/images?admin=true', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
    } catch (err) {
      console.error('Failed to fetch images', err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Toggle selection
  const toggleSelectUrl = (url: string) => {
    if (isReorderMode) return;
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  // Single delete
  const handleDeleteSingle = async (url: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק לצמיתות תמונה זו?')) return;

    setDeletingUrls((prev) => new Set(prev).add(url));
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [url], password }),
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.url !== url));
        setSelectedUrls((prev) => {
          const next = new Set(prev);
          next.delete(url);
          return next;
        });
      } else {
        const data = await res.json().catch(() => ({}));
        alert('שגיאה במחיקה: ' + (data.error || 'שגיאה לא ידועה'));
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('שגיאה במחיקת התמונה.');
    } finally {
      setDeletingUrls((prev) => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
    }
  };

  // Bulk delete selected
  const handleDeleteSelected = async () => {
    if (selectedUrls.size === 0) return;
    if (!confirm(`האם אתה בטוח שברצונך למחוק לצמיתות את ${selectedUrls.size} התמונות הנבחרות?`)) return;

    setIsBulkDeleting(true);
    const targetUrls = Array.from(selectedUrls);

    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: targetUrls, password }),
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => !targetUrls.includes(img.url)));
        setSelectedUrls(new Set());
      } else {
        const data = await res.json().catch(() => ({}));
        alert('שגיאה במחיקת הבחירה: ' + (data.error || 'שגיאה לא ידועה'));
      }
    } catch (err) {
      console.error('Delete selected error', err);
      alert('שגיאה במחיקת התמונות הנבחרות.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Bulk delete by group
  const handleDeleteGroup = async () => {
    const toDelete = selectedGroupToDelete === 'all'
      ? images
      : images.filter((img) => img.group.toString() === selectedGroupToDelete);

    if (toDelete.length === 0) {
      alert('לא נמצאו תמונות בקבוצה זו למחיקה.');
      return;
    }

    const confirmMsg = selectedGroupToDelete === 'all'
      ? `האם אתה בטוח שברצונך למחוק לצמיתות את *כל* ${toDelete.length} התמונות? לא ניתן לבטל פעולה זו!`
      : `האם אתה בטוח שברצונך למחוק לצמיתות את כל ${toDelete.length} התמונות מ${EVENT_CONFIG.labels.groupOptionPrefix} ${selectedGroupToDelete}?`;

    if (!confirm(confirmMsg)) return;

    setIsBulkDeleting(true);
    const targetUrls = toDelete.map((img) => img.url);

    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: targetUrls, password }),
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => !targetUrls.includes(img.url)));
        setSelectedUrls(new Set());
      } else {
        const data = await res.json().catch(() => ({}));
        alert('שגיאה במחיקת קבוצה: ' + (data.error || 'שגיאה לא ידועה'));
      }
    } catch (err) {
      console.error('Delete group error', err);
      alert('שגיאה במחיקת הקבוצה.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Bulk upload files from local PC
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsBulkUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('group', '0'); // Group 0 for general bulk uploads
      formData.append('sentence', '');
      formData.append('commitment', '');

      try {
        await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
      } catch (err) {
        console.error('Bulk upload item failed:', err);
      }
      setUploadProgress({ current: i + 1, total: files.length });
    }

    setIsBulkUploading(false);
    fetchImages();
    if (fileInputRef.current) fileInputRef.current.value = '';
    alert('העלאה מרוכזת הסתיימה בהצלחה!');
  };

  // Reorder functions
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newItems = [...images];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    setImages(newItems);
  };

  const moveToExtreme = (index: number, position: 'top' | 'bottom') => {
    const newItems = [...images];
    const [moved] = newItems.splice(index, 1);
    if (position === 'top') {
      newItems.unshift(moved);
    } else {
      newItems.push(moved);
    }
    setImages(newItems);
  };

  const jumpToPosition = (index: number) => {
    const targetStr = prompt(`הזן מיקום חדש לתמונה זו (1 עד ${images.length}):`, `${index + 1}`);
    if (!targetStr) return;
    const pos = parseInt(targetStr, 10);
    if (isNaN(pos) || pos < 1 || pos > images.length) {
      alert(`אנא הזן מספר תקין בין 1 ל-${images.length}`);
      return;
    }
    const newItems = [...images];
    const [removed] = newItems.splice(index, 1);
    newItems.splice(pos - 1, 0, removed);
    setImages(newItems);
  };

  // Save new order to backend
  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    const orderUrls = images.map((img) => img.url);
    try {
      const res = await fetch('/api/admin/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderUrls, password }),
      });

      if (res.ok) {
        setIsReorderMode(false);
        alert('סדר התמונות נשמר בהצלחה!');
      } else {
        const data = await res.json();
        alert('שגיאה בשמירת הסדר: ' + (data.error || 'שגיאה לא ידועה'));
      }
    } catch (err) {
      console.error('Save order error', err);
      alert('שגיאה בשמירת הסדר.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Download offline single-file HTML slideshow
  const handleDownloadOffline = async (mode: 'all' | 'images' | 'commitments' | 'rapper' = 'all') => {
    try {
      const res = await fetch(`/api/admin/export-offline?mode=${mode}`);
      if (!res.ok) throw new Error('הורדת המצגת נכשלה');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const cleanCompanyName = (EVENT_CONFIG.companyName || 'event').replace(/[^a-zA-Z0-9א-ת_-]/g, '_');
      const filenames: Record<string, string> = {
        images: `מצגת-תמונות-אופליין-${cleanCompanyName}.html`,
        commitments: `מצגת-התחייבויות-אופליין-${cleanCompanyName}.html`,
        rapper: `מצגת-סלוגנים-לראפר-אופליין-${cleanCompanyName}.html`,
        all: `מצגת-אירוע-משולבת-אופליין-${cleanCompanyName}.html`,
      };
      a.download = filenames[mode] || `מצגת-אופליין-${cleanCompanyName}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('שגיאה בהורדת המצגת: ' + (e?.message || e));
    }
  };

  // 1. Password Gate Screen
  if (!isAuthenticated) {
    return (
      <main
        className="container"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
        }}
        dir="rtl"
      >
        <div
          className="glass-panel animate-fade-in"
          style={{
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            padding: '2.5rem 2rem',
            background: '#ffffff',
            borderRadius: '24px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔐</div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
            כניסה לפאנל ניהול
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            גישת מנהל בלבד לצפייה בנתונים, הורדת גיבויים וניהול
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="הזן סיסמת מנהל..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="modern-input"
              style={{ textAlign: 'center', marginBottom: '1rem' }}
              autoFocus
            />

            {loginError && (
              <div style={{ color: '#e11d48', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>
                ❌ {loginError}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 700 }}
            >
              כניסה לפאנל
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 2. Authenticated Dashboard Screen
  return (
    <div className="admin-container">
      <div className="dashboard">
        {/* Event Status & Configuration Banner */}
        <div
          dir="rtl"
          style={{
            background: EVENT_CONFIG.isActive ? '#f0fdf4' : '#fef2f2',
            border: `2px solid ${EVENT_CONFIG.isActive ? '#86efac' : '#fca5a5'}`,
            borderRadius: '16px',
            padding: '1.25rem 1.5rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.5rem' }}>{EVENT_CONFIG.isActive ? '🟢' : '🔒'}</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: EVENT_CONFIG.isActive ? '#15803d' : '#b91c1c', margin: 0 }}>
                מצב מערכת ציבורית: {EVENT_CONFIG.isActive ? 'פעיל בלייב (העלאות פתוחות)' : 'ארכיון / מושבת (0 צריכת טוקנים ורוחב פס)'}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569' }}>
              <strong>מותג / חברה:</strong> {EVENT_CONFIG.companyName} | <strong>כותרת אירוע:</strong> {EVENT_CONFIG.eventTitle} | <strong>קבוצות:</strong> {EVENT_CONFIG.groupsCount}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', background: '#ffffff', padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              ✏️ שינוי מיתוג / הפעלה בקובץ: <code>lib/eventConfig.ts</code>
            </div>
            <button
              onClick={handleLogout}
              className="logout-button"
              style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}
            >
              🚪 התנתקות
            </button>
          </div>
        </div>

        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h1 dir="rtl">{EVENT_CONFIG.navLinks.adminLabel}</h1>
          <div dir="rtl" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleBulkUpload}
            />
            {EVENT_CONFIG.isActive && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="save-order-button"
                disabled={isBulkUploading}
                style={{ background: '#7c3aed', padding: '9px 18px', borderRadius: '10px' }}
              >
                {isBulkUploading ? `מעלה ${uploadProgress.current}/${uploadProgress.total}...` : '📤 העלאה מרוכזת'}
              </button>
            )}

            {isReorderMode ? (
              <button
                onClick={handleSaveOrder}
                className="save-order-button"
                disabled={isSavingOrder}
                style={{ background: '#16a34a', padding: '9px 18px', borderRadius: '10px' }}
              >
                {isSavingOrder ? 'שומר...' : '💾 שמירת סדר חדש'}
              </button>
            ) : (
              <button
                onClick={() => setIsReorderMode(true)}
                className="save-order-button"
                style={{ background: '#0284c7', padding: '9px 18px', borderRadius: '10px' }}
              >
                🔄 מצב סידור מחדש
              </button>
            )}
          </div>
        </div>

        {/* Offline HTML Standalone Slideshow Export Section */}
        <div
          dir="rtl"
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #ede9fe 100%)',
            border: '2px solid #818cf8',
            borderRadius: '16px',
            padding: '1.3rem 1.6rem',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.12)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1e1b4b', margin: 0 }}>
                ⭐ מצגות אופליין עצמאיות (HTML - ללא תקלות PowerPoint)
              </h3>
              <span style={{ background: '#22c55e', color: '#ffffff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '12px' }}>
                100% אופליין
              </span>
            </div>
            <p style={{ fontSize: '0.92rem', color: '#4338ca', margin: 0 }}>
              נפתח מיידית בדפדפן (Chrome / Edge / Safari) בדאבל-קליק. כולל מסך מלא 16:9, ללא שום עיוות/חיתוך תמונות וללא שום בעיות פונטים.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleDownloadOffline('images')}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
              }}
            >
              🖼️ תמונות (HTML)
            </button>

            <button
              onClick={() => handleDownloadOffline('commitments')}
              style={{
                background: '#7c3aed',
                color: '#ffffff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)',
              }}
            >
              🤝 התחייבויות (HTML)
            </button>

            <button
              onClick={() => handleDownloadOffline('rapper')}
              style={{
                background: '#0052cc',
                color: '#ffffff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0, 82, 204, 0.25)',
              }}
            >
              🎤 סלוגנים לראפר (HTML)
            </button>

            <button
              onClick={() => handleDownloadOffline('all')}
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
              }}
            >
              🚀 מצגת משולבת (3 ב-1)
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {!isReorderMode && images.length > 0 && (
          <div className="bulk-actions-bar" dir="rtl">
            {/* Delete entire group */}
            <div className="bulk-group-delete">
              <span>מחק קבוצה שלמה:</span>
              <select
                value={selectedGroupToDelete}
                onChange={(e) => setSelectedGroupToDelete(e.target.value)}
              >
                {Array.from({ length: EVENT_CONFIG.groupsCount }, (_, i) => i + 1).map((grp) => (
                  <option key={grp} value={grp.toString()}>
                    {EVENT_CONFIG.labels.groupOptionPrefix} {grp}
                  </option>
                ))}
                <option value="all">כל הקבוצות (מחק הכל)</option>
              </select>
              <button
                className="bulk-delete-button"
                onClick={handleDeleteGroup}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? 'מוחק...' : 'מחק קבוצה'}
              </button>
            </div>

            {/* Selected items actions */}
            {selectedUrls.size > 0 && (
              <div className="selected-actions">
                <span>{selectedUrls.size} נבחרו</span>
                <button
                  className="bulk-delete-button"
                  onClick={handleDeleteSelected}
                  disabled={isBulkDeleting}
                >
                  {isBulkDeleting ? 'מוחק...' : 'מחק בחירה'}
                </button>
                <button
                  className="logout-button"
                  style={{ marginRight: '10px' }}
                  onClick={() => setSelectedUrls(new Set())}
                >
                  נקה בחירה
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content list / grid */}
        {isLoading ? (
          <p dir="rtl">טוען תמונות...</p>
        ) : images.length === 0 ? (
          <p dir="rtl">טרם הועלו תמונות.</p>
        ) : (
          <div className="images-grid">
            {images.map((item, index) => {
              const isSelected = selectedUrls.has(item.url);
              const isVideo = item.url.match(/\.(mp4|webm|ogg|mov)$/i);

              return (
                <div
                  key={item.url}
                  className={`image-card ${isSelected ? 'selected' : ''} ${isReorderMode ? 'reorder-active' : ''}`}
                  draggable={isReorderMode}
                  onDragStart={(e) => {
                    if (isReorderMode) {
                      setDraggedIndex(index);
                      e.dataTransfer.effectAllowed = 'move';
                      setTimeout(() => {
                        if (e.target instanceof HTMLElement) {
                          e.target.style.opacity = '0.5';
                        }
                      }, 0);
                    }
                  }}
                  onDragOver={(e) => {
                    if (isReorderMode) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }
                  }}
                  onDrop={(e) => {
                    if (!isReorderMode || draggedIndex === null || draggedIndex === index) return;
                    e.preventDefault();
                    const newItems = [...images];
                    const [removed] = newItems.splice(draggedIndex, 1);
                    newItems.splice(index, 0, removed);
                    setImages(newItems);
                    setDraggedIndex(null);
                  }}
                  onDragEnd={(e) => {
                    if (isReorderMode) {
                      setDraggedIndex(null);
                      if (e.target instanceof HTMLElement) {
                        e.target.style.opacity = '1';
                      }
                    }
                  }}
                >
                  {/* Select Checkbox */}
                  {!isReorderMode && (
                    <input
                      type="checkbox"
                      className="image-checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectUrl(item.url)}
                    />
                  )}

                  {/* Media Preview & Index Badge */}
                  <div className="image-preview">
                    {isReorderMode && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'rgba(0,0,0,0.8)',
                          color: '#fff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          zIndex: 10,
                        }}
                      >
                        #{index + 1}
                      </div>
                    )}
                    {isVideo ? (
                      <video
                        src={item.url}
                        muted
                        playsInline
                        onClick={() => toggleSelectUrl(item.url)}
                        style={{ cursor: isReorderMode ? 'default' : 'pointer' }}
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt="Uploaded preview"
                        loading="lazy"
                        onClick={() => toggleSelectUrl(item.url)}
                        style={{ cursor: isReorderMode ? 'default' : 'pointer' }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="image-info" dir="rtl">
                    <div className="image-group">
                      {item.group === 0 ? 'העלאה מרוכזת' : `${EVENT_CONFIG.labels.groupOptionPrefix} ${item.group}`}
                    </div>

                    <div className="image-text">
                      {item.sentence || <span style={{ opacity: 0.5 }}>ללא סלוגן</span>}
                    </div>

                    {item.commitment && (
                      <div className="image-commitment">
                        <strong>התחייבות לפעולה:</strong> {item.commitment}
                      </div>
                    )}

                    {/* Reorder Buttons / Delete Button */}
                    {isReorderMode ? (
                      <div>
                        <div className="reorder-controls">
                          <button
                            className="reorder-button"
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            title="Move Up"
                          >
                            ⬆️ למעלה
                          </button>
                          <button
                            className="reorder-button"
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === images.length - 1}
                            title="Move Down"
                          >
                            ⬇️ למטה
                          </button>
                        </div>
                        <div className="reorder-controls">
                          <button
                            className="reorder-button"
                            onClick={() => moveToExtreme(index, 'top')}
                            disabled={index === 0}
                            title="Move to Top"
                          >
                            ⤒ להתחלה
                          </button>
                          <button
                            className="reorder-button"
                            onClick={() => moveToExtreme(index, 'bottom')}
                            disabled={index === images.length - 1}
                            title="Move to Bottom"
                          >
                            ⤓ לסוף
                          </button>
                        </div>
                        <div className="reorder-controls">
                          <button
                            className="reorder-button"
                            onClick={() => jumpToPosition(index)}
                            title="Move to Exact Position"
                          >
                            🔢 מיקום מדויק
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="delete-button"
                        onClick={() => handleDeleteSingle(item.url)}
                        disabled={deletingUrls.has(item.url)}
                      >
                        {deletingUrls.has(item.url) ? 'מוחק...' : 'מחק תמונה'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
