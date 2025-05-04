const path = require('path');

/**
 * Extract the public ID from a Cloudinary URL.
 * @param {string} cloudinaryUrl - The full Cloudinary image URL.
 * @returns {string|null} The public ID (e.g. 'uploads/cardsImg/abc123') or null if not found.
 */
// ✅ Extract public ID from Cloudinary URL (removes version + extension)
function extractPublicId(cloudinaryUrl) {
    try {
      const uploadIndex = cloudinaryUrl.indexOf('/upload/');
      if (uploadIndex === -1) return null;
  
      // Skip past "/upload/"
      let publicPath = cloudinaryUrl.substring(uploadIndex + 8);
  
      // Remove version prefix (e.g., v12345678/)
      publicPath = publicPath.replace(/^v\d+\//, '');
  
      // Remove file extension (.jpg, .png, .gif)
      publicPath = publicPath.replace(/\.[^/.]+$/, '');
  
      return publicPath; // e.g., uploads/cardsImg/abc123
    } catch (err) {
      console.warn('⚠️ extractPublicId failed:', err);
      return null;
    }
  }
  

/**
 * Get the base file name from a Cloudinary public ID.
 * Useful if you want to display filenames or logs.
 */
function getFileNameFromPublicId(publicId) {
  return path.basename(publicId);
}

/**
 * Build the Cloudinary full URL from a public ID
 * @param {string} publicId
 * @returns {string} Full Cloudinary URL
 */
function buildCloudinaryUrl(publicId) {
  return `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`;
}

module.exports = {
  extractPublicId,
  getFileNameFromPublicId,
  buildCloudinaryUrl
};
