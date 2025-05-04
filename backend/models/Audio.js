// models/Audio.js

const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
  title: { type: String },
  englishAudio: { type: String, default: null },      // Cloudinary URL
  filipinoAudio: { type: String, default: null },     // Cloudinary URL
  englishOriginalName: { type: String, default: null }, // Original filename
  filipinoOriginalName: { type: String, default: null }, // Original filename
  format: { type: String, default: null },
  audioArchived: { type: Boolean, default: false }
});



const Audio = mongoose.model('Audio', audioSchema);

module.exports = Audio;
