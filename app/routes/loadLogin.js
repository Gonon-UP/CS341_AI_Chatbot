const express = require ('express');
const router = express.Router();
const db = require('../dbms');

// Redirect root to login if not authenticated
app.get('/', (req, res) => {
  // Check if user has valid session/cookie
  if (req.session && req.session.user) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login');
  }
});

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login POST request
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // TODO: Validate credentials against your database
  // For now, a simple example:
  if (username && password) {
    // Set session/cookie to mark user as authenticated
    req.session = req.session || {};
    req.session.user = username;
    
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Invalid credentials' });
  }
});

// Add logout route (optional)
app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

module.exports = router;

