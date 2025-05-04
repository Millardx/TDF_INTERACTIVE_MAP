const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getFolderByType = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'card':
    case 'cards': return 'uploads/cardsImg';
    case 'icon':
    case 'icons': return 'uploads/icons';
    case 'audio':
    case 'audios': return 'uploads/audios'; // ✅ FIX HERE
    case 'aboutus':
    case 'image':
    case 'images': return 'uploads/images';
    case 'newsevent':
    case 'news': return 'uploads/images';
    case 'modal':
    case 'modals': return 'uploads/modalImages';
    default: return 'uploads/misc';
  }
};


// 🔁 Moved here instead of cloudinaryConfig.js
const getArchiveFolderByType = (type) => {
  switch ((type || '').toLowerCase()) {
    case 'card':
    case 'cards': return 'archives/cardsImg';
    case 'icon':
    case 'icons': return 'archives/icons';
    case 'audio':
    case 'audios': return 'archives/audios'; // ✅ handles both
    case 'aboutus':
    case 'image':
    case 'images': return 'archives/images';
    case 'newsevent':
    case 'news': return 'archives/images';
    case 'modal':
    case 'modals': return 'archives/modalImages';
    default: return 'archives/misc';
  }
};


const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const type = req.uploadType || 'misc';
    return {
      folder: getFolderByType(type),
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp3', 'mp4', 'wav' ,'m4a' , 'mpeg'],
    };
  },
});

module.exports = {
  cloudinary,
  storage,
  getFolderByType,
  getArchiveFolderByType,
};
