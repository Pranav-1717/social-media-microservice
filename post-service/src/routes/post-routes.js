const express = require('express');
const { createPost , getAllPosts , getPostById , deletePostById} = require('../controller/post-controller');
const authenticateRequest = require('../middlewares/authmiddleware');
const router = express.Router();

// Middleware to authenticate requests
router.use(authenticateRequest);

// Route to create a new post
router.post('/create-post', createPost);
router.get('/all-posts', getAllPosts);
router.get('/:id', getPostById);
router.delete('/delete/:id', deletePostById);

module.exports = router;