import { NextRequest, NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { imageSize } from 'image-size';
import { getGalleryItems } from '@/lib/storage';

export const dynamic = 'force-dynamic';

function getAutoOrientedUrl(url: string): string {
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    // Add a_auto to ensure EXIF rotation is baked in and orientation is upright
    if (!url.includes('/upload/a_auto')) {
      return url.replace('/upload/', '/upload/a_auto,c_limit,w_1920,h_1080,q_auto:good,f_jpg/');
    }
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
    const slideRatio = slideWidth / slideHeight; // ~1.7773

    if (type === 'images') {
      // =========================================================================
      // 1. IMAGES SLIDESHOW - 100% Full Page Clean, Undistorted, Upright Orientation
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

          const targetUrl = getAutoOrientedUrl(item.url);

          try {
            // Fetch image buffer to inspect true dimensions and avoid pptxgenjs scaling issues
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
              let x = 0;
              let y = 0;
              let w = slideWidth;
              let h = slideHeight;

              if (imgRatio >= slideRatio) {
                // Wider than 16:9 -> fit full width, center vertically
                w = slideWidth;
                h = slideWidth / imgRatio;
                x = 0;
                y = (slideHeight - h) / 2;
              } else {
                // Taller / narrower (portrait or 4:3) -> fit full height, center horizontally
                h = slideHeight;
                w = slideHeight * imgRatio;
                y = 0;
                x = (slideWidth - w) / 2;
              }

              slide.addImage({
                data: `data:image/${dim.type};base64,${buf.toString('base64')}`,
                x,
                y,
                w,
                h,
              });
            } else {
              // Fallback to direct URL if fetch failed
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
          y: 0.9,
          w: 11.33,
          h: 0.6,
          fontSize: 20,
          fontFace: 'Arial',
          color: '64748B',
          bold: true,
          align: 'center',
        });

        // Slogan text centered in the middle (large, bold, clean)
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
          const fontSize = sloganText.length > 100 ? 32 : (slogans.length > 1 ? 34 : 44);

          slide.addText(sloganText, {
            x: 1.0,
            y: 2.0,
            w: 11.33,
            h: 4.5,
            fontSize: fontSize,
            fontFace: 'Arial',
            color: '0F172A',
            bold: true,
            align: 'center',
            valign: 'middle',
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
            y: 0.9,
            w: 11.33,
            h: 0.6,
            fontSize: 20,
            fontFace: 'Arial',
            color: '64748B',
            bold: true,
            align: 'center',
          });

          // Commitment text centered in the middle (large, bold, clean)
          const text = item.commitment?.trim() || item.sentence?.trim() || 'מובילים מנהיגות ועשייה';
          const fontSize = text.length > 120 ? 28 : (text.length > 70 ? 34 : 42);

          slide.addText(`“${text}”`, {
            x: 1.0,
            y: 1.8,
            w: 11.33,
            h: 4.8,
            fontSize: fontSize,
            fontFace: 'Arial',
            color: '0F172A',
            bold: true,
            align: 'center',
            valign: 'middle',
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
