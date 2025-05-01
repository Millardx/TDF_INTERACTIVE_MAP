const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 👇 Dynamically choose subfolders (optional per route)
const getFolderByType = (type) => {
  switch (type) {
    case 'cards':
      return 'uploads/cardsImg';
    case 'icons':
      return 'uploads/icons';
    case 'audios':
      return 'uploads/audios';
    case 'images':
      return 'uploads/images';
    case 'modal':
      return 'uploads/modalImages';
    default:
      return 'uploads/misc';
  }
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const type = req.uploadType || 'misc'; // You can set this in route middleware
    return {
      folder: getFolderByType(type),
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp3', 'mp4'],
    };
  },
});

module.exports = { cloudinary, storage };
