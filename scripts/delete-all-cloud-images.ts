import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dp4uagtq9',
  api_key: process.env.CLOUDINARY_API_KEY || '652565257832732',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'SUr7VNDvITDZ796Yx6XW5Itgk-E',
  secure: true,
});

async function deleteAll() {
  console.log('--- Starting complete deletion of cloud images from Cloudinary ---');

  // 1. Delete all resources in prefix 'tnuva-forum100'
  try {
    console.log('Deleting resources with prefix "tnuva-forum100/" for images...');
    const imgRes = await cloudinary.api.delete_resources_by_prefix('tnuva-forum100/', {
      resource_type: 'image',
    });
    console.log('Image prefix deletion result:', imgRes);
  } catch (e: any) {
    console.warn('Prefix image delete warning:', e?.message || e);
  }

  try {
    console.log('Deleting resources with prefix "tnuva-forum100/" for videos...');
    const vidRes = await cloudinary.api.delete_resources_by_prefix('tnuva-forum100/', {
      resource_type: 'video',
    });
    console.log('Video prefix deletion result:', vidRes);
  } catch (e: any) {
    console.warn('Prefix video delete warning:', e?.message || e);
  }

  // 2. Delete by tag 'tnuva_forum100'
  try {
    console.log('Deleting resources by tag "tnuva_forum100"...');
    const tagRes = await cloudinary.api.delete_resources_by_tag('tnuva_forum100');
    console.log('Tag delete result:', tagRes);
  } catch (e: any) {
    console.warn('Tag delete warning:', e?.message || e);
  }

  // 3. Delete folder 'tnuva-forum100'
  try {
    console.log('Deleting folder "tnuva-forum100"...');
    const folderRes = await cloudinary.api.delete_folder('tnuva-forum100');
    console.log('Folder delete result:', folderRes);
  } catch (e: any) {
    console.warn('Folder delete warning:', e?.message || e);
  }

  // 4. Also check if there are any remaining resources in the entire cloud
  try {
    const remaining = await cloudinary.api.resources({ max_results: 100 });
    console.log(`Remaining resources in cloud account: ${remaining.resources?.length || 0}`);
    if (remaining.resources && remaining.resources.length > 0) {
      const publicIds = remaining.resources.map((r: any) => r.public_id);
      console.log('Deleting remaining public IDs:', publicIds);
      await cloudinary.api.delete_resources(publicIds);
    }
  } catch (e: any) {
    console.warn('Remaining resources check warning:', e?.message || e);
  }

  // 5. Clear local gallery.json & deleted.json
  const dataDir = path.join(process.cwd(), 'data');
  try {
    if (fs.existsSync(dataDir)) {
      const galleryFile = path.join(dataDir, 'gallery.json');
      const deletedFile = path.join(dataDir, 'deleted.json');
      if (fs.existsSync(galleryFile)) fs.writeFileSync(galleryFile, '[]', 'utf-8');
      if (fs.existsSync(deletedFile)) fs.writeFileSync(deletedFile, '[]', 'utf-8');
      console.log('Local data files cleared.');
    }
  } catch (e: any) {
    console.warn('Local data clear warning:', e?.message || e);
  }

  console.log('--- ALL CLOUD IMAGES DELETED SUCCESSFULLY ---');
}

deleteAll().catch(console.error);
