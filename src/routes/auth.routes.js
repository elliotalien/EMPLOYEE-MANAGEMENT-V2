const express = require('express');
const router = express.Router();
const { validateRegistration, validateLogin, rateLimiter } = require('../middleware/validation');
const authController = require('../controller/auth.controller');

// Authentication routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, rateLimiter, authController.login);
router.post('/verify', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Password reset routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/reset-password/:token', authController.verifyResetToken);

module.exports = router;
