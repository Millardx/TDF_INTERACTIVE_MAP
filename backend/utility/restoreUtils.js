//restoreUtils.js
const fs = require('fs');
const path = require('path');
const Archive = require('../models/Archive');
const MarkerIcon = require('../models/MarkerIcon');
const { cloudinary, getFolderByType, getArchiveFolderByType } = require('../utility/cloudinaryConfig');
const { buildCloudinaryUrl, extractPublicId } = require('../utility/claudinaryHelpers');

const folderMapping = {
  Cards: 'cardsImg', // Folder for card images
  Modal: 'modalImages', // Folder for modal images
  Audio: 'audios', // Folder for audio files (assuming directly in 'uploads')
  NewsEvent: 'images', // Folder for news/about us images
  AboutUs: 'images',
  MarkerIcon: 'icons',
};


const restoreField = async (archiveId) => {
  const archive = await Archive.findById(archiveId);
  if (!archive) throw new Error('Archive entry not found');

  const { originalCollection, originalId, fieldName, data } = archive;
  const OriginalModel = require(`../models/${originalCollection}`);

    // 🔒 Early guard if field data is missing
    if (!data[fieldName]) {
      throw new Error(`No archived Cloudinary URL found for field: ${fieldName}`);
    }

  // Step 1: Remove the archived flag
  await OriginalModel.findByIdAndUpdate(originalId, {
    $set: { [`${fieldName}Archived`]: false }
  });

  // Step 2: Extract Cloudinary info
  const archivedUrl = data[fieldName];
  const publicId = extractPublicId(archivedUrl);
  if (!publicId) throw new Error(`Cannot extract Cloudinary publicId from ${archivedUrl}`);

  const fileName = publicId.split('/').pop();
  // 🧼 Remove 'archived-' prefix if present
  const cleanedFileName = fileName.replace(/^archived-/, '');
  const archiveFolder = getArchiveFolderByType(originalCollection);
  const uploadFolder = getFolderByType(originalCollection.toLowerCase());
  const newPublicId = `${uploadFolder}/${cleanedFileName}`;

  // Step 3: Rename in Cloudinary
  await cloudinary.uploader.rename(publicId, newPublicId, {
    overwrite: true,
    invalidate: true,
    resource_type: fieldName === 'filePath' || fieldName.includes('Audio') ? 'video' : 'image'
  });

  console.log(`✅ Cloudinary file restored: ${newPublicId}`);

  const resourceType = originalCollection === 'Audio' ? 'video' : 'image';
  const newUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${newPublicId}`;

  const updatePayload = { [fieldName]: newUrl, [`${fieldName}Archived`]: false };

  // Step 4: Apply specific updates based on collection
  if (originalCollection === 'Modal') {
    const modal = await OriginalModel.findById(originalId);
    const { originalIndex } = data;
  
    const insertIndex = typeof originalIndex === 'number' ? originalIndex : modal.modalImages.length;
  
    modal.modalImages.splice(insertIndex, 0, newUrl);
    modal.imageArchived = false;
  
    await modal.save(); 
  } 

  else if (originalCollection === 'Audio') {
    const originalName = data.originalName || cleanedFileName;
    const format = data.format || path.extname(originalName).replace('.', '').toUpperCase();
  
    const restorePayload = {
      ...updatePayload,
      audioArchived: false
    };
  
    // 🧠 Set proper originalName field
    if (fieldName === 'englishAudio') {
      restorePayload.englishOriginalName = originalName;
    } else if (fieldName === 'filipinoAudio') {
      restorePayload.filipinoOriginalName = originalName;
    }
  
    restorePayload.format = format;
  
    await OriginalModel.findByIdAndUpdate(originalId, {
      $set: restorePayload
    });
  }

  else if (originalCollection === 'NewsEvent') {
    const newsEvent = await OriginalModel.findById(originalId);
    const { header, description, originalIndex } = data;
  
    const insertIndex = typeof originalIndex === 'number' ? originalIndex : newsEvent.images.length;
  
    // Insert restored image and metadata at the correct index
    newsEvent.images.splice(insertIndex, 0, newUrl);
    newsEvent.newsHeader.splice(insertIndex, 0, header || null);
    newsEvent.description.splice(insertIndex, 0, description || null);
    newsEvent.imageArchived = false;
  
    await newsEvent.save();
  }
  
  else {
    await OriginalModel.findByIdAndUpdate(originalId, { $set: updatePayload });
  }

  // Step 5: Remove archive entry
  await archive.deleteOne();
  console.log(`🗃️ Archive entry ${archiveId} deleted`);
};


  const restoreDocument = async (archiveId) => {
    try {
      // Find the archive entry by ID
      const archive = await Archive.findById(archiveId);
      if (!archive || archive.fieldName !== 'document') {
        throw new Error('Invalid archive entry for document');
      }

      const { originalCollection, originalId, data } = archive;

      // Restore the document to its original collection
      const OriginalModel = require(`../models/${originalCollection}`);
      const restoredDocument = new OriginalModel(data);
      await restoredDocument.save();

      console.log(`Document restored: ${originalCollection} (ID: ${originalId})`);

      // Delete the archive entry
      await archive.deleteOne();
    } catch (err) {
      console.error('Error during document restoration:', err);
      throw new Error(`Restoration failed for document: ${err.message}`);
    }
  };

  const restoreMarkerIcon = async (archiveId) => {
    try {
      // 📦 Step 1: Fetch archive entry
      const archivedData = await Archive.findById(archiveId);
      if (!archivedData || archivedData.originalCollection !== 'MarkerIcon') {
        throw new Error('Invalid archive entry or not a MarkerIcon');
      }
  
      const { name, iconPath } = archivedData.data;
      if (!name || !iconPath) {
        throw new Error('Missing name or iconPath in archive data');
      }
  
      // 🔍 Step 2: Extract Cloudinary publicId
      const publicId = extractPublicId(iconPath);
      if (!publicId) throw new Error('Failed to extract publicId from Cloudinary URL');
  
      const fileName = publicId.split('/').pop(); // e.g., archivedIcon-map.png
  
      // 🧼 Step 3: Remove the prefix "archivedIcon-" if present
      const originalFileName = fileName.replace(/^archivedIcon-/, '');
  
      // 🔁 Step 4: Determine new path in uploads/icons
      const newPath = `${getFolderByType('icons')}/${originalFileName}`; // uploads/icons/map.png
  
      // 🔄 Step 5: Rename (move) image back to uploads
      await cloudinary.uploader.rename(publicId, newPath, {
        overwrite: true,
        invalidate: true,
      });
  
      const restoredUrl = buildCloudinaryUrl(newPath);
      console.log(`✅ MarkerIcon file restored → ${restoredUrl}`);
  
      // 📝 Step 6: Recreate MarkerIcon document
      const restoredMarkerIcon = new MarkerIcon({
        name,
        iconPath: restoredUrl,
      });
  
      await restoredMarkerIcon.save();
      console.log(`✅ MarkerIcon document restored: ${name}`);
  
      // 🧹 Step 7: Remove archive entry
      await Archive.findByIdAndDelete(archiveId);
      console.log(`🗑️ Archive entry removed`);
  
      return { success: true, message: 'MarkerIcon restored successfully' };
    } catch (err) {
      console.error('❌ Error restoring MarkerIcon:', err);
      throw new Error(`Restoration failed: ${err.message}`);
    }
  };
  

module.exports = { restoreField, restoreDocument, restoreMarkerIcon };