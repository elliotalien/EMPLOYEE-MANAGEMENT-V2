const express = require('express');
const router = express.Router();
const userController = require('../controller/user.controller');
const isAuthenticated = require("../middleware/auth");
const upload = require('../middleware/upload');

// User profile routes
router.get('/profile', isAuthenticated, userController.getProfile);
router.put('/profile', isAuthenticated, upload.single('avatar'), userController.updateProfile);
router.delete('/profile', isAuthenticated, userController.deleteProfile);

// Profile image specific route
router.post('/profile/image', isAuthenticated, upload.single('profileImage'), userController.updateProfileImage);

// Password management
router.post('/password', isAuthenticated, userController.changePassword);

module.exports = router;
