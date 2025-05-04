// archiveRoutes.js

const express = require('express');
const { archiveField , archiveDocument , archiveMarkerIcon } = require('../utility/archiveUtils');
const Card = require('../models/Cards');  // Assuming you're using a Card model
const Modal = require('../models/Modal');
const Audio = require('../models/Audio');
const User = require('../models/User');
const NewsEvent = require('../models/NewsEvent');
const AboutUs = require('../models/AboutUs');
const Archive = require('../models/Archive');
const MarkerIcon = require('../models/MarkerIcon');
const { getArchiveFolderByType , cloudinary} = require('../utility/cloudinaryConfig');
const { extractPublicId} = require('../utility/claudinaryHelpers'); 



const router = express.Router();

// Get  10 archived items (limited)
router.get('/archivesData', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10; // Default to 10 if not specified
  try {
      const archives = await Archive.find()
          .sort({ archivedAt: -1 })
          .limit(limit);
      res.status(200).json(archives);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching archives', error });
  }
});

// Archive card image by ID
router.put('/cards/:id', async (req, res) => {
  console.log('📥 Archive Route Hit:', req.params.id);

  const card = await Card.findById(req.params.id);
  if (!card || !card.image) {
    return res.status(404).json({ message: '❌ Image not found for archiving' });
  }

  console.log('📦 Archiving image from:', card.image);

  // ⬇️ Proceed with moving the image
  const archivedUrl = await archiveField('Cards', card._id, 'image', card.image, {
    areaName: card.areaName || 'Unknown Area'
  });

  card.image = null;
  card.imageArchived = true;
  await card.save();

  console.log('✅ Image archived to:', archivedUrl);
  res.status(200).json({ message: 'Image archived successfully', archivedUrl });
});



// Archive modal image by ID
router.put('/modal/:id', async (req, res) => {
  const { imagePath } = req.body;

  try {
    const modal = await Modal.findById(req.params.id);
    if (!modal || !imagePath) {
      return res.status(404).json({ message: 'Image or Modal not found for archiving' });
    }

    const imageIndex = modal.modalImages.findIndex(img => img === imagePath);
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found in modalImages array' });
    }

    // Include index in archive metadata
    await archiveField('Modal', modal._id, 'modalImages', imagePath, {
      originalIndex: imageIndex,
      areaName: modal.title || 'Unknown Area'
    });

    modal.modalImages.splice(imageIndex, 1);

    if (modal.modalImages.length === 0) {
      modal.imageArchived = true;
    }

    await modal.save();

    res.status(200).json({ message: 'Modal image archived successfully' });
  } catch (error) {
    console.error('Error archiving modal image:', error);
    res.status(500).json({ error: 'Failed to archive modal image' });
  }
});



// Archive audio by ID using Cloudinary
// 🔁 Archive Audio with metadata
router.put('/audio/:id', async (req, res) => {
  const { englishUrl, filipinoUrl } = req.body;
  const audio = await Audio.findById(req.params.id);

  if (!audio) {
    return res.status(404).json({ message: 'Audio not found for archiving' });
  }

  try {
    // 🧾 Archive English Audio if URL exists
    if (englishUrl) {
      console.log('📦 Archiving English Audio:', englishUrl);

      await archiveField('Audio', audio._id, 'englishAudio', englishUrl, {
        originalName: audio.englishOriginalName || '',
        format: audio.format || '',
        areaName: audio.title,
      });

      audio.englishAudio = null;
      audio.englishOriginalName = '';
    }

    // 🧾 Archive Filipino Audio if URL exists
    if (filipinoUrl) {
      console.log('📦 Archiving Filipino Audio:', filipinoUrl);

      await archiveField('Audio', audio._id, 'filipinoAudio', filipinoUrl, {
        originalName: audio.filipinoOriginalName || '',
        format: audio.format || '',
        areaName: audio.title,
      });

      audio.filipinoAudio = null;
      audio.filipinoOriginalName = '';
    }

    // ✅ If both are archived, set main flag
    if (!audio.englishAudio && !audio.filipinoAudio) {
      audio.audioArchived = true;
    }

    await audio.save();

    res.status(200).json({ message: 'Audio archived successfully' });
  } catch (error) {
    console.error('❌ Error archiving audio:', error);
    res.status(500).json({ message: 'Error archiving audio' });
  }
});




router.put('/newsEvent/image/:filename', async (req, res) => {
  const { filename } = req.params;
  console.log('Archiving NewsEvent image:', filename);

  try {
    const newsEvent = await NewsEvent.findOne();
    if (!newsEvent) {
      return res.status(404).json({ message: 'NewsEvent document not found' });
    }

    // Find the full Cloudinary image URL that includes the given filename
    const imageIndex = newsEvent.images.findIndex(img => img.includes(filename));
    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found for archiving' });
    }

    const imageUrl = newsEvent.images[imageIndex]; // ✅ Cloudinary URL
    const header = newsEvent.newsHeader?.[imageIndex] || null;
    const description = newsEvent.description?.[imageIndex] || null;

    // 🗃️ Archive the image URL with header/description as extra data
    await archiveField('NewsEvent', newsEvent._id, 'images', imageUrl, {
      header,
      description,
      originalIndex: imageIndex
    });

    // 🧹 Remove image + its header/description from arrays
    newsEvent.images.splice(imageIndex, 1);
    if (newsEvent.newsHeader) newsEvent.newsHeader.splice(imageIndex, 1);
    if (newsEvent.description) newsEvent.description.splice(imageIndex, 1);

    // 🏁 If no more images, flag as archived
    if (newsEvent.images.length === 0) {
      newsEvent.imageArchived = true;
    }

    await newsEvent.save();

    res.status(200).json({ message: 'Image, header, and description archived successfully' });
  } catch (error) {
    console.error('Error during NewsEvent image archiving:', error);
    res.status(500).json({ error: error.message });
  }
});




  // Archive AboutUs image
  router.put('/aboutUs', async (req, res) => {
    const { imagePath } = req.body;
    console.log('Archive AboutUs Image Hit:', imagePath);

    try {
      // Find the single AboutUs document
      const aboutUs = await AboutUs.findOne();

      if (!aboutUs) {
        return res.status(404).json({ message: 'AboutUs document not found' });
      }

      // Check if the provided image matches
      if (aboutUs.image !== imagePath) {
        return res.status(400).json({ message: 'Provided image path does not match' });
      }

      // Archive the image and update the document
      const archivedImagePath = await archiveField('AboutUs', aboutUs._id, 'image', imagePath); // Ensure using _id
      aboutUs.image = null; // Set the image field to null
      aboutUs.isArchived = true; // Add an archive flag if needed

      await aboutUs.save();
      res.status(200).json({ message: 'Image archived successfully', archivedImagePath });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

  // Archive MarkerIcon document data by Id
  router.put('/markerIcon/:id', async (req, res) => {
    try {
      const markerIconId = req.params.id;
      await archiveMarkerIcon(markerIconId);
      res.status(200).json({ message: 'MarkerIcon archived successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Error archiving MarkerIcon', error });
    }
  });


// Archive a user account by ID
router.put('/user/:id', async (req, res) => {
  const { id } = req.params;  // Get the user ID from the request params

  try {
      const user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ message: 'User not found for archiving' });
      }

      console.log('Archiving user account:', user);

      // Archive the user account
      await archiveDocument('User', user._id, user.toObject());

      res.status(200).json({ message: 'User account archived successfully' });
  } catch (error) {
      console.error('Error during user account archiving:', error);
      res.status(500).json({ error: error.message });
  }
});



module.exports = router;
