import { NextRequest, NextResponse } from 'next/server';
import { getGalleryItems } from '@/lib/storage';
import { EVENT_CONFIG } from '@/lib/eventConfig';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'all'; // 'all' | 'images' | 'commitments' | 'rapper'
    const embedImages = searchParams.get('embed') !== 'false'; // Default to TRUE for 100% offline playback

    const rawItems = await getGalleryItems();

    // Prepare items with clean data & embed base64 images so it works completely offline
    const items = await Promise.all(
      rawItems.map(async (item) => {
        let finalUrl = item.url;
        let base64Data: string | null = null;

        if (embedImages && item.url && !item.url.match(/\.(mp4|webm|ogg|mov)$/i)) {
          try {
            const res = await fetch(item.url, { cache: 'no-store' });
            if (res.ok) {
              const buf = await res.arrayBuffer();
              const b64 = Buffer.from(buf).toString('base64');
              const contentType = res.headers.get('content-type') || 'image/jpeg';
              base64Data = `data:${contentType};base64,${b64}`;
            }
          } catch (e) {
            console.warn('Could not embed base64 image:', e);
          }
        }

        return {
          id: item.id,
          url: base64Data || finalUrl,
          group: item.group,
          sentence: item.sentence || '',
          commitment: item.commitment || '',
          time: item.time,
        };
      })
    );

    const itemsJson = JSON.stringify(items);

    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${EVENT_CONFIG.eventTitle} – ${EVENT_CONFIG.companyName} (Offline Player)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body, html {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: 'Rubik', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0b1329;
      color: #ffffff;
      user-select: none;
      -webkit-user-select: none;
    }

    #app {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    /* Top Controls Bar */
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      background: linear-gradient(180deg, rgba(11, 19, 41, 0.95) 0%, rgba(11, 19, 41, 0) 100%);
      transition: opacity 0.35s ease;
      opacity: 1;
    }
    .top-bar.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .brand-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-title h1 {
      font-size: 1.2rem;
      font-weight: 800;
      color: #ffffff;
    }
    .brand-title span {
      font-size: 0.85rem;
      color: #38bdf8;
      font-weight: 600;
    }

    .mode-selector {
      display: flex;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 4px;
      gap: 4px;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .mode-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s ease;
    }
    .mode-btn.active {
      background: #0284c7;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
    }

    .top-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .action-btn {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .action-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Main Slide Stage */
    .stage {
      flex: 1;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    /* 1. Images Slide Stage */
    .image-slide-container {
      width: 100vw;
      height: 100vh;
      background: #000000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stage-image, .stage-video {
      max-width: 100vw;
      max-height: 100vh;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    /* 2. Text Slide Stage (Commitments / Rapper) */
    .text-slide-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 5rem 3rem 6rem;
    }
    .text-card {
      background: #ffffff;
      color: #0f172a;
      border-radius: 24px;
      padding: 3.5rem 4rem;
      max-width: 1350px;
      width: 100%;
      min-height: 520px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
      border: 1.5px solid #e2e8f0;
      animation: fadeIn 0.3s ease;
    }
    .group-pill {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #cbd5e1;
      padding: 6px 20px;
      border-radius: 20px;
      font-size: 1.25rem;
      font-weight: 800;
      margin-bottom: 2rem;
      display: inline-block;
    }
    .quote-content {
      font-weight: 800;
      line-height: 1.35;
      color: #0f172a;
      max-width: 1100px;
      word-break: break-word;
    }
    .slogan-secondary {
      margin-top: 2rem;
      font-size: 1.3rem;
      color: #0284c7;
      font-weight: 700;
      background: #f0f9ff;
      padding: 10px 24px;
      border-radius: 12px;
      border: 1px solid #bae6fd;
    }

    /* Bottom Control Bar */
    .bottom-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1.2rem 2.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
      background: linear-gradient(0deg, rgba(11, 19, 41, 0.98) 0%, rgba(11, 19, 41, 0) 100%);
      transition: opacity 0.35s ease;
      opacity: 1;
    }
    .bottom-bar.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .playback-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .play-btn {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 8px 20px;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
    }
    .nav-btn {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #ffffff;
      width: 42px;
      height: 42px;
      border-radius: 10px;
      font-size: 1.2rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .slider-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 18px;
      border-radius: 14px;
      font-size: 0.95rem;
      font-weight: 700;
    }
    .slider-box input {
      cursor: pointer;
      accent-color: #0284c7;
      width: 140px;
    }

    .slide-counter {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
      padding: 6px 16px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.95rem;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
  </style>
</head>
<body>
  <div id="app">
    <!-- Top Bar -->
    <div class="top-bar" id="topBar">
      <div class="brand-title">
        <div>
          <h1>פורום 100 – מודל מנהיגות</h1>
          <span>מצגת הקרנה אופליין (ללא צורך באינטרנט)</span>
        </div>
      </div>

      <!-- Mode Selector -->
      <div class="mode-selector">
        <button class="mode-btn active" id="btnImages" onclick="setMode('images')">📸 תמונות 16:9 נקי</button>
        <button class="mode-btn" id="btnCommitments" onclick="setMode('commitments')">🤝 התחייבויות לפעולה</button>
        <button class="mode-btn" id="btnRapper" onclick="setMode('rapper')">🎤 סלוגנים לראפר</button>
      </div>

      <!-- Actions -->
      <div class="top-actions">
        <button class="action-btn" onclick="toggleFullscreen()">⛶ מסך מלא (F11)</button>
      </div>
    </div>

    <!-- Main Stage Content -->
    <div class="stage" id="stage">
      <!-- Injected by JavaScript -->
    </div>

    <!-- Bottom Bar -->
    <div class="bottom-bar" id="bottomBar">
      <div class="playback-controls">
        <button class="nav-btn" onclick="prevSlide()" title="שקופית קודמת (חץ ימינה)">⏭️</button>
        <button class="play-btn" id="playPauseBtn" onclick="togglePlay()">⏸️ השהה (Space)</button>
        <button class="nav-btn" onclick="nextSlide()" title="שקופית הבאה (חץ שמאלה)">⏮️</button>
      </div>

      <div class="slider-box">
        <span id="durationLabel">⏱️ זמן שקופית: 5 שניות</span>
        <input type="range" id="durationSlider" min="2" max="20" step="1" value="5" oninput="updateDuration(this.value)">
      </div>

      <div class="slide-counter" id="slideCounter">
        שקופית 1 מתוך 1
      </div>
    </div>
  </div>

  <script>
    const allItems = ${itemsJson};
    let currentMode = '${mode === 'all' ? 'images' : mode}';
    let currentIndex = 0;
    let isPlaying = true;
    let slideDuration = 5000;
    let timer = null;
    let hideControlsTimeout = null;

    function getFilteredItems() {
      if (currentMode === 'images') {
        return allItems.filter(i => i.url && !i.url.match(/\\.(mp4|webm|ogg|mov)$/i));
      } else if (currentMode === 'commitments') {
        return allItems.filter(i => (i.commitment && i.commitment.trim().length > 0) || (i.sentence && i.sentence.trim().length > 0));
      } else if (currentMode === 'rapper') {
        const groups = {};
        allItems.forEach(i => {
          if (i.group >= 1 && i.group <= 20 && i.sentence && i.sentence.trim()) {
            if (!groups[i.group]) groups[i.group] = [];
            if (!groups[i.group].includes(i.sentence.trim())) {
              groups[i.group].push(i.sentence.trim());
            }
          }
        });
        const result = [];
        for (let g = 1; g <= 20; g++) {
          if (groups[g] && groups[g].length > 0) {
            result.push({ group: g, slogans: groups[g] });
          }
        }
        return result.length > 0 ? result : [{ group: 1, slogans: ['ממתין לסלוגנים...'] }];
      }
      return allItems;
    }

    function renderSlide() {
      const stage = document.getElementById('stage');
      const filtered = getFilteredItems();
      const counter = document.getElementById('slideCounter');

      if (filtered.length === 0) {
        stage.innerHTML = '<div style="text-align:center; padding: 2rem;"><h2>אין תוכן להצגה במצב זה</h2></div>';
        counter.innerText = '0 מתוך 0';
        return;
      }

      if (currentIndex >= filtered.length) currentIndex = 0;
      if (currentIndex < 0) currentIndex = filtered.length - 1;

      counter.innerText = 'שקופית ' + (currentIndex + 1) + ' מתוך ' + filtered.length;
      const item = filtered[currentIndex];

      if (currentMode === 'images') {
        stage.innerHTML = \`
          <div class="image-slide-container">
            <img src="\${item.url}" class="stage-image" alt="קבוצה \${item.group}">
          </div>
        \`;
      } else if (currentMode === 'commitments') {
        const text = item.commitment?.trim() || item.sentence?.trim() || 'מובילים מנהיגות ועשייה';
        const fontSize = text.length > 220 ? '2.1rem' : (text.length > 130 ? '2.6rem' : (text.length > 70 ? '3.3rem' : '4.0rem'));
        const secondary = item.sentence && item.commitment ? \`<div class="slogan-secondary">🎯 סלוגן הקבוצה: "\${item.sentence}"</div>\` : '';

        stage.innerHTML = \`
          <div class="text-slide-container">
            <div class="text-card">
              <div class="group-pill">\${item.group === 0 ? 'העלאה כללית' : 'קבוצה ' + item.group}</div>
              <div class="quote-content" style="font-size: \${fontSize}">“\${text}”</div>
              \${secondary}
            </div>
          </div>
        \`;
      } else if (currentMode === 'rapper') {
        const slogans = item.slogans || [''];
        const sloganText = slogans.map((s, idx) => slogans.length > 1 ? \`#\${idx + 1}:  "\${s}"\` : \`"\${s}"\`).join('<br><br>');
        const fontSize = sloganText.length > 200 ? '2.3rem' : (sloganText.length > 100 ? '2.9rem' : '3.8rem');

        stage.innerHTML = \`
          <div class="text-slide-container">
            <div class="text-card">
              <div class="group-pill">קבוצה \${item.group}</div>
              <div class="quote-content" style="font-size: \${fontSize}; color: #0284c7;">\${sloganText}</div>
            </div>
          </div>
        \`;
      }
    }

    function setMode(mode) {
      currentMode = mode;
      currentIndex = 0;
      document.getElementById('btnImages').classList.toggle('active', mode === 'images');
      document.getElementById('btnCommitments').classList.toggle('active', mode === 'commitments');
      document.getElementById('btnRapper').classList.toggle('active', mode === 'rapper');
      renderSlide();
      resetTimer();
    }

    function nextSlide() {
      const filtered = getFilteredItems();
      if (filtered.length === 0) return;
      currentIndex = (currentIndex + 1) % filtered.length;
      renderSlide();
      resetTimer();
    }

    function prevSlide() {
      const filtered = getFilteredItems();
      if (filtered.length === 0) return;
      currentIndex = (currentIndex - 1 + filtered.length) % filtered.length;
      renderSlide();
      resetTimer();
    }

    function togglePlay() {
      isPlaying = !isPlaying;
      document.getElementById('playPauseBtn').innerText = isPlaying ? '⏸️ השהה (Space)' : '▶️ הפעל (Space)';
      if (isPlaying) {
        resetTimer();
      } else if (timer) {
        clearInterval(timer);
      }
    }

    function updateDuration(val) {
      slideDuration = parseInt(val, 10) * 1000;
      document.getElementById('durationLabel').innerText = '⏱️ זמן שקופית: ' + val + ' שניות';
      resetTimer();
    }

    function resetTimer() {
      if (timer) clearInterval(timer);
      if (isPlaying) {
        timer = setInterval(() => {
          nextSlide();
        }, slideDuration);
      }
    }

    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }

    // Keyboard Hotkeys
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowRight' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      } else if (e.key === '1') {
        setMode('images');
      } else if (e.key === '2') {
        setMode('commitments');
      } else if (e.key === '3') {
        setMode('rapper');
      }
    });

    // Auto-hide controls on mouse idle
    function handleMouseMove() {
      document.getElementById('topBar').classList.remove('hidden');
      document.getElementById('bottomBar').classList.remove('hidden');
      if (hideControlsTimeout) clearTimeout(hideControlsTimeout);
      hideControlsTimeout = setTimeout(() => {
        if (isPlaying) {
          document.getElementById('topBar').classList.add('hidden');
          document.getElementById('bottomBar').classList.add('hidden');
        }
      }, 3500);
    }
    window.addEventListener('mousemove', handleMouseMove);

    // Initial Start
    setMode('${mode === 'all' ? 'images' : mode}');
    handleMouseMove();
  </script>
</body>
</html>`;

    const cleanCompany = (EVENT_CONFIG.companyName || 'event').replace(/[^a-zA-Z0-9א-ת_-]/g, '_');
    const filenames: Record<string, string> = {
      images: `${cleanCompany}-images-offline.html`,
      commitments: `${cleanCompany}-commitments-offline.html`,
      rapper: `${cleanCompany}-rapper-offline.html`,
      all: `${cleanCompany}-all-offline.html`,
    };

    const filename = filenames[mode] || `${cleanCompany}-offline-slideshow.html`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Failed to generate offline presentation:', error);
    return NextResponse.json(
      { error: 'Failed to generate offline presentation: ' + (error?.message || error) },
      { status: 500 }
    );
  }
}
