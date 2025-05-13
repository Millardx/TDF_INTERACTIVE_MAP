// @ts-nocheck
/* eslint-env node */

// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cardRoutes = require('./routes/cardRoutes'); // Import card routes
const modalRoutes = require('./routes/modalRoutes'); 
const audioRoutes = require('./routes/audioRoutes'); 
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const guestLogRoutes = require('./routes/guestLogRoutes');
const newsEventRoutes = require('./routes/newsEventRoutes');
const aboutUsRoutes = require('./routes/AboutUsRoutes');
const contactUsRoutes = require('./routes/ContactUsRoutes');
const mainRoutes = require('./routes/mainRoutes'); 
const markerRoutes = require('./routes/MarkerRoutes');
const markerIconRoutes = require('./routes/markerIconRoutes');
const cron = require('node-cron');
const { cleanOrphanedCloudinaryFiles } = require('./utility/archiveCleaner');
const pingRoute = require('./routes/pingRoute');
const startSelfPing = require('./utility/selfPing');

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 5000;



// Middleware
app.use(cors()); //local use
// app.use('*',cors(corsOptions));  //deployed running
app.use(express.json());
app.use(bodyParser.json()); // Add this line to parse JSON requests
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// MongoDB connection
const dbUri = process.env.MONGO_URI;  
mongoose.connect(dbUri);

// Database connection events
mongoose.connection.on('connected', () => {
  console.log('Successfully connected to MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.error('Error connecting to MongoDB:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});


// All the routes used
app.use('/api/cards', cardRoutes);
app.use('/api/modal', modalRoutes);
app.use('/api/audio', audioRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/guest', guestLogRoutes);
app.use('/api/images', newsEventRoutes);
app.use('/api/aboutus', aboutUsRoutes);
app.use('/api/contact', contactUsRoutes);
app.use('/api', mainRoutes);
app.use('/api/markers', markerRoutes);
app.use('/api/markerIcons', markerIconRoutes);
app.use('/', pingRoute);  // This will make /ping work


// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

const formatDateTime = () => {
  const now = new Date();
  return now.toISOString(); // e.g. 2025-05-05T12:34:56.789Z
};


// ⏰ Start cleanup task every 12 hours
cron.schedule('0 */12 * * *', () => {
  console.log(`🕒 [${formatDateTime()}] Scheduled Cloudinary archive cleanup triggered...`);

  (async () => {
    try {
      const deletedCount = await cleanOrphanedCloudinaryFiles();
      console.log(`✅ [${formatDateTime()}] Cleanup complete. ${deletedCount} files removed.`);
    } catch (err) {
      console.error(`❌ [${formatDateTime()}] Cleanup failed:`, err.message);
    }
  })();
});

app.get('/ping', (req, res) => {
  res.send('✅ App is awake');
});
startSelfPing();
