'use client';

import React from 'react';
import { EVENT_CONFIG } from '@/lib/eventConfig';

export default function InactiveState({ pageTitle }: { pageTitle?: string }) {
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
          maxWidth: '560px',
          width: '100%',
          textAlign: 'center',
          padding: '3rem 2.25rem',
          background: '#ffffff',
          borderRadius: '24px',
          border: '1.5px solid #e2e8f0',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
        }}
      >
        {EVENT_CONFIG.logoUrl && (
          <img
            src={EVENT_CONFIG.logoUrl}
            alt={EVENT_CONFIG.logoAlt}
            style={{
              maxWidth: '220px',
              width: '100%',
              height: 'auto',
              margin: '0 auto 1.5rem auto',
              display: 'block',
            }}
          />
        )}

        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>

        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
          {EVENT_CONFIG.eventTitle}
        </h1>

        {pageTitle && (
          <div
            style={{
              display: 'inline-block',
              background: '#f1f5f9',
              color: '#475569',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              fontWeight: 700,
              marginBottom: '1.25rem',
            }}
          >
            {pageTitle}
          </div>
        )}

        <div
          style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: '16px',
            padding: '1.5rem',
            marginTop: '0.5rem',
          }}
        >
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
            {EVENT_CONFIG.labels.inactiveNoticeTitle}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
            {EVENT_CONFIG.labels.inactiveNoticeMessage}
          </p>
        </div>
      </div>
    </main>
  );
}
