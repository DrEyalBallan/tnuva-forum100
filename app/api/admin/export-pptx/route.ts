import { NextRequest, NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { imageSize } from 'image-size';
import { getGalleryItems } from '@/lib/storage';

export const dynamic = 'force-dynamic';

function getCleanJpegUrl(url: string): string {
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    // Replace any existing transforms or inject a_auto,c_limit,w_1920,h_1080,q_auto:good,f_jpg
    return url.replace(/\/upload\/(?:[^\/]+\/)?/, '/upload/a_auto,c_limit,w_1920,h_1080,q_auto:good,f_jpg/');
  }
  return url;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'commitments'; // 'images' | 'rapper' | 'commitments'

    const items = await getGalleryItems();

    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.rtlMode = true;

    const slideWidth = 13.33;
    const slideHeight = 7.5;

    if (type === 'images') {
      // =========================================================================
      // 1. IMAGES SLIDESHOW - 100% Full Page Clean, Undistorted, Upright, No Cropping
      // =========================================================================
      pptx.title = 'תמונות הקבוצות';

      const imageItems = items.filter((item) => item.url && !item.url.match(/\.(mp4|webm|ogg|mov)$/i));

      if (imageItems.length === 0) {
        const emptySlide = pptx.addSlide();
        emptySlide.background = { color: '000000' };
        emptySlide.addText('טרם הועלו תמונות', {
          x: 1.0,
          y: 3.2,
          w: 11.33,
          h: 1.0,
          fontSize: 28,
          color: 'FFFFFF',
          align: 'center',
        });
      } else {
        for (const item of imageItems) {
          const slide = pptx.addSlide();
          slide.background = { color: '000000' }; // Clean black background for projection

          const targetUrl = getCleanJpegUrl(item.url);

          try {
            // Fetch image buffer to inspect true dimensions and convert to JPEG base64 for PPTX
            const res = await fetch(targetUrl, { cache: 'no-store' });
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              const buf = Buffer.from(arrayBuf);
              let dim = { width: 1920, height: 1080, type: 'jpeg' };
              try {
                const detected = imageSize(buf);
                if (detected.width && detected.height) {
                  dim = { width: detected.width, height: detected.height, type: detected.type || 'jpeg' };
                }
              } catch (e) {
                console.warn('Could not detect image dimensions, using fallback:', e);
              }

              const imgRatio = dim.width / dim.height;
              const maxW = slideWidth;
              const maxH = slideHeight;

              let w = maxW;
              let h = maxW / imgRatio;

              if (h > maxH) {
                h = maxH;
                w = maxH * imgRatio;
              }

              // Ensure exact placement with zero overshoot (no cut borders)
              const x = Math.max(0, Number(((maxW - w) / 2).toFixed(3)));
              const y = Math.max(0, Number(((maxH - h) / 2).toFixed(3)));
              w = Number(w.toFixed(3));
              h = Number(h.toFixed(3));

              slide.addImage({
                data: `data:image/${dim.type === 'png' ? 'png' : 'jpeg'};base64,${buf.toString('base64')}`,
                x,
                y,
                w,
                h,
              });
            } else {
              // Fallback to direct URL
              slide.addImage({
                path: targetUrl,
                x: 0,
                y: 0,
                w: slideWidth,
                h: slideHeight,
                sizing: { type: 'contain', w: slideWidth, h: slideHeight },
              });
            }
          } catch (err) {
            console.error('Failed to embed image in slide:', err);
            slide.addImage({
              path: targetUrl,
              x: 0,
              y: 0,
              w: slideWidth,
              h: slideHeight,
              sizing: { type: 'contain', w: slideWidth, h: slideHeight },
            });
          }
        }
      }

    } else if (type === 'rapper') {
      // =========================================================================
      // 2. RAPPER SLOGANS SLIDESHOW - Clean, centered in middle, small group number, NO images
      // =========================================================================
      pptx.title = 'סלוגנים לראפר';

      // Group slogans by group (1-20)
      const groupSlogans: Record<number, string[]> = {};
      for (let i = 1; i <= 20; i++) groupSlogans[i] = [];

      items.forEach((item) => {
        if (item.group >= 1 && item.group <= 20 && item.sentence && item.sentence.trim()) {
          const trimmed = item.sentence.trim();
          if (!groupSlogans[item.group].includes(trimmed)) {
            groupSlogans[item.group].push(trimmed);
          }
        }
      });

      // Filter groups that have slogans (or all 20 groups)
      const groupsToRender = Array.from({ length: 20 }, (_, i) => i + 1).filter(
        (grp) => groupSlogans[grp].length > 0
      );

      const targetGroups = groupsToRender.length > 0 ? groupsToRender : Array.from({ length: 20 }, (_, i) => i + 1);

      targetGroups.forEach((grp) => {
        const slogans = groupSlogans[grp];
        const slide = pptx.addSlide();
        slide.background = { color: 'FFFFFF' }; // Clean pure white

        // Small Group Number at top
        slide.addText(`קבוצה ${grp}`, {
          x: 1.0,
          y: 0.6,
          w: 11.33,
          h: 0.6,
          fontSize: 20,
          fontFace: 'Arial',
          color: '64748B',
          bold: true,
          align: 'center',
        });

        // Slogan text centered in the middle (large, bold, clean with auto-fit)
        if (slogans.length === 0) {
          slide.addText('ממתין לסלוגן...', {
            x: 1.0,
            y: 3.2,
            w: 11.33,
            h: 1.5,
            fontSize: 28,
            fontFace: 'Arial',
            color: 'CBD5E1',
            italic: true,
            align: 'center',
          });
        } else {
          const sloganText = slogans.map((s, idx) => slogans.length > 1 ? `#${idx + 1}:  "${s}"` : `"${s}"`).join('\n\n');
          
          let fontSize = 44;
          if (sloganText.length > 250) {
            fontSize = 20;
          } else if (sloganText.length > 180) {
            fontSize = 24;
          } else if (sloganText.length > 120) {
            fontSize = 28;
          } else if (sloganText.length > 60 || slogans.length > 1) {
            fontSize = 34;
          } else {
            fontSize = 44;
          }

          slide.addText(sloganText, {
            x: 0.8,
            y: 1.4,
            w: 11.73,
            h: 5.5,
            fontSize: fontSize,
            fontFace: 'Arial',
            color: '0F172A',
            bold: true,
            align: 'center',
            valign: 'middle',
            wrap: true,
            shrinkText: true,
          });
        }
      });

    } else {
      // =========================================================================
      // 3. COMMITMENTS SLIDESHOW - Clean, centered in middle, small group number, NO images
      // =========================================================================
      pptx.title = 'התחייבויות לפעולה';

      // Collect commitments
      const commitmentItems = items.filter((item) => item.commitment && item.commitment.trim().length > 0);

      const itemsToRender = commitmentItems.length > 0 ? commitmentItems : items.filter((item) => item.sentence);

      if (itemsToRender.length === 0) {
        const emptySlide = pptx.addSlide();
        emptySlide.background = { color: 'FFFFFF' };
        emptySlide.addText('טרם הוזנו התחייבויות לפעולה', {
          x: 1.0,
          y: 3.2,
          w: 11.33,
          h: 1.0,
          fontSize: 28,
          fontFace: 'Arial',
          color: '64748B',
          align: 'center',
        });
      } else {
        itemsToRender.forEach((item) => {
          const slide = pptx.addSlide();
          slide.background = { color: 'FFFFFF' }; // Clean pure white

          // Small Group Number at top
          slide.addText(item.group === 0 ? 'כללי' : `קבוצה ${item.group}`, {
            x: 1.0,
            y: 0.6,
            w: 11.33,
            h: 0.6,
            fontSize: 20,
            fontFace: 'Arial',
            color: '64748B',
            bold: true,
            align: 'center',
          });

          // Commitment text centered in the middle (large, bold, clean, auto-scaled to prevent slide overflow)
          const rawText = item.commitment?.trim() || item.sentence?.trim() || 'מובילים מנהיגות ועשייה';
          const text = `“${rawText}”`;

          let fontSize = 42;
          if (rawText.length > 250) {
            fontSize = 20;
          } else if (rawText.length > 180) {
            fontSize = 24;
          } else if (rawText.length > 120) {
            fontSize = 28;
          } else if (rawText.length > 70) {
            fontSize = 34;
          } else {
            fontSize = 42;
          }

          slide.addText(text, {
            x: 0.8,
            y: 1.4,
            w: 11.73,
            h: 5.5,
            fontSize: fontSize,
            fontFace: 'Arial',
            color: '0F172A',
            bold: true,
            align: 'center',
            valign: 'middle',
            wrap: true,
            shrinkText: true,
          });
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
    console.error('Failed to generate clean PPTX slideshow:', error);
    return NextResponse.json(
      { error: 'Failed to generate presentation: ' + (error?.message || error) },
      { status: 500 }
    );
  }
}
