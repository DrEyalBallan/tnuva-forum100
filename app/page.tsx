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
  const [uploadedItem, setUploadedItem] = useState<{ url: string; token: string; group: string; sentence: string; commitment: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDelete = async () => {
    if (!uploadedItem) return;
    if (!confirm('האם אתם בטוחים שברצונכם למחוק את התוכן שהעליתם?')) return;

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
        alert('התוכן נמחק בהצלחה!');
      } else {
        alert('מחיקת התוכן נכשלה. אנא פנו למנהל.');
      }
    } catch (e) {
      console.error(e);
      alert('שגיאה במחיקת התוכן.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetForNewUpload = () => {
    setIsSuccess(false);
    setUploadedItem(null);
    setSentence('');
    setCommitment('');
    setErrorMessage('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMessage('');
    setIsSuccess(false);
    setProgress(0);

    const currentSentence = sentence.trim();
    const currentCommitment = commitment.trim();
    const currentGroup = group;

    try {
      const clientToken = Math.random().toString(36).slice(2, 12);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('group', currentGroup);
      formData.append('sentence', currentSentence);
      formData.append('commitment', currentCommitment);
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
      setUploadedItem({
        url: data.url,
        token: data.token || clientToken,
        group: currentGroup,
        sentence: currentSentence,
        commitment: currentCommitment,
      });
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
      <div className="upload-card animate-fade-in" dir="rtl">
        <img
          src="/logo-pisga.png"
          alt="פסגה - פורום 100"
          style={{ maxWidth: '250px', width: '100%', height: 'auto', margin: '0 auto 1.5rem auto', display: 'block' }}
        />
        <h1 className="title text-center" dir="rtl">
          פורום 100 – מודל מנהיגות
        </h1>
        <p className="subtitle text-center mb-2" dir="rtl">
          בחרו את הקבוצה שלכם, הזינו סלוגן והתחייבות לפעולה, והעלו את התמונה שיצרתם
        </p>

        {!isSuccess ? (
          <>
            {/* 1. Group Selector */}
            <div className="input-group mb-2" dir="rtl">
              <label htmlFor="group-select" className="input-label" dir="rtl">
                1. הקבוצה שלכם (1-20)
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

            {/* 2. Slogan Input (סלוגן) */}
            <div className="input-group mb-2" dir="rtl">
              <label htmlFor="sentence-input" className="input-label" dir="rtl">
                2. סלוגן (עד 80 תווים)
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

            {/* 3. Commitment to Action ("התחייבות לפעולה") */}
            <div className="input-group mb-2" dir="rtl">
              <label htmlFor="commitment-input" className="input-label" dir="rtl">
                3. התחייבות לפעולה
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

            {/* 4. Main Upload Button */}
            <button
              className="btn-primary huge-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isDeleting}
              style={{ marginTop: '0.5rem' }}
            >
              {isUploading ? (
                <div className="upload-status">
                  <span className="loader" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  <p>מעלה... {progress > 0 && `${Math.round(progress)}%`}</p>
                  {progress > 0 && (
                    <div
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        borderRadius: '4px',
                        marginTop: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: '8px',
                          backgroundColor: '#ffffff',
                          borderRadius: '4px',
                          transition: 'width 0.2s ease',
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                '🚀 4. העלאת תמונה'
              )}
            </button>
          </>
        ) : (
          /* RICH CONFIRMATION CARD ON SUCCESS */
          <div className="animate-fade-in" style={{ textAlign: 'center', marginTop: '1rem' }} dir="rtl">
            <div
              style={{
                background: '#f0fdf4',
                border: '2px solid #86efac',
                borderRadius: '18px',
                padding: '1.75rem 1.5rem',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginBottom: '0.5rem' }}>
                התוכן התקבל ושודר בהצלחה!
              </h2>
              <p style={{ color: '#166534', fontSize: '1.05rem', marginBottom: '1.25rem' }}>
                הסלוגן, ההתחייבות לפעולה והתמונה שלכם נקלטו במערכת ושודרו לכלל המסכים.
              </p>

              {/* Summary details box */}
              {uploadedItem && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                    textAlign: 'right',
                    fontSize: '0.95rem',
                    color: '#1e293b',
                    lineHeight: '1.6',
                  }}
                >
                  <div style={{ marginBottom: '0.4rem' }}>
                    <strong style={{ color: '#0052cc' }}>קבוצה:</strong> קבוצה {uploadedItem.group}
                  </div>
                  {uploadedItem.sentence && (
                    <div style={{ marginBottom: '0.4rem' }}>
                      <strong style={{ color: '#0284c7' }}>סלוגן:</strong> "{uploadedItem.sentence}"
                    </div>
                  )}
                  {uploadedItem.commitment && (
                    <div>
                      <strong style={{ color: '#7c3aed' }}>התחייבות לפעולה:</strong> {uploadedItem.commitment}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons after success */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 700 }}
                onClick={handleResetForNewUpload}
              >
                ➕ העלאת תוכן נוסף / עדכון
              </button>

              {uploadedItem && (
                <button
                  className="btn-secondary"
                  style={{
                    backgroundColor: '#fff1f2',
                    color: '#e11d48',
                    border: '1px solid #fecdd3',
                    width: '100%',
                    padding: '10px',
                    borderRadius: '12px',
                    fontWeight: 700,
                  }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'מוחק...' : '🗑️ ביטול ומחיקת התוכן שהעליתי'}
                </button>
              )}
            </div>
          </div>
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
