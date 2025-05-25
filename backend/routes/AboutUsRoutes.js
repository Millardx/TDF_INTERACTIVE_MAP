// routes/aboutUsRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const AboutUs = require('../models/AboutUs');
const { cloudinary, getFolderByType, storage } = require('../utility/cloudinaryConfig');
const { extractPublicId } = require('../utility/claudinaryHelpers');
const path = require('path');

// ✅ File filter (optional, reusing Card setup)
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = allowedMimeTypes.includes(file.mimetype);
  const isValidExt = allowedExtensions.includes(ext);

  cb(null, isValidMime && isValidExt);
};

// ✅ Use shared Cloudinary `storage`
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});


// Fetch About Us details
router.get('/', async (req, res) => {
    try {
        const aboutUs = await AboutUs.findOne();
        res.json(aboutUs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update About Us details
router.put('/', async (req, res) => {
    const { historicalBackground, vision, mission, goal, objectives } = req.body;

    // Check if any field is missing
    if (!historicalBackground || !vision || !mission || !goal || !objectives) {
        return res.status(400).json({ message: 'All fields (historicalBackground, vision, mission, goal, objectives) are required.' });
    }

    try {
        let aboutUs = await AboutUs.findOne();
        if (!aboutUs) {
            // If About Us record does not exist, create a new one
            aboutUs = new AboutUs({ historicalBackground, vision, mission, goal, objectives });
        } else {
            // Check if there's any change before updating
            const changes = {
                historicalBackground,
                vision,
                mission,
                goal,
                objectives
            };

            const hasChanges = Object.keys(changes).some(
                (key) => aboutUs[key] !== changes[key]
            );

            if (!hasChanges) {
                return res.status(400).json({ message: 'No changes detected in the data.' });
            }

            // If there are changes, update the About Us data
            aboutUs.historicalBackground = historicalBackground;
            aboutUs.vision = vision;
            aboutUs.mission = mission;
            aboutUs.goal = goal;
            aboutUs.objectives = objectives;
        }

        await aboutUs.save();
        res.json(aboutUs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/image', upload.single('image'), async (req, res) => {
    try {
      const aboutUs = await AboutUs.findOne();
      if (!aboutUs) {
        return res.status(404).json({ message: 'About Us data not found' });
      }
  
      if (!req.file || !req.file.path) {
        return res.status(400).json({ message: 'No image file provided' });
      }
  
      // 🧹 Delete old Cloudinary image if exists
      if (aboutUs.image) {
        const oldPublicId = extractPublicId(aboutUs.image);
        await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
      }
  
      // 💾 Save new Cloudinary image URL
      aboutUs.image = req.file.path;
      await aboutUs.save();
  
      res.json({ message: 'Image updated successfully', image: req.file.path });
    } catch (error) {
      console.error('❌ Error updating About Us image:', error);
      res.status(500).json({ message: 'Failed to update About Us image', error: error.message });
    }
  });
  


module.exports = router;
