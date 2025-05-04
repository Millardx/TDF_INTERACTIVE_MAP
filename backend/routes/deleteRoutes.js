const fs = require('fs');
const path = require('path');
const Archive = require('../models/Archive');
const express = require('express');
const { cloudinary } = require('../utility/cloudinaryConfig');
const { extractPublicId } = require('../utility/claudinaryHelpers');

const router = express.Router();

const folderMapping = {
  Cards: 'cardsImg',
  Modal: 'modalImages',
  Audio: 'audio',
  NewsEvent: 'images',
  User: null,   
  MarkerIcon: 'icons',

  // Add other mappings as needed
};

    router.delete('/archive/:archiveId', async (req, res) => {
        const { archiveId } = req.params;
    
        try {
        const archive = await Archive.findById(archiveId);
        if (!archive) {
            return res.status(404).json({ error: 'Archive entry not found' });
        }
    
        const { originalCollection, fieldName, data } = archive;
        const folder = folderMapping[originalCollection];
    
        console.log('🔍 Deleting archive for collection:', originalCollection);
    
        // Determine the Cloudinary file path
        let fileUrl = null;
    
        if (originalCollection === 'MarkerIcon') {
            fileUrl = data.iconPath;
        } else {
            fileUrl = data[fieldName];
        }
    
        if (!fileUrl || !fileUrl.includes('cloudinary.com')) {
            console.log('⚠️ No valid Cloudinary file to delete. Skipping.');
        } else {
            const publicId = extractPublicId(fileUrl);
    
            if (publicId) {
            try {
                await cloudinary.uploader.destroy(publicId, { invalidate: true });
                console.log(`🗑️ Cloudinary file deleted: ${publicId}`);
            } catch (cloudErr) {
                console.warn('⚠️ Cloudinary delete failed:', cloudErr.message);
            }
            }
        }
    
        // Delete the Archive entry in MongoDB
        await archive.deleteOne();
        console.log(`✅ Archive entry deleted: ${archiveId}`);
        res.json({ message: 'Archive entry and Cloudinary file deleted successfully' });
    
        } catch (error) {
        console.error('❌ Archive deletion error:', error.message);
        res.status(500).json({ error: error.message });
        }
    });
  

    
module.exports = router;
