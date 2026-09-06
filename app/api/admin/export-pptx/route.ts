import { NextRequest, NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { getGalleryItems } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'commitments'; // 'images' | 'rapper' | 'commitments'

    const items = await getGalleryItems();

    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.rtlMode = true;

    // Resolve local logo if available
    let logoDataUrl: string | null = null;
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo-wd.png');
      if (fs.existsSync(logoPath)) {
        const logoBuf = fs.readFileSync(logoPath);
        logoDataUrl = `data:image/png;base64,${logoBuf.toString('base64')}`;
      }
    } catch (e) {
      console.warn('Could not load logo for PPTX:', e);
    }

    if (type === 'images') {
      // =========================================================================
      // 1. IMAGES SLIDESHOW (מצגת תמונות הקבוצות)
      // =========================================================================
      pptx.title = 'תנובה פורום 100 - מצגת תמונות הקבוצות';

      // Title Slide
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: '0F172A' };

      if (logoDataUrl) {
        titleSlide.addImage({
          data: logoDataUrl,
          x: 4.67,
          y: 1.2,
          w: 4.0,
          h: 1.2,
          sizing: { type: 'contain', w: 4.0, h: 1.2 },
        });
      }

      titleSlide.addText('פורום 100 – מודל מנהיגות', {
        x: 1.0,
        y: 2.8,
        w: 11.33,
        h: 1.2,
        fontSize: 40,
        fontFace: 'Arial',
        color: 'FFFFFF',
        bold: true,
        align: 'center',
      });

      titleSlide.addText('מצגת תמונות הקבוצות שיצרו המשתתפים', {
        x: 1.0,
        y: 4.1,
        w: 11.33,
        h: 0.8,
        fontSize: 22,
        fontFace: 'Arial',
        color: '38BDF8',
        bold: true,
        align: 'center',
      });

      titleSlide.addText(`נוצר בלייב: ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`, {
        x: 1.0,
        y: 6.2,
        w: 11.33,
        h: 0.5,
        fontSize: 14,
        fontFace: 'Arial',
        color: '94A3B8',
        align: 'center',
      });

      // Individual Image Slides
      const imageItems = items.filter((item) => item.url && !item.url.match(/\.(mp4|webm|ogg|mov)$/i));

      if (imageItems.length === 0) {
        const emptySlide = pptx.addSlide();
        emptySlide.addText('טרם הועלו תמונות במערכת', {
          x: 1.0,
          y: 3.0,
          w: 11.33,
          h: 1.0,
          fontSize: 28,
          color: '64748B',
          align: 'center',
        });
      } else {
        imageItems.forEach((item, idx) => {
          const slide = pptx.addSlide();
          slide.background = { color: 'F8FAFC' };

          // Top Header Bar
          slide.addShape(pptx.ShapeType.rect, {
            x: 0,
            y: 0,
            w: 13.33,
            h: 0.9,
            fill: { color: '0052CC' },
          });

          slide.addText(item.group === 0 ? 'העלאה כללית' : `קבוצה ${item.group}`, {
            x: 0.8,
            y: 0.15,
            w: 4.0,
            h: 0.6,
            fontSize: 22,
            fontFace: 'Arial',
            color: 'FFFFFF',
            bold: true,
            align: 'right',
          });

          slide.addText(`שקופית ${idx + 1} מתוך ${imageItems.length}`, {
            x: 8.5,
            y: 0.2,
            w: 4.0,
            h: 0.5,
            fontSize: 14,
            fontFace: 'Arial',
            color: 'E0F2FE',
            align: 'left',
          });

          // Embed Image
          slide.addImage({
            path: item.url,
            x: 1.0,
            y: 1.15,
            w: 11.33,
            h: 5.2,
            sizing: { type: 'contain', w: 11.33, h: 5.2 },
          });

          // Bottom Slogan / Commitment Caption (if present)
          if (item.sentence || item.commitment) {
            slide.addShape(pptx.ShapeType.roundRect, {
              x: 1.0,
              y: 6.5,
              w: 11.33,
              h: 0.75,
              fill: { color: 'FFFFFF' },
              line: { color: 'CBD5E1', width: 1 },
              rectRadius: 0.1,
            });

            const captionText = item.sentence && item.commitment
              ? `סלוגן: "${item.sentence}"  |  התחייבות: ${item.commitment}`
              : (item.sentence ? `סלוגן: "${item.sentence}"` : `התחייבות: ${item.commitment}`);

            slide.addText(captionText, {
              x: 1.2,
              y: 6.55,
              w: 10.93,
              h: 0.65,
              fontSize: 14,
              fontFace: 'Arial',
              color: '0F172A',
              bold: true,
              align: 'center',
            });
          }
        });
      }

    } else if (type === 'rapper') {
      // =========================================================================
      // 2. RAPPER SLOGANS SLIDESHOW (מצגת סלוגנים לראפר)
      // =========================================================================
      pptx.title = 'תנובה פורום 100 - סלוגנים לראפר';

      // Title Slide
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: '0F172A' };

      if (logoDataUrl) {
        titleSlide.addImage({
          data: logoDataUrl,
          x: 4.67,
          y: 1.2,
          w: 4.0,
          h: 1.2,
          sizing: { type: 'contain', w: 4.0, h: 1.2 },
        });
      }

      titleSlide.addText('🎤 מאגר סלוגנים לראפר', {
        x: 1.0,
        y: 2.8,
        w: 11.33,
        h: 1.2,
        fontSize: 42,
        fontFace: 'Arial',
        color: 'FFFFFF',
        bold: true,
        align: 'center',
      });

      titleSlide.addText('פורום 100 – מודל מנהיגות | סלוגנים של כלל הקבוצות', {
        x: 1.0,
        y: 4.1,
        w: 11.33,
        h: 0.8,
        fontSize: 22,
        fontFace: 'Arial',
        color: '38BDF8',
        bold: true,
        align: 'center',
      });

      titleSlide.addText(`נוצר בלייב: ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`, {
        x: 1.0,
        y: 6.2,
        w: 11.33,
        h: 0.5,
        fontSize: 14,
        fontFace: 'Arial',
        color: '94A3B8',
        align: 'center',
      });

      // Collect all slogans per group (1-20)
      const groupSlogans: Record<number, string[]> = {};
      for (let i = 1; i <= 20; i++) groupSlogans[i] = [];

      items.forEach((item) => {
        if (item.group >= 1 && item.group <= 20 && item.sentence && item.sentence.trim()) {
          if (!groupSlogans[item.group].includes(item.sentence.trim())) {
            groupSlogans[item.group].push(item.sentence.trim());
          }
        }
      });

      // Slide per group (Groups 1-20)
      for (let grp = 1; grp <= 20; grp++) {
        const slogans = groupSlogans[grp];
        const slide = pptx.addSlide();
        slide.background = { color: 'F8FAFC' };

        // Group Header Badge Box
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 4.42,
          y: 0.8,
          w: 4.5,
          h: 1.1,
          fill: { color: '0284C7' },
          rectRadius: 0.2,
          shadow: { type: 'outer', color: '000000', opacity: 0.15, blur: 4, offset: 2 },
        });

        slide.addText(`קבוצה ${grp}`, {
          x: 4.42,
          y: 0.85,
          w: 4.5,
          h: 1.0,
          fontSize: 32,
          fontFace: 'Arial',
          color: 'FFFFFF',
          bold: true,
          align: 'center',
        });

        // Slogans Display Box
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 1.2,
          y: 2.3,
          w: 10.93,
          h: 4.3,
          fill: { color: 'FFFFFF' },
          line: { color: 'CBD5E1', width: 2 },
          rectRadius: 0.25,
          shadow: { type: 'outer', color: '000000', opacity: 0.08, blur: 6, offset: 3 },
        });

        if (slogans.length === 0) {
          slide.addText('ממתין לסלוגן...', {
            x: 1.5,
            y: 3.8,
            w: 10.33,
            h: 1.0,
            fontSize: 26,
            fontFace: 'Arial',
            color: '94A3B8',
            italic: true,
            align: 'center',
          });
        } else {
          // Render Slogans
          const fullText = slogans.map((s, idx) => slogans.length > 1 ? `#${idx + 1}:  "${s}"` : `“${s}”`).join('\n\n');
          const fontSize = slogans.length > 1 ? 28 : 36;

          slide.addText(fullText, {
            x: 1.5,
            y: 2.5,
            w: 10.33,
            h: 3.9,
            fontSize: fontSize,
            fontFace: 'Arial',
            color: '0F172A',
            bold: true,
            align: 'center',
          });
        }
      }

    } else {
      // =========================================================================
      // 3. COMMITMENTS SLIDESHOW (מצגת התחייבויות לפעולה)
      // =========================================================================
      pptx.title = 'תנובה פורום 100 - התחייבויות לפעולה';

      // Title Slide
      const titleSlide = pptx.addSlide();
      titleSlide.background = { color: '0F172A' };

      if (logoDataUrl) {
        titleSlide.addImage({
          data: logoDataUrl,
          x: 4.67,
          y: 1.2,
          w: 4.0,
          h: 1.2,
          sizing: { type: 'contain', w: 4.0, h: 1.2 },
        });
      }

      titleSlide.addText('📜 התחייבויות לפעולה', {
        x: 1.0,
        y: 2.8,
        w: 11.33,
        h: 1.2,
        fontSize: 42,
        fontFace: 'Arial',
        color: 'FFFFFF',
        bold: true,
        align: 'center',
      });

      titleSlide.addText('פורום 100 – מודל מנהיגות | ההתחייבויות של כלל הקבוצות', {
        x: 1.0,
        y: 4.1,
        w: 11.33,
        h: 0.8,
        fontSize: 22,
        fontFace: 'Arial',
        color: '38BDF8',
        bold: true,
        align: 'center',
      });

      titleSlide.addText(`נוצר בלייב: ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`, {
        x: 1.0,
        y: 6.2,
        w: 11.33,
        h: 0.5,
        fontSize: 14,
        fontFace: 'Arial',
        color: '94A3B8',
        align: 'center',
      });

      // Filter items that have commitment or sentence
      const commitmentItems = items.filter((item) => item.commitment || item.sentence);

      if (commitmentItems.length === 0) {
        const emptySlide = pptx.addSlide();
        emptySlide.addText('טרם הוזנו התחייבויות לפעולה במערכת', {
          x: 1.0,
          y: 3.0,
          w: 11.33,
          h: 1.0,
          fontSize: 28,
          color: '64748B',
          align: 'center',
        });
      } else {
        commitmentItems.forEach((item, idx) => {
          const slide = pptx.addSlide();
          slide.background = { color: 'F8FAFC' };

          // Group Header Badge Box
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 0.6,
            w: 3.5,
            h: 0.9,
            fill: { color: '0052CC' },
            rectRadius: 0.15,
          });

          slide.addText(item.group === 0 ? 'כללי' : `קבוצה ${item.group}`, {
            x: 0.8,
            y: 0.65,
            w: 3.5,
            h: 0.8,
            fontSize: 22,
            fontFace: 'Arial',
            color: 'FFFFFF',
            bold: true,
            align: 'center',
          });

          // Slide counter top left
          slide.addText(`שקופית ${idx + 1} מתוך ${commitmentItems.length}`, {
            x: 8.5,
            y: 0.7,
            w: 4.0,
            h: 0.5,
            fontSize: 14,
            fontFace: 'Arial',
            color: '64748B',
            align: 'left',
          });

          const hasImage = item.url && !item.url.match(/\.(mp4|webm|ogg|mov)$/i);
          const mainBoxWidth = hasImage ? 7.6 : 11.73;

          // Main Commitment Card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 1.8,
            w: mainBoxWidth,
            h: 4.8,
            fill: { color: 'FFFFFF' },
            line: { color: '0284C7', width: 2 },
            rectRadius: 0.25,
            shadow: { type: 'outer', color: '000000', opacity: 0.08, blur: 6, offset: 3 },
          });

          slide.addText('✨ ההתחייבות לפעולה שלנו:', {
            x: 1.1,
            y: 2.0,
            w: mainBoxWidth - 0.6,
            h: 0.5,
            fontSize: 16,
            fontFace: 'Arial',
            color: '0284C7',
            bold: true,
            align: 'right',
          });

          const commitmentText = item.commitment || item.sentence || 'מובילים מנהיגות ועשייה';
          const fontSize = commitmentText.length > 80 ? 26 : 34;

          slide.addText(`“${commitmentText}”`, {
            x: 1.1,
            y: 2.6,
            w: mainBoxWidth - 0.6,
            h: 2.6,
            fontSize: fontSize,
            fontFace: 'Arial',
            color: '0F172A',
            bold: true,
            align: 'center',
          });

          // Slogan banner at bottom of card
          if (item.sentence && item.commitment) {
            slide.addShape(pptx.ShapeType.roundRect, {
              x: 1.1,
              y: 5.4,
              w: mainBoxWidth - 0.6,
              h: 0.9,
              fill: { color: 'F0F9FF' },
              line: { color: 'BAE6FD', width: 1 },
              rectRadius: 0.15,
            });

            slide.addText(`🎯 סלוגן הקבוצה: "${item.sentence}"`, {
              x: 1.2,
              y: 5.5,
              w: mainBoxWidth - 0.8,
              h: 0.7,
              fontSize: 16,
              fontFace: 'Arial',
              color: '0369A1',
              bold: true,
              align: 'center',
            });
          }

          // Optional Image side thumbnail
          if (hasImage) {
            slide.addImage({
              path: item.url,
              x: 8.8,
              y: 1.8,
              w: 3.73,
              h: 4.8,
              sizing: { type: 'cover', w: 3.73, h: 4.8 },
            });
          }
        });
      }
    }

    // Export binary buffer
    const buffer = (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;

    const filenames: Record<string, string> = {
      images: 'tnuva-images-slideshow.pptx',
      rapper: 'tnuva-rapper-slogans.pptx',
      commitments: 'tnuva-commitments-slideshow.pptx',
    };

    const filename = filenames[type] || 'tnuva-presentation.pptx';

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Failed to generate PPTX slideshow:', error);
    return NextResponse.json(
      { error: 'Failed to generate presentation: ' + (error?.message || error) },
      { status: 500 }
    );
  }
}
