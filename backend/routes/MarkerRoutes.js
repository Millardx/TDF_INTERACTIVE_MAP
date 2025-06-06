const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Marker = require('../models/Marker');
const Card = require('../models/Cards');
const Modal = require('../models/Modal');
const Audio = require('../models/Audio');



// Local db exlusive. Remove if using cloud db (quickfix)
router.post('/addMarker', async (req, res) => {
  let session;
  try {
    const { areaName, worldPosition, iconType } = req.body;

    if (!areaName || !worldPosition || !iconType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const isReplicaSet = await mongoose.connection.db.admin().command({ replSetGetStatus: 1 }).catch(() => null);
    if (isReplicaSet) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    const newAudio = new Audio({ title: `${areaName}`, originalName: '' });
    const savedAudio = await newAudio.save(session ? { session } : undefined);

    const newModal = new Modal({
      audio_id: savedAudio._id,
      title: `${areaName} `,
      description: `Description of ${areaName}`,
      technologies: `Technologies used in ${areaName}`,
    });
    const savedModal = await newModal.save(session ? { session } : undefined);

    const newCard = new Card({
      modal_id: savedModal._id,
      areaName,
      quickFacts: `Quick facts about ${areaName}`,
      iconType: `${iconType}`,
    });
    const savedCard = await newCard.save(session ? { session } : undefined);

    const newMarker = new Marker({
      areaName,
      worldPosition,
      iconType,
      card: savedCard._id,
      modal: savedModal._id,
      audio: savedAudio._id,
    });
    const savedMarker = await newMarker.save(session ? { session } : undefined);

    if (session) {
      await session.commitTransaction();
    }

    res.status(201).json({
      message: 'Marker and related documents created successfully',
      marker: savedMarker,
      card: savedCard,
      modal: savedModal,
      audio: savedAudio,
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    if (session) {
      session.endSession();
    }
  }
});

  

// Fetch all markers
router.get('/markerData', async (req, res) => {
  try {
    const markers = await Marker.find({})
      .populate('card modal audio')
      .sort({ createdAt: -1 }); // 🆕 Sort newest first
    res.status(200).json(markers);
  } catch (err) {
    console.error('Error fetching markers:', err);
    res.status(500).json({ message: 'Error fetching markers' });
  }
});


router.delete('/:id', async (req, res) => {
  const markerId = req.params.id;

  try {
    // Find the marker
    const marker = await Marker.findById(markerId);
    if (!marker) {
      return res.status(404).json({ message: 'Marker not found' });
    }

    // Conditional deletion of related documents
    const deleteOperations = [];
    if (marker.card) deleteOperations.push(Card.findByIdAndDelete(marker.card));
    if (marker.modal) deleteOperations.push(Modal.findByIdAndDelete(marker.modal));
    if (marker.audio) deleteOperations.push(Audio.findByIdAndDelete(marker.audio));

    await Promise.all(deleteOperations);

    // Delete the marker itself
    await Marker.findByIdAndDelete(markerId);

    res.status(200).json({ message: 'Marker and related documents deleted successfully' });
  } catch (err) {
    console.error('Error deleting marker:', err);
    res.status(500).json({ message: 'Error deleting marker and related documents', error: err.message });
  }
});

// Update marker and related documents
router.put('/:id', async (req, res) => {
  const markerId = req.params.id;
  const { areaName, iconType } = req.body;

  try {
    // Find the marker by its ID
    const marker = await Marker.findById(markerId);
    if (!marker) {
      return res.status(404).json({ message: 'Marker not found' });
    }

    // Only update areaName if it's provided (not empty or undefined)
    if (areaName) {
      marker.areaName = areaName;
    }

    // Only update iconType if it's provided and is not an empty string
    if (iconType && iconType !== "") {
      marker.iconType = iconType;
    }

    // Save the updated marker
    await marker.save();

    // Update related documents (Card, Modal, Audio) if needed
    if (marker.card) {
      await Card.findByIdAndUpdate(marker.card, {
        areaName,
        ...(iconType && iconType !== "" && { iconType }) // Only update iconType if valid
      });
    }

    if (marker.modal) {
      await Modal.findByIdAndUpdate(marker.modal, { title: areaName });
    }

    if (marker.audio) {
      await Audio.findByIdAndUpdate(marker.audio, { title: areaName });
    }

    res.status(200).json({ message: 'Marker and related documents updated successfully' });
  } catch (err) {
    console.error('Error updating marker:', err);
    res.status(500).json({ message: 'Error updating marker and related documents' });
  }
});

//!! NEW ADDITION FOR SORTING
// GET /api/markers/sorted?sort=newest|oldest
router.get('/sorted', async (req, res) => {
  try {
    const sortDirection = req.query.sort === 'oldest' ? 1 : -1; // Default to newest first

    const markers = await Marker.find({}) // You can filter by `{ modal: { $ne: null } }` if needed
      .populate('modal card audio')
      .sort({ createdAt: sortDirection });

    res.status(200).json(markers);
  } catch (err) {
    console.error('Error fetching sorted markers:', err);
    res.status(500).json({ message: 'Error fetching sorted markers' });
  }
});



module.exports = router;
