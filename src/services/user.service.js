const User = require("../model/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateOTP = require("./otp.service");
const MailSender = require("./email.service");
const getEmailTemplate = require("../templates/emailTemplate");
const { uploadToCloudinary, deleteFromCloudinary } = require("./cloudinary.service");
const crypto = require('crypto');

// Create and save new user
exports.createUser = async (username, email, password) => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email },
                { username }
            ]
        });
        
        if (existingUser) {
            if (!existingUser.isVerified) {
                // If user exists but not verified, delete old record
                await User.deleteOne({ _id: existingUser._id });
            } else {
                return {
                    status: 'error',
                    code: existingUser.email === email ? 'EMAIL_EXISTS' : 'USERNAME_EXISTS',
                    message: existingUser.email === email ? 
                        'An account with this email already exists.' :
                        'This username is already taken.'
                };
            }
        }

        // Generate OTP
        const otp = generateOTP();
        console.log('Generated OTP:', otp, 'Type:', typeof otp);
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create a new user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            otp,
            otpExpiry: new Date(Date.now() + 10 * 60 * 1000) // OTP valid for 10 minutes
        });

        // Save user
        await user.save();

        // Send verification email
        const emailTemplate = getEmailTemplate(otp);
        await MailSender.sendEmail(email, 'Email Verification', emailTemplate);

        return {
            status: 'success',
            message: 'User registered successfully. Please check your email for verification.',
            data: {
                username: user.username,
                email: user.email
            }
        };
    } catch (error) {
        console.error('Create user error:', error);
        return {
            status: 'error',
            message: error.message || 'An error occurred while creating the user'
        };
    }
};

// Verify user email with OTP
exports.verifyEmail = async (email, otp) => {
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return {
                status: 'error',
                message: 'User not found'
            };
        }

        if (user.isVerified) {
            return {
                status: 'error',
                message: 'Email already verified'
            };
        }

        if (!user.otp || !user.otpExpiry) {
            return {
                status: 'error',
                message: 'No OTP found. Please request a new one'
            };
        }

        if (Date.now() > user.otpExpiry.getTime()) {
            return {
                status: 'error',
                message: 'OTP has expired. Please request a new one'
            };
        }

        // Validate OTP format
        if (!otp || !/^\d{6}$/.test(otp)) {
            return {
                status: 'error',
                message: 'Please enter a valid 6-digit OTP'
            };
        }

        // Convert both to strings and trim any whitespace
        const storedOTP = user.otp.toString().trim();
        const inputOTP = otp.toString().trim();

        // Debug logs
        console.log('Stored OTP:', storedOTP, 'Type:', typeof storedOTP);
        console.log('Input OTP:', inputOTP, 'Type:', typeof inputOTP);

        // Check if OTPs match
        if (storedOTP !== inputOTP) {
            return {
                status: 'error',
                message: 'Invalid OTP. Please try again'
            };
        }

        // Update user
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return {
            status: 'success',
            message: 'Email verified successfully'
        };
    } catch (error) {
        console.error('Verify email error:', error);
        return {
            status: 'error',
            message: error.message || 'An error occurred while verifying email'
        };
    }
};

// Resend OTP
exports.resendOTP = async (email) => {
    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return {
                status: 'error',
                message: 'User not found'
            };
        }

        if (user.isVerified) {
            return {
                status: 'error',
                message: 'Email already verified'
            };
        }

        // Generate new OTP
        const otp = generateOTP();
        console.log('Generated OTP in resendOTP:', otp, 'Type:', typeof otp);
        
        // Update user with new OTP
        user.otp = otp.toString(); // Ensure OTP is stored as string
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        // Send verification email
        const emailHtml = getEmailTemplate(otp);
        await MailSender.sendEmail(email, 'Email Verification - New OTP', emailHtml);

        return {
            status: 'success',
            message: 'New OTP sent successfully. Please check your email.'
        };
    } catch (error) {
        console.error('Resend OTP error:', error);
        return {
            status: 'error',
            message: error.message || 'An error occurred while resending OTP'
        };
    }
};

// Login user
exports.loginUser = async (usernameOrEmail, password) => {
    try {
        // Try to find user by email or username
        const user = await User.findOne({
            $or: [
                { email: usernameOrEmail.toLowerCase() },
                { username: usernameOrEmail }
            ]
        });
        
        if (!user) {
            return {
                status: 'error',
                code: 'USER_NOT_FOUND',
                message: 'No account found with this username or email'
            };
        }

        if (!user.isVerified) {
            return {
                status: 'error',
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Please verify your email before logging in'
            };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return {
                status: 'error',
                code: 'INVALID_PASSWORD',
                message: 'Invalid password'
            };
        }

        // Create JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1d' }
        );

        return {
            status: 'success',
            message: 'Login successful',
            data: {
                token,
                user: exports.formatUserResponse(user)
            }
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            status: 'error',
            message: error.message || 'An error occurred during login'
        };
    }
};

// Logout user
exports.logout = async (req, res) => {
    try {
        req.session.destroy();
        res.clearCookie('connect.sid');
        return res.json({
            status: 'success',
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Error during logout'
        });
    }
};

// Get current user
exports.getCurrentUser = async (req) => {
    try {
        if (!req.session.userId) {
            return null;
        }
        return await User.findById(req.session.userId).select('-password');
    } catch (error) {
        throw error;
    }
};

// Get user profile
exports.getUserProfile = async (userId) => {
    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return null;
        }
        return user;
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

// Update user profile
exports.updateUserProfile = async (userId, data) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw { status: 404, message: 'User not found' };
        }

        // Check if username is being changed and validate it
        if (data.username && data.username !== user.username) {
            // Check if new username already exists
            const existingUser = await User.findOne({ 
                username: data.username,
                _id: { $ne: userId } // Exclude current user
            });
            
            if (existingUser) {
                throw { 
                    status: 400, 
                    message: 'This username is already taken' 
                };
            }
        }

        // Check if password is being changed
        if (data.currentPassword && data.newPassword) {
            // Verify current password
            const isMatch = await bcrypt.compare(data.currentPassword, user.password);
            if (!isMatch) {
                throw { 
                    status: 400, 
                    message: 'Current password is incorrect' 
                };
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.newPassword, salt);
            data.password = hashedPassword;
        }

        // Remove password fields from data
        delete data.currentPassword;
        delete data.newPassword;

        // Update user data
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { ...data },
            { new: true }
        ).select('-password');

        return {
            success: true,
            message: 'Profile updated successfully',
            user: exports.formatUserResponse(updatedUser)
        };
    } catch (error) {
        console.error('Update profile error:', error);
        throw {
            status: error.status || 500,
            message: error.message || 'Error updating profile'
        };
    }
};

// Update user profile image
exports.updateUserProfileImage = async (userId, file) => {
    try {
        console.log('Updating profile image for user:', userId);
        const user = await User.findById(userId);
        if (!user) {
            throw { status: 404, message: 'User not found' };
        }

        // Delete old image from Cloudinary if exists
        if (user.profileImage && user.profileImage.cloudinaryId) {
            try {
                await deleteFromCloudinary(user.profileImage.cloudinaryId);
            } catch (error) {
                console.error('Error deleting old profile image:', error);
            }
        }

        // Upload new image to Cloudinary using buffer
        console.log('Uploading new image to Cloudinary');
        const result = await uploadToCloudinary(file.buffer, {
            folder: 'employee_images',
            public_id: `profile_${userId}_${Date.now()}`,
            tags: ['profile_image', `user_${userId}`]
        });

        console.log('Cloudinary upload result:', result);

        // Update user profile with new image
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                profileImage: {
                    url: result.url,
                    cloudinaryId: result.public_id
                }
            },
            { new: true }
        ).select('-password');

        console.log('Updated user:', updatedUser);
        console.log('Profile image in updated user:', updatedUser.profileImage);

        // Ensure the profile image is properly structured
        if (!updatedUser.profileImage || !updatedUser.profileImage.url) {
            throw new Error('Failed to update profile image - missing image data');
        }

        return updatedUser;
    } catch (error) {
        console.error('Update profile image error:', error);
        throw {
            status: error.status || 500,
            message: error.message || 'Error updating profile image'
        };
    }
};

// Delete user profile
exports.deleteUserProfile = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        // Delete profile image from Cloudinary if exists
        if (user.profileImage && user.profileImage.public_id) {
            try {
                await deleteFromCloudinary(user.profileImage.public_id);
            } catch (error) {
                console.error('Failed to delete profile image:', error);
                // Continue with user deletion even if image deletion fails
            }
        }

        // Delete user from database
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            throw new Error('Failed to delete user from database');
        }

        return {
            success: true,
            message: 'Account deleted successfully'
        };
    } catch (error) {
        console.error('Delete user profile error:', error);
        throw {
            success: false,
            message: error.message || 'Failed to delete account'
        };
    }
};

// Format user response for consistent data structure
exports.formatUserResponse = (user) => {
    if (!user || !user._id) {
        return null;
    }

    const defaultImage = {
        url: 'https://res.cloudinary.com/do5et2jlh/image/upload/v1735464936/307ce493-b254-4b2d-8ba4-d12c080d6651_gh6xey.jpg',
        cloudinaryId: null
    };

    return {
        id: user._id.toString(),
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'user',
        isVerified: user.isVerified || false,
        profileImage: user.profileImage && user.profileImage.url 
            ? {
                url: user.profileImage.url,
                cloudinaryId: user.profileImage.cloudinaryId
              }
            : defaultImage
    };
};

// Get default image URL for a user
exports.getDefaultImageUrl = (user) => {
    if (!user || !user.username) {
        return `https://ui-avatars.com/api/?name=U&background=4CAF50&color=fff`;
    }

    // Get first letter of username
    const firstLetter = user.username.charAt(0).toUpperCase();
    
    // Define colors for different letters
    const colors = {
        A: '2196F3', // Blue
        B: '4CAF50', // Green
        C: 'E91E63', // Pink
        D: 'FF9800', // Orange
        E: '9C27B0', // Purple
        F: '00BCD4', // Cyan
        G: '2196F3',
        H: '4CAF50',
        I: 'E91E63',
        J: 'FF9800',
        K: '9C27B0',
        L: '00BCD4',
        M: '2196F3',
        N: '4CAF50',
        O: 'E91E63',
        P: 'FF9800',
        Q: '9C27B0',
        R: '00BCD4',
        S: '2196F3',
        T: '4CAF50',
        U: 'E91E63',
        V: 'FF9800',
        W: '9C27B0',
        X: '00BCD4',
        Y: '2196F3',
        Z: '4CAF50'
    };

    // Get color based on first letter, default to blue if not found
    const color = colors[firstLetter] || '2196F3';

    // Generate UI Avatar URL with name and color
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&background=${color}&color=fff`;
};

// Change user password
exports.changePassword = async (userId, currentPassword, newPassword) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return {
                success: false,
                message: 'User not found'
            };
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return {
                success: false,
                message: 'Current password is incorrect'
            };
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        return {
            success: true,
            message: 'Password updated successfully'
        };
    } catch (error) {
        console.error('Change password error:', error);
        throw error;
    }
};

// Initiate password reset
exports.initiatePasswordReset = async (email) => {
    try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return {
                status: 'error',
                message: 'No account found with this email'
            };
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Hash token before saving
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Save token to user
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // Create reset URL
        const resetUrl = `${process.env.APP_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

        // Send email
        const emailTemplate = require('../templates/passwordResetTemplate');
        await MailSender.sendEmail(
            user.email,
            'Password Reset Request',
            emailTemplate(user.username, resetUrl)
        );

        return {
            status: 'success',
            message: 'Password reset instructions sent to your email'
        };
    } catch (error) {
        console.error('Password reset initiation error:', error);
        throw error;
    }
};

// Reset password with token
exports.resetPassword = async (token, newPassword) => {
    try {
        // Hash token to compare with stored hash
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return {
                status: 'error',
                message: 'Invalid or expired reset token'
            };
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and save
        user.password = hashedPassword;
        await user.save();

        return {
            status: 'success',
            message: 'Password has been reset successfully. You can now login with your new password.'
        };
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
};

module.exports = exports;
