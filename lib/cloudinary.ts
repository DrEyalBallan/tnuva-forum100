import { v2 as cloudinary } from 'cloudinary';
import { GalleryItem } from './storage';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dp4uagtq9',
  api_key: process.env.CLOUDINARY_API_KEY || '652565257832732',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'SUr7VNDvITDZ796Yx6XW5Itgk-E',
  secure: true,
});

export { cloudinary };

export async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    group: number;
    sentence: string;
    commitment?: string;
    token?: string;
    resourceType?: 'image' | 'video' | 'auto';
  }
): Promise<GalleryItem> {
  const timestamp = Date.now();
  const uniqueId = Math.random().toString(36).slice(2, 10);
  const publicId = `tnuva_g${options.group}_${timestamp}_${uniqueId}`;

  const sentenceB64 = Buffer.from(options.sentence || '', 'utf-8').toString('base64');
  const commitmentB64 = Buffer.from(options.commitment || '', 'utf-8').toString('base64');

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'tnuva-forum100',
        public_id: publicId,
        resource_type: options.resourceType || 'auto',
        tags: ['tnuva_forum100', `group_${options.group}`],
        context: {
          group: options.group.toString(),
          sentence_b64: sentenceB64,
          commitment_b64: commitmentB64,
          token: options.token || '',
          time: timestamp.toString(),
        },
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload to Cloudinary failed'));
        }

        const item: GalleryItem = {
          id: `${timestamp}-${uniqueId}`,
          url: result.secure_url,
          group: options.group,
          sentence: options.sentence,
          commitment: options.commitment,
          time: timestamp,
          token: options.token,
          filename: result.public_id,
        };

        resolve(item);
      }
    );

    stream.end(buffer);
  });
}

export async function fetchAllCloudinaryGalleryItems(): Promise<GalleryItem[]> {
  try {
    const result = await cloudinary.api.resources_by_tag('tnuva_forum100', {
      max_results: 500,
      context: true,
      tags: true,
      direction: 'desc',
    });

    const items: GalleryItem[] = (result.resources || []).map((res: any) => {
      const ctx = res.context?.custom || {};
      let sentence = '';
      let commitment = '';
      try {
        if (ctx.sentence_b64) sentence = Buffer.from(ctx.sentence_b64, 'base64').toString('utf-8');
        else if (ctx.sentence) sentence = ctx.sentence;
      } catch {}
      try {
        if (ctx.commitment_b64) commitment = Buffer.from(ctx.commitment_b64, 'base64').toString('utf-8');
        else if (ctx.commitment) commitment = ctx.commitment;
      } catch {}

      const group = parseInt(ctx.group || '1', 10);
      const time = parseInt(ctx.time || '0', 10) || new Date(res.created_at).getTime();

      return {
        id: res.asset_id || res.public_id,
        url: res.secure_url,
        group,
        sentence,
        commitment,
        time,
        token: ctx.token || '',
        filename: res.public_id,
      };
    });

    return items.sort((a, b) => b.time - a.time);
  } catch (err) {
    console.warn('Error fetching items from Cloudinary:', err);
    return [];
  }
}

export async function deleteFromCloudinary(publicIds: string[]): Promise<void> {
  try {
    if (publicIds.length > 0) {
      await cloudinary.api.delete_resources(publicIds);
    }
  } catch (err) {
    console.warn('Error deleting resources from Cloudinary:', err);
  }
}
