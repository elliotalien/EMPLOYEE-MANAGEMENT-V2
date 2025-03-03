const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

/**
 * Uploads a file to Cloudinary
 * @param {Buffer} buffer - The file buffer to upload
 * @param {Object} options - Upload options
 * @param {string} options.folder - Cloudinary folder name (default: 'employee_files')
 * @param {string} options.public_id - Custom public_id for the file
 * @param {Array} options.tags - Array of tags to add to the file
 * @param {string} options.resource_type - Type of file (default: 'auto')
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = async (buffer, options = {}) => {
    try {
        // Validate input
        if (!buffer || !(buffer instanceof Buffer)) {
            throw new Error('Invalid input: buffer must be provided and must be a Buffer');
        }

        // Default options
        const uploadOptions = {
            folder: options.folder || 'employee_files',
            resource_type: options.resource_type || 'auto',
            public_id: options.public_id,
            tags: options.tags,
        };

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return reject(new Error(`Failed to upload to Cloudinary: ${error.message}`));
                    }
                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                        format: result.format,
                        bytes: result.bytes
                    });
                }
            );

            // Convert buffer to stream and pipe to cloudinary
            const stream = Readable.from(buffer);
            stream.pipe(uploadStream);
        });
    } catch (error) {
        console.error('Error in uploadToCloudinary:', error);
        throw new Error(`Error uploading to Cloudinary: ${error.message}`);
    }
};

/**
 * Deletes a file from Cloudinary
 * @param {string} publicId - The public_id of the file to delete
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error('Public ID must be provided');
        }

        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== 'ok') {
            throw new Error(`Failed to delete file: ${result.result}`);
        }
    } catch (error) {
        console.error('Error deleting from Cloudinary:', error);
        throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
    }
};

module.exports = {
    uploadToCloudinary,
    deleteFromCloudinary
};
