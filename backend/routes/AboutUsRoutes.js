// routes/aboutUsRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const AboutUs = require('../models/AboutUs');
const { cloudinary, getFolderByType } = require('../utility/cloudinaryConfig');
const { extractPublicId, buildCloudinaryUrl } = require('../utility/claudinaryHelpers');




    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
        cb(null, 'uploads/images'); // or any temp path you want
        },
        filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
        },
    });
    
    const upload = multer({
        storage,
        fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
        },
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

// ✅ Update About Us image using Cloudinary and multer disk storage
router.put('/image', upload.single('image'), async (req, res) => {
    try {
      const aboutUs = await AboutUs.findOne();
  
      if (!aboutUs) {
        return res.status(404).json({ message: 'About Us data not found' });
      }
  
      if (!req.file || !req.file.path) {
        return res.status(400).json({ message: 'No image file provided' });
      }
  
      // 📤 Upload new image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: getFolderByType('aboutus'),
      });
  
      // 🧹 Delete old Cloudinary image if exists
      if (aboutUs.image) {
        const oldPublicId = extractPublicId(aboutUs.image);
        await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
      }
  
      // 💾 Save new Cloudinary image URL to DB
      aboutUs.image = result.secure_url;
      await aboutUs.save();
  
      res.json({ message: 'Image updated successfully', image: result.secure_url });
    } catch (error) {
      console.error('❌ Error updating About Us image:', error);
      res.status(500).json({ message: 'Failed to update About Us image', error: error.message });
    }
  });
  


module.exports = router;
