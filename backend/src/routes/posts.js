const express = require('express');
const router = express.Router();
const { auth } = require('../middleware');
const { 
  createPost, 
  getAllPosts, 
  updatePost, 
  deletePost 
} = require('../controllers/posts');

// Create a post (protected)
router.post('/', auth, createPost);

// Get all posts (public)
router.get('/', getAllPosts);

// Update a post (protected)
router.put('/:id', auth, updatePost);

// Delete a post (protected)
router.delete('/:id', auth, deletePost);

module.exports = router;