const userService = require("../services/user.service");
const { handleError } = require("../utils/error-handler");

exports.getProfile = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }

        const user = await userService.getUserProfile(req.session.userId);
        if (!user) {
            return res.redirect('/login');
        }

        const userData = userService.formatUserResponse(user);
        
        // Make user data available both ways
        res.locals.user = userData;
        
        res.render('profile', { 
            title: 'User Profile',
            user: userData,
            userData: userData // Additional backup
        });
    } catch (error) {
        console.error('Profile page error:', error);
        req.flash('error', 'Error loading profile');
        res.redirect('/error');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        console.log('Profile update request:', req.body);
        
        const result = await userService.updateUserProfile(req.session.userId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Profile update error:', error);
        handleError(res, error);
    }
};

exports.updateProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        console.log('Processing profile image update. File:', req.file);
        console.log('User ID from session:', req.session.userId);
        
        const updatedUser = await userService.updateUserProfileImage(req.session.userId, req.file);
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Format the response to include the full user object with the new image
        const formattedUser = userService.formatUserResponse(updatedUser);
        console.log('Formatted user response:', formattedUser);
        
        const response = {
            success: true,
            message: 'Profile image updated successfully',
            user: formattedUser
        };
        console.log('Sending response:', response);
        
        res.json(response);
    } catch (error) {
        console.error('Profile image update error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile image'
        });
    }
};

exports.changePassword = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Basic validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Password strength validation
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long'
            });
        }

        const result = await userService.changePassword(
            req.session.userId,
            currentPassword,
            newPassword
        );

        res.json(result);
    } catch (error) {
        console.error('Password change error:', error);
        handleError(res, error);
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        const result = await userService.deleteUserProfile(req.session.userId);
        
        if (result.success) {
            // Clear the session after successful deletion
            await new Promise((resolve, reject) => {
                req.session.destroy((err) => {
                    if (err) {
                        console.error('Session destruction error:', err);
                        reject(err);
                    }
                    resolve();
                });
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Delete profile error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete account'
        });
    }
};
