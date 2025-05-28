// models/newEvents.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    images: {
        type: [String], // Array of image URLs
        required: true,
    },
    newsHeader: {
        type: [String], // Array of headers, one for each image
    },
    description: {
        type: [String], // Array of descriptions, one for each image
    },
    imageArchived: {
        type: Boolean,
        default: false,
    },
    datePosted: {
        type: [Date], // ✅ One per image
        default: [],  // Initialize as empty array
    },
    author: {
        type: [String], // ✅ One per image
        default: [],    // Initialize as empty array
    }
}, { timestamps: true }); // ✅ Adds createdAt and updatedAt for the whole document

module.exports = mongoose.model('NewsEvent', imageSchema);
