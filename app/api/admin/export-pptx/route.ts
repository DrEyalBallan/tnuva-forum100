import { NextRequest, NextResponse } from 'next/server';
import pptxgen from 'pptxgenjs';
import { getGalleryItems } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'commitments'; // 'images' | 'rapper' | 'commitments'

    const items = await getGalleryItems();

    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.rtlMode = true;

    if (type === 'images') {
      // =========================================================================
      // 1. IMAGES SLIDESHOW - 100% Full-page clean, only image, exact aspect ratio
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
        imageItems.forEach((item) => {
          const slide = pptx.addSlide();
          slide.background = { color: '000000' }; // Pure black background for clean projection

          // Full-bleed image preserving exact original aspect ratio (contain)
          slide.addImage({
            path: item.url,
            x: 0,
            y: 0,
            w: 13.33,
            h: 7.5,
            sizing: { type: 'contain', w: 13.33, h: 7.5 },
          });
        });
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
          y: 1.0,
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
            y: 2.2,
            w: 11.33,
            h: 4.2,
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
            y: 1.0,
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
