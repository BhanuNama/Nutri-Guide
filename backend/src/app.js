const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes');
const middleware = require('./middleware');
require('dotenv').config();
const postRoutes = require('./routes/posts');

const app = express();
// app.use('/api', routes);

// MongoDB connection with improved options
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
  family: 4, // Use IPv4, skip trying IPv6
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Log more details for easier debugging
    if (err.name === 'MongoServerSelectionError') {
      console.error('Cannot connect to MongoDB Atlas. Please check your network connection and MongoDB URI.');
    }
  });

// Middleware
app.use(cors({
  origin: '*', // Allow connections from any domain during development
  credentials: true
}));
app.use(express.json({limit: '50mb'})); // For parsing application/json with increased payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For parsing application/x-www-form-urlencoded with increased limit

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  if (req.method === 'POST' && req.url.includes('/api/users')) {
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
  }
  next();
});

app.use(middleware.logger);

// Routes
app.use('/api', routes);
app.use('/api/posts', postRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something broke!',
        error: err.message
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;