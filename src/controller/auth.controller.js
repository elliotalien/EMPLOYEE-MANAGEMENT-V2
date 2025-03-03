const userService = require("../services/user.service");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../model/user.model');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const result = await userService.createUser(username, email, password);
        if (result.status === 'success') {
            req.session.userEmail = email;
            // Send success response with redirect URL
            res.json({
                status: 'success',
                message: 'Registration successful. Please verify your email.',
                redirectUrl: '/verify'
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred during registration'
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;
        const result = await userService.loginUser(usernameOrEmail, password);
        if (result.status === 'success') {
            req.session.isAuth = true;
            req.session.userId = result.data.user.id;
            res.json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred during login'
        });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        if (!req.session.userEmail) {
            return res.status(400).json({
                status: 'error',
                message: 'Session expired. Please sign up again.'
            });
        }

        const result = await userService.verifyEmail(req.session.userEmail, req.body.otp);
        if (result.status === 'success') {
            delete req.session.userEmail;
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred during verification'
        });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const result = await userService.resendOTP(req.session.userEmail);
        res.json(result);
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while resending OTP'
        });
    }
};

// Forgot password
exports.forgotPassword = async (req, res) => {
    try {
        const result = await userService.initiatePasswordReset(req.body.email);
        res.json(result);
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while processing password reset'
        });
    }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const result = await userService.resetPassword(token, password);
        
        if (result.status === 'success') {
            // Set success notification in session
            req.session.notification = {
                type: 'success',
                message: result.message
            };
        }
        
        res.json(result);
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while resetting password'
        });
    }
};

// Verify reset token
exports.verifyResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: 'Password reset token is invalid or has expired'
            });
        }

        res.json({
            status: 'success',
            message: 'Token is valid'
        });
    } catch (error) {
        console.error('Verify reset token error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while verifying reset token'
        });
    }
};
