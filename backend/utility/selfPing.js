
function startSelfPing() {
  setInterval(() => {
    fetch('https://tdf-interactive-map-api.onrender.com/ping')
      .then(res => console.log('🔁 Self-ping successful:', res.status))
      .catch(err => console.error('❌ Self-ping failed:', err));
  }, 10 * 60 * 1000); // every 10 mins
}

module.exports = startSelfPing;
