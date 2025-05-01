const fs = require('fs'); // Use fs.promises for async handling
const path = require('path');
const Archive = require('../models/Archive');
const MarkerIcon = require('../models/MarkerIcon');

const folderMapping = {
  Cards: 'cardsImg', // Folder for card images
  Modal: 'modalImages', // Folder for modal images
  Audio: 'audios', // Folder for audio files (assuming directly in 'uploads')
  NewsEvent: 'images', // Folder for news/about us images
  AboutUs: 'images',
  MarkerIcon: 'icons',
};

const archiveField = async (originalCollection, documentId, fieldName, fieldData) => {
  try {
    // Use folder mapping to construct paths
    const folder = folderMapping[originalCollection];

    // Extract only the file name from fieldData if it contains a path
    const fileName = path.basename(fieldData);

    // Construct the corrected source and archive paths
    const sourcePath = path.join(__dirname, `../uploads/${folder}/`, fileName);
    const archivePath = path.join(__dirname, `../archives/${folder}/`, fileName);

    // Ensure the archive directory exists
    const archiveDir = path.dirname(archivePath);
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Move the file
    fs.renameSync(sourcePath, archivePath);
    console.log(`File archived: ${fileName}`);

    // Backup the field in the Archive collection
    await Archive.create({
      originalCollection,
      originalId: documentId,
      fieldName,
      data: { [fieldName]: fieldData },
    });
    console.log(`Record backed up to Archive collection for ${fieldName}`);
  } catch (err) {
    console.error('Error during archiving process:', err);
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
    // Find the marker icon by its ID
    const markerIcon = await MarkerIcon.findById(markerIconId);

    if (!markerIcon) {
      throw new Error(`MarkerIcon not found with ID: ${markerIconId}`);
    }

    // Get the icon file name (path to file in the uploads folder)
    const fileName = path.basename(markerIcon.iconPath);
    const sourcePath = path.join(__dirname, `../uploads/icons/`, fileName);

    // Check if the file exists before proceeding
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Icon file not found at path: ${sourcePath}`);
    }

    // Archive the MarkerIcon document (name and iconPath)
    const archivedData = {
      name: markerIcon.name,
      iconPath: markerIcon.iconPath,
    };

    // Archive the MarkerIcon document into the Archive collection
    await Archive.create({
      originalCollection: 'MarkerIcon',
      originalId: markerIcon._id,
      fieldName: 'markerIcon',
      data: archivedData,
    });

    console.log(`MarkerIcon archived: ${markerIconId}`);

    // Now move the icon file to the archive folder
    const archivePath = path.join(__dirname, `../archives/icons/`, fileName);

    // Ensure the archive directory exists
    const archiveDir = path.dirname(archivePath);
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    // Move the file from the original location to the archive folder
    fs.renameSync(sourcePath, archivePath);
    console.log(`MarkerIcon file archived: ${fileName}`);

    // Finally, delete the MarkerIcon document from the original collection
    await MarkerIcon.findByIdAndDelete(markerIconId);
    console.log(`MarkerIcon document deleted from collection: ${markerIconId}`);

  } catch (err) {
    console.error('Error during MarkerIcon archiving:', err);
    throw new Error(`Archiving failed for MarkerIcon ID ${markerIconId}: ${err.message}`);
  }
};


module.exports = { archiveField,  archiveDocument , archiveMarkerIcon};
