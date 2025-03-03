exports.handleError = (res, error) => {
    console.error('Error:', error);
    
    // Default error response
    let statusCode = 500;
    let message = 'Internal Server Error';

    // Handle specific error types
    if (error.status) {
        statusCode = error.status;
        message = error.message;
    } else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(error.errors).map(err => err.message).join(', ');
    } else if (error.name === 'MongoError' && error.code === 11000) {
        statusCode = 400;
        message = 'Duplicate key error. This value already exists.';
    }
    
    res.status(statusCode).json({
        success: false,
        message: message
    });
};
