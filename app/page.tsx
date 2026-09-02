'use client';

import React, { useState, useRef } from 'react';

export default function UserUploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [group, setGroup] = useState('1');
  const [sentence, setSentence] = useState('');
  const [commitment, setCommitment] = useState('');
  const [uploadedItem, setUploadedItem] = useState<{ url: string; token: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = async () => {
    if (!uploadedItem) return;
    if (!confirm('האם אתם בטוחים שברצונכם למחוק את התמונה שהעליתם?')) return;

    setIsDeleting(true);
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uploadedItem.url, token: uploadedItem.token }),
      });

      if (res.ok) {
        setIsSuccess(false);
        setUploadedItem(null);
        alert('התמונה נמחקה בהצלחה!');
      } else {
        alert('מחיקת התמונה נכשלה. אנא פנו למנהל.');
      }
    } catch (e) {
      console.error(e);
      alert('שגיאה במחיקת התמונה.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage('');
    setIsSuccess(false);
    setProgress(0);

    try {
      const clientToken = Math.random().toString(36).slice(2, 12);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('group', group);
      formData.append('sentence', sentence.trim());
      formData.append('commitment', commitment.trim());
      formData.append('token', clientToken);

      // Simulated smooth progress while uploading
      setProgress(15);
      const progressTimer = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + Math.floor(Math.random() * 15 + 5) : prev));
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'ההעלאה נכשלה (שגיאת שרת)');
      }

      const data = await response.json();
      setProgress(100);
      setUploadedItem({ url: data.url, token: data.token || clientToken });
      setIsSuccess(true);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const msg = err?.message || 'ההעלאה נכשלה. אנא נסו שוב.';
      setErrorMessage(msg);
      console.error('Upload failed:', err);
      fetch('/api/log', {
        method: 'POST',
        body: err?.stack || msg,
      }).catch(() => {});
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="container upload-page">
      <div className="glass-panel animate-fade-in upload-card" dir="rtl">
        <img
          src="/logo-pisga.png"
          alt="פסגה - פורום 100"
          style={{ maxWidth: '240px', width: '100%', height: 'auto', margin: '0 auto 1.5rem auto', display: 'block' }}
        />
        <h1 className="title text-center" dir="rtl">
          פורום 100 – מודל מנהיגות
        </h1>
        <p className="subtitle text-center mb-2" dir="rtl">
          בחרו את הקבוצה שלכם, העלו את התמונה, הסלוגן וההתחייבות לפעולה שיצרתם
        </p>

        {/* Group Selector */}
        <div className="input-group mb-2" dir="rtl">
          <label htmlFor="group-select" className="input-label" dir="rtl">
            הקבוצה שלכם (1-20)
          </label>
          <select
            id="group-select"
            className="modern-input"
            dir="rtl"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            disabled={isUploading}
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num.toString()}>
                קבוצה {num}
              </option>
            ))}
          </select>
        </div>

        {/* Slogan Input (סלוגן) */}
        <div className="input-group mb-2" dir="rtl">
          <label htmlFor="sentence-input" className="input-label" dir="rtl">
            סלוגן (עד 80 תווים)
          </label>
          <input
            id="sentence-input"
            type="text"
            className="modern-input"
            placeholder="הקלידו כאן סלוגן..."
            maxLength={80}
            dir="rtl"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            disabled={isUploading}
          />
        </div>

        {/* Commitment to Action ("התחייבות לפעולה") */}
        <div className="input-group mb-2" dir="rtl">
          <label htmlFor="commitment-input" className="input-label" dir="rtl">
            התחייבות לפעולה
          </label>
          <textarea
            id="commitment-input"
            className="modern-input"
            placeholder="הקלידו כאן את ההתחייבות לפעולה..."
            maxLength={160}
            rows={2}
            dir="rtl"
            value={commitment}
            onChange={(e) => setCommitment(e.target.value)}
            disabled={isUploading}
          />
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* Main Upload Button */}
        {!isSuccess && (
          <button
            className="btn-primary huge-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
          >
            {isUploading ? (
              <div className="upload-status">
                <span className="loader" />
                <p>מעלה... {progress > 0 && `${Math.round(progress)}%`}</p>
                {progress > 0 && (
                  <div
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      marginTop: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: '8px',
                        backgroundColor: '#38bdf8',
                        borderRadius: '4px',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              '🚀 העלאת תמונה'
            )}
          </button>
        )}

        {/* Success message */}
        {isSuccess && (
          <div className="success-msg animate-fade-in mt-1" dir="rtl">
            ✨ התמונה והמשפט התקבלו בהצלחה.
          </div>
        )}

        {/* Self Delete Button */}
        {isSuccess && uploadedItem && (
          <button
            className="btn-secondary mt-1 animate-fade-in"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              border: '1px solid #ef4444',
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginTop: '1rem',
            }}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'מוחק...' : '🗑️ ביטול ומחיקת התמונה שלי'}
          </button>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="error-msg animate-fade-in mt-1" dir="rtl">
            ❌ {errorMessage}
          </div>
        )}
      </div>
    </main>
  );
}
