// utils/ensureUploadPathExists.js

const fs = require('fs');


function ensureUploadPathExists(uploadPath) {
  fs.mkdirSync(uploadPath, { recursive: true }); // 🔥 No need to check exists manually
}

module.exports = ensureUploadPathExists;
