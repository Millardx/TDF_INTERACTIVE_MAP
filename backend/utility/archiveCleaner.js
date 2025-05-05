// utils/archiveCleaner.js
const mongoose = require('mongoose');
const { cloudinary } = require('../utility/cloudinaryConfig');
const { extractPublicId } = require('../utility/claudinaryHelpers');
const Archive = require('../models/Archive');

async function cleanOrphanedCloudinaryFiles() {
  console.log(`🧹 [${new Date().toISOString()}] Starting archive cleanup scan...`);

  let deletedOrphans = 0;
  let deletedExpired = 0;

  try {
    // 1. Clean expired Archive entries + Cloudinary
    const expiredDocs = await Archive.find({ expiresAt: { $lte: new Date() } }).limit(50);

    for (const doc of expiredDocs) {
      try {
        const publicId = extractPublicId(doc.url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId, { invalidate: true });
        }
        await Archive.deleteOne({ _id: doc._id });
        console.log(`🗑️ Expired archive removed: ${doc._id}`);
        deletedExpired++;
      } catch (err) {
        console.warn(`⚠️ Failed to delete expired archive: ${doc._id} - ${err.message}`);
      }
    }

    // 2. Clean orphaned Cloudinary files (not in Archive)
    const allArchiveDocs = await Archive.find({}, '_id');
    const archiveIds = allArchiveDocs.map(doc => doc._id.toString());

    const { resources } = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'archives/',
      max_results: 100,
    });

    for (const resource of resources) {
      const publicId = resource.public_id;
      const isReferenced = archiveIds.some(id => publicId.includes(id));

      if (!isReferenced) {
        try {
          await cloudinary.uploader.destroy(publicId, { invalidate: true });
          console.log(`🗑️ Orphaned Cloudinary file deleted: ${publicId}`);
          deletedOrphans++;
        } catch (err) {
          console.warn(`⚠️ Failed to delete orphaned file: ${publicId} - ${err.message}`);
        }
      }
    }

    console.log(`✅ Cleanup finished [${new Date().toISOString()}]`);
    console.log(`   • Expired archive entries removed: ${deletedExpired}`);
    console.log(`   • Orphaned Cloudinary files deleted: ${deletedOrphans}`);
  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}

module.exports = { cleanOrphanedCloudinaryFiles };
