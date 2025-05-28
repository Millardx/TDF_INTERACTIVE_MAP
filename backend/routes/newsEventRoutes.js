const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const NewsEvent = require('../models/NewsEvent');
const router = express.Router();
const { cloudinary, getFolderByType } = require('../utility/cloudinaryConfig');
const { extractPublicId } = require('../utility/claudinaryHelpers');


// 🧠 Use memory storage for Cloudinary
const storage = multer.memoryStorage();
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



// Get all images (GET)
router.get('/', async (req, res) => { // Removed /api/images from the path
    try {
        const images = await NewsEvent.find();
        res.status(200).json(images);
    } catch (error) {
        res.status(500).json({ message: "Error fetching images", error });
    }
});

// Get specific image document by ID (GET)
router.get('/:id', async (req, res) => { // Removed /api/images from the path
    try {
        const { id } = req.params;
        const imageDoc = await NewsEvent.findById(id);

        if (!imageDoc) {
            return res.status(404).json({ message: "Images not found" });
        }

        res.status(200).json(imageDoc);
    } catch (error) {
        res.status(500).json({ message: "Error fetching image", error });
    }
});



// // ➕ Upload new images to Cloudinary
// router.post('/', upload.array('images', 10), async (req, res) => {
//     try {
//       const folder = getFolderByType('news');
//       const uploadPromises = req.files.map(file =>
//         cloudinary.uploader.upload_stream({ folder }).end(file.buffer)
//       );
  
//       const results = await Promise.allSettled(
//         req.files.map(file =>
//           new Promise((resolve, reject) => {
//             cloudinary.uploader.upload_stream({ folder }, (err, result) => {
//               if (err) reject(err);
//               else resolve(result.secure_url);
//             }).end(file.buffer);
//           })
//         )
//       );
  
//       const uploadedUrls = results
//         .filter(r => r.status === 'fulfilled')
//         .map(r => r.value);
  
//       const numNew = uploadedUrls.length;
  
//       let imageDoc = await NewsEvent.findOne();
//       if (imageDoc) {
//         imageDoc.images.push(...uploadedUrls);
//         imageDoc.newsHeader.push(...Array(numNew).fill(null));
//         imageDoc.description.push(...Array(numNew).fill(null));
//         await imageDoc.save();
//         return res.status(200).json(imageDoc);
//       } else {
//         const newDoc = new NewsEvent({
//           images: uploadedUrls,
//           newsHeader: Array(numNew).fill(null),
//           description: Array(numNew).fill(null),
//         });
//         await newDoc.save();
//         return res.status(201).json(newDoc);
//       }
//     } catch (error) {
//       console.error('❌ Error uploading images:', error);
//       res.status(500).json({ message: 'Upload failed', error });
//     }
//   });
// ➕ Upload new images to Cloudinary (now with author + datePosted)
router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const folder = getFolderByType('news');

    const results = await Promise.allSettled(
      req.files.map(file =>
        new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ folder }, (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
          }).end(file.buffer);
        })
      )
    );

    const uploadedUrls = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    const numNew = uploadedUrls.length;

    // ✅ Get author and datePosted arrays from frontend
    const authorArray = JSON.parse(req.body.author || '[]');
    const datePostedArray = JSON.parse(req.body.datePosted || '[]');

    let imageDoc = await NewsEvent.findOne();
    if (imageDoc) {
      imageDoc.images.push(...uploadedUrls);
      imageDoc.newsHeader.push(...Array(numNew).fill(null));
      imageDoc.description.push(...Array(numNew).fill(null));
      imageDoc.datePosted.push(...datePostedArray);
      imageDoc.author.push(...authorArray);
      await imageDoc.save();
      return res.status(200).json(imageDoc);
    } else {
      const newDoc = new NewsEvent({
        images: uploadedUrls,
        newsHeader: Array(numNew).fill(null),
        description: Array(numNew).fill(null),
        datePosted: datePostedArray,
        author: authorArray,
      });
      await newDoc.save();
      return res.status(201).json(newDoc);
    }
  } catch (error) {
    console.error('❌ Error uploading images:', error);
    res.status(500).json({ message: 'Upload failed', error });
  }
});



// ✅ Update a specific image (Cloudinary + Memory Storage)
router.put('/uploads/images/:filename', upload.single('image'), async (req, res) => {
    try {
      const { filename } = req.params;
  
      const doc = await NewsEvent.findOne();
      if (!doc || !doc.images || !Array.isArray(doc.images)) {
        return res.status(404).json({ message: 'NewsEvent document not found or images missing' });
      }
  
      const imageIndex = doc.images.findIndex(img => img.includes(filename));
      if (imageIndex === -1) {
        return res.status(404).json({ message: 'Image filename not found' });
      }
  
      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ message: 'No image buffer provided' });
      }
  
      // 🧹 Delete old Cloudinary image
      const oldPublicId = extractPublicId(doc.images[imageIndex]);
      await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
  
      // 📤 Upload new image to Cloudinary from memory buffer
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: getFolderByType('news') },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(req.file.buffer);
      });
  
      // 💾 Update image URL in DB
      doc.images[imageIndex] = uploadResult.secure_url;
      await doc.save();
  
      res.status(200).json({
        message: 'Image updated successfully',
        images: doc.images
      });
    } catch (error) {
      console.error('❌ Error updating NewsEvent image:', error);
      res.status(500).json({ message: 'Error updating NewsEvent image', error: error.message });
    }
  });
  
  
  


// Backend route for updating header and description
router.put('/updateNews', async (req, res) => {
    try {
        const updatedData = req.body; // Array of objects containing the filename, header, and description
        const document = await NewsEvent.findOne({}); // Assuming you have one document to update

        // If document doesn't exist, return an error
        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        // Check if any changes are being sent
        let hasChanges = false;

        updatedData.forEach(({ filename, newsHeader, description }) => {
            const imageIndex = document.images.findIndex(img => img === filename);
            if (imageIndex !== -1) {
                // Compare existing and updated values
                if (
                    document.newsHeader[imageIndex] !== newsHeader ||
                    document.description[imageIndex] !== description
                ) {
                    hasChanges = true;
                }
            }
        });

        if (!hasChanges) {
            // If no changes, return early
            return res.status(400).json({ message: "No changes detected. Nothing was saved." });
        }

        // Apply the updates if changes exist
        updatedData.forEach(({ filename, newsHeader, description }) => {
            const imageIndex = document.images.findIndex(img => img === filename);
            if (imageIndex !== -1) {
                document.newsHeader[imageIndex] = newsHeader;
                document.description[imageIndex] = description;
            }
        });

        // Save the updated document
        await document.save();

        res.status(200).json({ message: "Successfully updated news." });
    } catch (error) {
        console.error("Error updating images:", error);
        res.status(500).json({ message: "Error updating images", error });
    }
});


module.exports = router;
