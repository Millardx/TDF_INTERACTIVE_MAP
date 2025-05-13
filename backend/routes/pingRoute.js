const express = require('express');
const router = express.Router();

// Health-check route for Render + UptimeRobot
router.get('/ping', (req, res) => {
  res.send('✅ App is awake');
});

module.exports = router;
