// Import necessary modules
const express = require('express');
const multer = require('multer');   // Used for handling file uploads
const path = require('path');       // Used to manage file paths
const Modal = require('../models/Modal');  // Import the Modal model
const router = express.Router();     // Initialize Express router
const { cloudinary, storage, getFolderByType } = require('../utility/cloudinaryConfig');
const {extractPublicId} = require('../utility/claudinaryHelpers');



// Set file filtering for allowed image types (JPEG and PNG)
const fileFilter = (req, file, cb) => {
  // Define allowed file types using regex
  const allowedTypes = /jpeg|jpg|png/;
  // Check both file extension and MIME type
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  // If both extension and MIME type are valid, accept the file
  if (mimetype && extname) {
    return cb(null, true);
  }
  // Reject the file if it's not an accepted format
  cb(new Error('Unsupported file format'));
};

// Set up multer for file uploads with filters and file size limit
const upload = multer({
  storage: storage,  // Use the storage settings defined above
  fileFilter: fileFilter,  // Apply the file filter function
  limits: { fileSize: 1024 * 1024 * 5 }  // Limit file size to 5MB
});



// Get modal by ID
router.get('/:id', async (req, res) => {
  try {
    const modal = await Modal.findById(req.params.id);
    if (!modal) {
      return res.status(404).json({ message: 'Modal not found' });
    }
    res.status(200).json(modal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Get all modal data
router.get('/', async (req, res) => {
  try {
    const modals = await Modal.find(); // Fetch all modals
    res.json(modals);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching modals' });
  }
});

  // Upload modal images (up to 10)
  router.post('/:id', (req, res, next) => {
    req.uploadType = 'modal';
    next();
  }, upload.array('modalImages', 10), async (req, res) => {
    const { id } = req.params;
    const imagePaths = req.files.map(file => file.path); // Use Cloudinary URLs

    try {
      const modal = await Modal.findById(id);
      if (!modal) {
        return res.status(404).json({ message: 'Modal not found' });
      }

      if (!modal.modalImages) modal.modalImages = [];
      modal.modalImages.push(...imagePaths);

      const updatedModal = await modal.save();
      res.status(200).json(updatedModal);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  });

  // Replace image at index
  router.put('/:id/updateImage', (req, res, next) => {
    req.uploadType = 'modal';
    next();
  }, upload.single('modalImage'), async (req, res) => {
    const { id } = req.params;
    const { imageIndex } = req.body;

    try {
      const modal = await Modal.findById(id);
      if (!modal) return res.status(404).json({ message: 'Modal not found' });
      if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
      if (!modal.modalImages || !modal.modalImages[imageIndex]) {
        return res.status(400).json({ message: 'Invalid image index' });
      }

      // Delete old Cloudinary image
      const oldPublicId = extractPublicId(modal.modalImages[imageIndex]);
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
      }

      modal.modalImages[imageIndex] = req.file.path;
      const updatedModal = await modal.save();

      res.status(200).json(updatedModal);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  });

// Update modal description and technologies by ID
router.put('/:id/description', async (req, res) => {
  const { id } = req.params;
  const { description, technologies } = req.body;

  try {
    const modal = await Modal.findById(id);
    if (!modal) {
      return res.status(404).json({ message: 'Modal not found' });
    }

    // Update the description field
    modal.description = description;
    modal.technologies = technologies;

    // Save the updated modal
    const updatedModal = await modal.save();

    res.status(200).json({ message: 'Description updated successfully', modal: updatedModal });
  } catch (error) {
    console.error('Error updating description:', error);
    res.status(500).json({ message: error.message });
  }
});





module.exports = router;  // Export the router for use in the main app
