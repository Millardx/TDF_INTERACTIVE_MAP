// utils/archiveCleaner.js
const mongoose = require('mongoose');
const { cloudinary } = require('../utility/cloudinaryConfig');
const { extractPublicId } = require('../utility/claudinaryHelpers');
const Archive = require('../models/Archive');

async function cleanOrphanedCloudinaryFiles() {
  console.log('🧹 Starting archive cleanup scan...');

  try {
    // Get all archived document _ids
    const allArchiveDocs = await Archive.find({}, '_id');
    const archiveIds = allArchiveDocs.map(doc => doc._id.toString());

    // Get all known Cloudinary files (optionally scoped by folder if needed)
    // This example assumes all files uploaded used tagging or folder conventions

    // You can filter based on time or tag if you're tagging them as "archived"
    const { resources } = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'archives/',
      max_results: 100,
    });

    let deletedCount = 0;

    for (const resource of resources) {
      const publicId = resource.public_id;

      // Try matching to an archive ID if it's embedded (e.g., in the file name or tag)
      const isReferenced = archiveIds.some(id => publicId.includes(id));

      if (!isReferenced) {
        try {
          await cloudinary.uploader.destroy(publicId, { invalidate: true });
          console.log(`🗑️ Orphaned Cloudinary file deleted: ${publicId}`);
          deletedCount++;
        } catch (err) {
          console.warn(`⚠️ Failed to delete orphaned file: ${publicId} - ${err.message}`);
        }
      }
    }

    console.log(`✅ Cleanup complete. Total orphaned files deleted: ${deletedCount}`);
  } catch (err) {
    console.error('❌ Error during orphaned Cloudinary cleanup:', err.message);
  }
}

module.exports = { cleanOrphanedCloudinaryFiles };
