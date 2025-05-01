// routes/cardRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Card = require('../models/Cards');
const ensureUploadPathExists = require('../utility/ensureUploadPathExists');
const { storage } = require('../utility/cloudinaryConfig'); // Adjust path as needed



// // Set up multer storage configuration for file uploads
// const storage = multer.diskStorage({
//   // Destination folder for uploaded files
//   destination: (req, file, cb) => {
//     const uploadPath = 'uploads/cardsImg';

//     // Create directory if it doesn't exist
//     ensureUploadPathExists(uploadPath); // 📦 Check/create before upload
//     cb(null, uploadPath);
//   },
//   // Generate a unique filename for the uploaded file using the current timestamp
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });


  // File filter function to allow only specific image formats
  // This function checks the file's MIME type and extension to ensure it's an image
  const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .png, and .gif image files are allowed!'), false);
    }
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

  // // PUT route to update a card by ID
  // router.put('/:id', upload.single('image'), async (req, res) => {
  //   console.log('Updating card with ID:', req.params.id);
  //   try {
  //     const card = await Card.findById(req.params.id); // Find card by ID
      
  //     if (!card) {
  //       return res.status(404).json({ error: 'Card not found' });
  //     }

  //     const { areaName, areaLocation, quickFacts } = req.body;
  //     const newImage = req.file ? req.file.filename : card.image; // New image if uploaded

  //     // Only delete the old image if a new one is uploaded and they are different
  //     if (req.file && card.image && newImage !== card.image) {
  //       const oldImagePath = path.join(__dirname, '..', 'uploads', 'cardsImg', card.image);
  //       if (fs.existsSync(oldImagePath)) {
  //         fs.unlinkSync(oldImagePath); // Delete the old image file
  //       }
  //     }

  //     // Cloudinary image URL
  //   const newImageUrl = req.file ? req.file.path : card.image; 

  //     // Update card fields
  //     card.areaName = areaName; // Update area name
  //     card.areaLocation = areaLocation, //Update area location
  //     card.quickFacts = quickFacts; // Update quick facts
  //     if (newImageUrl) card.image = newImageUrl; // Update image URL with the Cloudnary URL

  //     await card.save(); // Save the updated card

  //     res.json({ message: 'Card updated successfully', card });
  //   } catch (error) {
  //     console.error('Error updating card:', error);
  //     res.status(500).json({ error: 'Server error while updating card' });
  //   }
  // });

  // PUT route to update a card by ID with Cloudinary image upload
  router.put('/:id', (req, res, next) => {
    req.uploadType = 'cards'; // ✅ Set Cloudinary folder via config
    next();
  }, upload.single('image'), async (req, res) => {
    console.log('Updating card with ID:', req.params.id);
    try {
      const card = await Card.findById(req.params.id);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      const { areaName, areaLocation, quickFacts } = req.body;

      // ✅ Use Cloudinary image URL if uploaded, otherwise keep the existing one
      const newImageUrl = req.file ? req.file.path : card.image;

      // ✅ Update card fields
      card.areaName = areaName;
      card.areaLocation = areaLocation;
      card.quickFacts = quickFacts;
      card.image = newImageUrl;

      await card.save(); // Save changes

      res.json({ message: 'Card updated successfully', card });
    } catch (error) {
      console.error('Error updating card:', error);
      res.status(500).json({ error: 'Server error while updating card' });
    }
  });

  
  router.delete('/:id/image', async (req, res) => {
    try {
      const card = await Card.findById(req.params.id);
      if (!card || !card.image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      const imagePath = path.join(__dirname, '..', card.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      card.image = null; // Set image path to null
      await card.save();

      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({ message: 'Error deleting image' });
    }
  });

  // Export the router
  module.exports = router;
