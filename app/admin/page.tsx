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

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  // Check saved session password
  useEffect(() => {
    const savedPass = sessionStorage.getItem('admin_pass');
    if (savedPass) {
      setPassword(savedPass);
      setIsAuthenticated(true);
      fetchImages(savedPass);
    }
  }, []);

  // Periodic polling for new images when authenticated and not in reorder mode
  useEffect(() => {
    if (!isAuthenticated || !password || isReorderMode) return;
    const interval = setInterval(() => {
      fetchImages(password, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, password, isReorderMode]);

  const fetchImages = async (pass: string, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch('/api/images', { cache: 'no-store' });
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setIsAuthenticated(true);
    sessionStorage.setItem('admin_pass', password);
    fetchImages(password);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_pass');
    setPassword('');
    setIsAuthenticated(false);
    setImages([]);
    setSelectedUrls(new Set());
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
      } else if (res.status === 401) {
        alert('אין הרשאה! סיסמה שגויה.');
        handleLogout();
      } else {
        const data = await res.json();
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
      } else if (res.status === 401) {
        alert('אין הרשאה! סיסמה שגויה.');
        handleLogout();
      } else {
        const data = await res.json();
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
      : `האם אתה בטוח שברצונך למחוק לצמיתות את כל ${toDelete.length} התמונות מקבוצה ${selectedGroupToDelete}?`;

    if (!confirm(confirmMsg)) return;

    setIsBulkDeleting(true);
    const urls = toDelete.map((img) => img.url);

    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, password }),
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => !urls.includes(img.url)));
        setSelectedUrls(new Set());
      } else if (res.status === 401) {
        alert('אין הרשאה! סיסמה שגויה.');
        handleLogout();
      } else {
        const data = await res.json();
        alert('שגיאה במחיקה קבוצתית: ' + (data.error || 'שגיאה לא ידועה'));
      }
    } catch (err) {
      console.error('Bulk delete error', err);
      alert('שגיאה במחיקת תמונות.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Bulk upload
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsBulkUploading(true);
    setUploadProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('group', '0');
        formData.append('sentence', '');
        formData.append('commitment', '');

        await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        setUploadProgress({ current: i + 1, total: files.length });
      } catch (err) {
        console.error('Failed to upload file:', file.name, err);
      }
    }

    setIsBulkUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fetchImages(password);
  };

  // Reordering helpers
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...images];
    if (direction === 'up' && index > 0) {
      const temp = newItems[index - 1];
      newItems[index - 1] = newItems[index];
      newItems[index] = temp;
    } else if (direction === 'down' && index < newItems.length - 1) {
      const temp = newItems[index + 1];
      newItems[index + 1] = newItems[index];
      newItems[index] = temp;
    }
    setImages(newItems);
  };

  const moveToExtreme = (index: number, position: 'top' | 'bottom') => {
    const newItems = [...images];
    const [removed] = newItems.splice(index, 1);
    if (position === 'top') {
      newItems.unshift(removed);
    } else {
      newItems.push(removed);
    }
    setImages(newItems);
  };

  const jumpToPosition = (index: number) => {
    const target = prompt(`העבר תמונה ממיקום ${index + 1} אל (1 - ${images.length}):`);
    if (!target) return;
    const pos = parseInt(target, 10);
    if (isNaN(pos) || pos < 1 || pos > images.length) {
      alert('מספר מיקום לא חוקי.');
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

  // Not authenticated view
  if (!isAuthenticated) {
    return (
      <div className="admin-container">
        <div className="login-container">
          <h1 dir="rtl">גישת מנהל</h1>
          <form onSubmit={handleLogin} dir="rtl">
            <input
              type="password"
              placeholder="הזן סיסמת מנהל (ברירת מחדל: tnuva2025)"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <button type="submit" className="login-button">
              התחבר
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="admin-container">
      <div className="dashboard">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <h1 dir="rtl">פאנל ניהול אירוע</h1>
          <div dir="rtl" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleBulkUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="save-order-button"
              disabled={isBulkUploading}
              style={{ background: '#8b5cf6' }}
            >
              {isBulkUploading ? `מעלה ${uploadProgress.current}/${uploadProgress.total}...` : '📤 העלאה מרוכזת'}
            </button>

            {isReorderMode ? (
              <button
                onClick={handleSaveOrder}
                className="save-order-button"
                disabled={isSavingOrder}
              >
                {isSavingOrder ? 'שומר...' : '💾 שמירת סדר חדש'}
              </button>
            ) : (
              <button
                onClick={() => setIsReorderMode(true)}
                className="save-order-button"
                style={{ background: '#3b82f6' }}
              >
                🔄 מצב סידור מחדש
              </button>
            )}

            <a
              href="/rapper"
              className="logout-button"
              style={{ textDecoration: 'none', background: 'rgba(2, 132, 199, 0.25)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
            >
              🎤 עמוד ראפר
            </a>

            <a
              href="/commitments"
              className="logout-button"
              style={{ textDecoration: 'none', background: 'rgba(139, 92, 246, 0.25)', color: '#c084fc', borderColor: 'rgba(192, 132, 252, 0.4)' }}
            >
              📜 לוח התחייבויות
            </a>

            <button onClick={handleLogout} className="logout-button">
              התנתק
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
                {Array.from({ length: 20 }, (_, i) => i + 1).map((grp) => (
                  <option key={grp} value={grp.toString()}>
                    קבוצה {grp}
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
                  <div style={{ position: 'relative' }}>
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
                      {item.group === 0 ? 'העלאה מרוכזת' : `קבוצה ${item.group}`}
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
