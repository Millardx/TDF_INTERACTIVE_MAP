const express = require('express');
const multer = require('multer');
const MarkerIcon = require('../models/MarkerIcon'); // Assuming a MarkerIcon model exists
const fs = require('fs');
const path = require('path');
const router = express.Router();
const ensureUploadPathExists = require('../utility/ensureUploadPathExists');
const { cloudinary, storage, getFolderByType } = require('../utility/cloudinaryConfig');
const { extractPublicId, buildCloudinaryUrl } = require('../utility/claudinaryHelpers');



// Set req.uploadType = 'icons' before upload
router.use((req, res, next) => {
  req.uploadType = 'icons';
  next();
});


// Multer configuration
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only image files (png, jpeg, jpg, svg) are allowed!'));
    }
    cb(null, true);
  },
});


// Fetch all marker icons
router.get('/', async (req, res) => {
    try {
      const icons = await MarkerIcon.find();
      res.status(200).json(icons);
    } catch (err) {
      console.error('Error fetching marker icons:', err);
      res.status(500).json({ error: 'Error fetching marker icons' });
    }
  });

  // Fetch a specific marker icon by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
      const icon = await MarkerIcon.findById(id);
      if (!icon) {
          return res.status(404).json({ error: 'Marker icon not found' });
      }
      res.status(200).json(icon);
  } catch (err) {
      console.error('Error fetching marker icon:', err);
      res.status(500).json({ error: 'Error fetching marker icon' });
  }
});

 // 🟡 CREATE marker icon
router.post('/Icon', upload.single('icon'), async (req, res) => {
  const { name } = req.body;

  try {
    if (!name || !req.file) throw new Error('Name and icon are required');

    const newIcon = new MarkerIcon({
      name,
      iconPath: req.file.path, // ✅ Full Cloudinary URL
    });

    await newIcon.save();
    res.status(201).json({ message: 'New marker icon created!', data: newIcon });
  } catch (err) {
    console.error('Error creating marker icon:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 🟡 UPDATE marker icon (name + optional icon replacement)
router.put('/Icon/:id', upload.single('icon'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  try {
    let icon = await MarkerIcon.findById(id);
    if (!icon) return res.status(404).json({ error: 'Marker icon not found' });

    // ✅ Delete old icon if new one uploaded
    if (req.file && icon.iconPath) {
      const oldPublicId = extractPublicId(icon.iconPath);
      if (oldPublicId) {
        try {
          await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
          console.log('✅ Old icon deleted:', oldPublicId);
        } catch (err) {
          console.warn('⚠️ Failed to delete old icon:', err.message);
        }
      }
    }

    // ✅ Update fields
    icon.name = name || icon.name;
    if (req.file) {
      icon.iconPath = req.file.path;
    }

    await icon.save();
    res.status(200).json({ message: 'Marker icon updated successfully', data: icon });
  } catch (err) {
    console.error('Error updating marker icon:', err.message);
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
