// archiveUtils.js
const fs = require('fs'); // Use fs.promises for async handling
const path = require('path');
const Archive = require('../models/Archive');
const MarkerIcon = require('../models/MarkerIcon');
const { cloudinary, getArchiveFolderByType } = require('./cloudinaryConfig');
const { extractPublicId, buildCloudinaryUrl } = require('./claudinaryHelpers'); // assuming you moved your helper functions there



const folderMapping = {
  Cards: 'cardsImg', // Folder for card images
  Modal: 'modalImages', // Folder for modal images
  Audio: 'audios', // Folder for audio files (assuming directly in 'uploads')
  NewsEvent: 'images', // Folder for news/about us images
  AboutUs: 'images',
  MarkerIcon: 'icons',
};

/**
 * ✅ Archive a Cloudinary image/audio/etc. by moving it to an 'archives' folder and logging it.
 * @param {string} originalCollection - E.g., 'Cards', 'Modal'
 * @param {string} documentId - The MongoDB _id of the original document
 * @param {string} fieldName - The field being archived, e.g., 'image', 'filePath'
 * @param {string} fieldData - The Cloudinary URL of the file
 */

  const archiveField = async (originalCollection, documentId, fieldName, fieldData, extraData = {}) => {
    try {
      if (!fieldData.includes('cloudinary.com')) {
        throw new Error('Provided field is not a valid Cloudinary URL');
      }

      const publicId = extractPublicId(fieldData);
      if (!publicId) throw new Error('Failed to extract public_id from Cloudinary URL');


    // ✅ Extract full public ID (including extension if present)
    const fullPublicId = extractPublicId(fieldData);
    const parsed = path.parse(fullPublicId);
    const fileNameWithExt = `${parsed.name}${parsed.ext}`; // e.g., abc123.wav

    const archiveFolder = getArchiveFolderByType(originalCollection);
    const newPath = `${archiveFolder}/archived-${fileNameWithExt}`;

    // ✅ Detect resource type
    let resourceType = 'image'; // Default fallback
    if (fieldData.includes('/video/')) {
      resourceType = 'video';
    } else if (fieldData.includes('/raw/')) {
      resourceType = 'raw';
    }

    console.log('📤 Attempting Cloudinary rename:');
    console.log('   • publicId:', fullPublicId);
    console.log('   • newPath:', newPath);
    console.log('   • resourceType:', resourceType);

    // ✅ Move file in Cloudinary
    await cloudinary.uploader.rename(fullPublicId, newPath, {
      overwrite: true,
      invalidate: true,
      resource_type: resourceType,
    });

    // ✅ Optional: cleanup (if needed)
    if (fullPublicId !== newPath) {
      try {
        await cloudinary.uploader.destroy(fullPublicId, {
          invalidate: true,
          resource_type: resourceType,
        });
        console.log(`🧹 Old file cleaned up: ${fullPublicId}`);
      } catch (err) {
        console.warn(`⚠️ Failed to delete original after rename: ${err.message}`);
      }
    }

    // ✅ Tag the file (optional)
    await cloudinary.uploader.add_tag('archived', newPath, {
      resource_type: resourceType,
    });


      // 💾 Save to Archive DB
      const archivedUrl = buildCloudinaryUrl(newPath);
      await Archive.create({
        originalCollection,
        originalId: documentId,
        fieldName,
        data: {
          [fieldName]: archivedUrl,
          ...extraData, // ✅ Now inside data
          },
        }), 

      console.log('🧾 Archive metadata:', {
        [fieldName]: archivedUrl,
        ...extraData,
      });
      

      console.log('✅ Cloudinary file archived →', newPath);
      console.log('✅ File archived to:', archivedUrl);

      return archivedUrl;
    } catch (err) {
      console.error('❌ archiveField error:', err);
      throw new Error(`Archiving failed for ${fieldName}: ${err.message}`);
    }
  };


const archiveDocument = async (originalCollection, documentId, documentData) => {
  try {
    // Create a new archive entry for the document
    await Archive.create({
      originalCollection,
      originalId: documentId,
      fieldName: 'document', // Indicate this is the entire document
      data: documentData, // Store the entire document data
    });

    console.log(`Document archived: ${originalCollection} (ID: ${documentId})`);

    // Delete the document from its original collection
    const OriginalModel = require(`../models/${originalCollection}`);
    await OriginalModel.findByIdAndDelete(documentId);
  } catch (err) {
    console.error('Error during document archiving:', err);
    throw new Error(`Archiving failed for document: ${err.message}`);
  }
};


  const archiveMarkerIcon = async (markerIconId) => {
    try {
      const markerIcon = await MarkerIcon.findById(markerIconId);
      if (!markerIcon || !markerIcon.iconPath.includes('cloudinary.com')) {
        throw new Error(`Valid MarkerIcon not found with Cloudinary path: ${markerIconId}`);
      }

      const publicId = extractPublicId(markerIcon.iconPath);
      if (!publicId) throw new Error('Failed to extract public_id');

      const fileName = publicId.split('/').pop();
      const archiveFolder = getArchiveFolderByType('MarkerIcon');
      const newPath = `${archiveFolder}/archivedIcon-$${fileName}`;

      console.log('📤 Archiving marker icon to:', newPath);

      // 🔁 Rename (move) image to archive folder in Cloudinary
      await cloudinary.uploader.rename(publicId, newPath, {
        overwrite: true,
        invalidate: true
      });

      // 🏷️ Add "archived" tag for reference
      await cloudinary.uploader.add_tag('archived', newPath);

      // 📦 Store archive reference
      const archivedUrl = buildCloudinaryUrl(newPath);
      await Archive.create({
        originalCollection: 'MarkerIcon',
        originalId: markerIcon._id,
        fieldName: 'iconPath',
        data: { name: markerIcon.name, iconPath: archivedUrl }
      });

      // ❌ Delete original MarkerIcon record
      await MarkerIcon.findByIdAndDelete(markerIconId);

      console.log(`✅ MarkerIcon archived successfully: ${markerIconId}`);
    } catch (err) {
      console.error('❌ Error archiving MarkerIcon:', err.message);
      throw new Error(`Archiving failed for MarkerIcon ID ${markerIconId}: ${err.message}`);
    }
  };

module.exports = { archiveField,  archiveDocument , archiveMarkerIcon};
