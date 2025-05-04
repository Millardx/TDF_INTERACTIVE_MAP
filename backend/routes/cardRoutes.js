// routes/cardRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Card = require('../models/Cards');
const { storage } = require('../utility/cloudinaryConfig'); // Adjust path as needed
const { cloudinary } = require('../utility/cloudinaryConfig');
const { extractPublicId } = require('../utility/claudinaryHelpers');




  // File filter function to allow only specific image formats
  // This function checks the file's MIME type and extension to ensure it's an image
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  
  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const isValidMime = allowedMimeTypes.includes(file.mimetype);
    const isValidExt = allowedExtensions.includes(ext);
    
    cb(null, isValidMime && isValidExt);
  };
  
  
  // Initialize multer with the defined storage configuration and file size limit (5MB)
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter // ✅ Use the declared fileFilter here
  });

  // Get a specific card by ID
  router.get('/:id', async (req, res) => {
    try {
      const card = await Card.findById(req.params.id); // Fetch card by ID

      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all cards
  router.get('/', async (req, res) => {
    try {
      const cards = await Card.find();
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  
 
  // // PUT route to update a card by ID with Cloudinary image upload
  // For the cloud storage uploading
  router.put('/:id', (req, res, next) => {
    req.uploadType = 'cards';
    next();
  }, upload.single('image'), async (req, res) => {
    console.log('Updating card with ID:', req.params.id);

    try {
      const card = await Card.findById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const { areaName, areaLocation, quickFacts } = req.body;

      // ✅ Step 1: Delete old Cloudinary image
      if (req.file && card.image) {
        const oldPublicId = extractPublicId(card.image);
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
            console.log('✅ Old Cloudinary image deleted:', oldPublicId);
          } catch (err) {
            console.warn('⚠️ Failed to delete old image:', err.message);
          }
        }
      }

      // ✅ Step 2: Assign new image path if uploaded
      const newImageUrl = req.file ? req.file.path : card.image;

      // ✅ Step 3: Update card fields
      card.areaName = areaName;
      card.areaLocation = areaLocation;
      card.quickFacts = quickFacts;
      card.image = newImageUrl;

      await card.save();

      res.json({ message: 'Card updated successfully', card });
    } catch (error) {
      console.error('❌ Error updating card:', error);
      res.status(500).json({ error: 'Server error while updating card' });
    }
  });


  // Export the router
  module.exports = router;
