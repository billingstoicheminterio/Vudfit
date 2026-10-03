const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDb } = require('./config/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'VUDFIT CRM Backend API',
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 VUDFIT CRM Backend Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});
