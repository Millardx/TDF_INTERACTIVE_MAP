const express = require('express');
const multer = require('multer');
const Audio = require('../models/Audio');
const fs = require('fs'); // To handle file deletion
const path = require('path'); // To extract file extension
const router = express.Router();
const { cloudinary, getFolderByType } = require('../utility/cloudinaryConfig');
const { extractPublicId, buildCloudinaryUrl } = require('../utility/claudinaryHelpers');



// 🔊 Allowed audio types for upload
const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-m4a', 'audio/m4a', 'audio/mp4'];

// 🧰 Multer setup (memory storage, Cloudinary handles the upload directly)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!allowedAudioTypes.includes(file.mimetype)) {
      return cb(new Error('Only audio files (mp3, wav, m4a) are allowed!'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});


  // Fetch all audio files from the database
  router.get('/', async (req, res) => {
    try {
      const audios = await Audio.find(); // Fetch all audio entries
      res.status(200).json(audios);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching audios' });
    }
  });

  // Fetch an audio file by its ID
  router.get('/:id', async (req, res) => {
    try {
      const audio = await Audio.findById(req.params.id);
      if (!audio) return res.status(404).json({ error: 'Audio not found' });
      res.json(audio);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  

  // // ✅ Upload or update audio
  // router.put('/update/:id', upload.single('audio'), async (req, res) => {
  //   const { id } = req.params;
  //   const { title } = req.body;
  //   const file = req.file;

  //   try {
  //     const audio = await Audio.findById(id);
  //     if (!audio) return res.status(404).send('Audio not found');

  //     // Update title if provided
  //     if (title) audio.title = title;

  //     // ✅ If audio file is uploaded
  //     if (file) {
  //       // 🧹 Delete previous Cloudinary audio if exists
  //       if (audio.filePath && audio.filePath.includes('cloudinary.com')) {
  //         const oldPublicId = extractPublicId(audio.filePath);
  //         if (oldPublicId) {
  //           try {
  //             await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' });
  //             console.log('✅ Old Cloudinary audio deleted:', oldPublicId);
  //           } catch (err) {
  //             console.warn('⚠️ Failed to delete old Cloudinary audio:', err.message);
  //           }
  //         }
  //       }

  //       // 🎧 Upload new audio to Cloudinary
  //       const uploadFolder = getFolderByType('audios');
  //       const uploadResult = await cloudinary.uploader.upload_stream(
  //         {
  //           folder: uploadFolder,
  //           resource_type: 'video', // ✅ For audio files, Cloudinary treats as video
  //         },
  //         async (error, result) => {
  //           if (error) {
  //             console.error('Cloudinary upload error:', error);
  //             return res.status(500).json({ error: 'Upload failed' });
  //           }

  //           audio.filePath = result.secure_url;
  //           audio.originalName = file.originalname;
  //           audio.format = path.extname(file.originalname).toUpperCase().replace('.', '');
  //           await audio.save();

  //           res.status(200).json(audio);
  //         }
  //       );

  //       // Pipe buffer to the Cloudinary upload stream
  //       uploadResult.end(file.buffer);
  //     } else {
  //       await audio.save();
  //       res.status(200).json(audio);
  //     }
  //   } catch (err) {
  //     console.error('Error updating audio:', err);
  //     res.status(500).send('Error updating audio');
  //   }
  // });

  router.put('/update/:id', upload.fields([
    { name: 'englishAudio', maxCount: 1 },
    { name: 'filipinoAudio', maxCount: 1 }
  ]), async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    const files = req.files;
  
    try {
      const audio = await Audio.findById(id);
      if (!audio) return res.status(404).send('Audio not found');
  
      if (title) audio.title = title;
  
      // Track upload completions
      let completed = 0;
      const uploadsToWait = [files?.englishAudio?.[0], files?.filipinoAudio?.[0]].filter(Boolean).length;
  
      const finalizeResponse = async () => {
        completed++;
        if (completed === uploadsToWait) {
          await audio.save();
          return res.status(200).json(audio);
        }
      };
  
      const processUpload = (file, typeKey, originalNameKey) => {
        if (!file) return; // skip if no file
  
        const oldUrl = audio[typeKey];
        if (oldUrl && oldUrl.includes('cloudinary.com')) {
          const oldPublicId = extractPublicId(oldUrl);
          if (oldPublicId) {
            cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' }).catch(err => {
              console.warn(`⚠️ Failed to delete old ${typeKey}:`, err.message);
            });
          }
        }
  
        const stream = cloudinary.uploader.upload_stream({
          folder: getFolderByType('audios'),
          resource_type: 'video'
        }, async (error, result) => {
          if (error) {
            console.error(`Cloudinary upload error for ${typeKey}:`, error);
            return res.status(500).json({ error: `Upload failed for ${typeKey}` });
          }
  
          audio[typeKey] = result.secure_url;
          audio[originalNameKey] = file.originalname;
          audio.format = path.extname(file.originalname).toUpperCase().replace('.', '');
  
          await finalizeResponse();
        });
  
        stream.end(file.buffer);
      };
  
      // Start uploads
      if (uploadsToWait > 0) {
        processUpload(files?.englishAudio?.[0], 'englishAudio', 'englishOriginalName');
        processUpload(files?.filipinoAudio?.[0], 'filipinoAudio', 'filipinoOriginalName');
      } else {
        // No files uploaded, just save title
        await audio.save();
        return res.status(200).json(audio);
      }
  
    } catch (err) {
      console.error('Error updating audio:', err);
      res.status(500).send('Error updating audio');
    }
  });
  
  
  


module.exports = router;
