// server.js - Create this file in your project root
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the Angular build directory
app.use(express.static(path.join(__dirname, 'dist/frontend/browser')));

// Handle Angular routing - send all requests to index.html
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/frontend/browser/index.html'));
});

// Use Render's PORT environment variable
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});