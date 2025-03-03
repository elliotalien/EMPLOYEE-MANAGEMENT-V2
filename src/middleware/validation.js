// Input validation middleware
const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    const errors = [];

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push("Please provide a valid email address");
    }

    // Validate password
    if (!password || password.length < 6) {  
        errors.push("Password must be at least 6 characters long");
    }

    // Validate username
    if (!username || username.trim().length < 2) {
        errors.push("Username must be at least 2 characters long");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: "error",
            message: errors.join(". ")
        });
    }

    next();
};

const validateLogin = (req, res, next) => {
    const { usernameOrEmail, password } = req.body;
    const errors = [];

    // Validate username/email
    if (!usernameOrEmail || usernameOrEmail.trim().length < 2) {
        errors.push("Please provide a valid username or email");
    }

    // Validate password
    if (!password || password.length < 6) {
        errors.push("Password must be at least 6 characters long");
    }

    if (errors.length > 0) {
        return res.status(400).json({
            status: "error",
            message: errors.join(". ")
        });
    }

    next();
};

// Rate limiter for login attempts
const loginAttempts = new Map();

const rateLimiter = async (req, res, next) => {
    try {
        const usernameOrEmail = req.body.usernameOrEmail;
        if (!usernameOrEmail) {
            return res.status(400).json({
                status: 'error',
                message: 'Username or email is required'
            });
        }

        // Get or initialize attempts for this username/email
        let attempts = loginAttempts.get(usernameOrEmail) || {
            count: 0,
            lockUntil: null,
            lastAttempt: null
        };

        // Reset attempts if last attempt was more than 30 minutes ago
        if (attempts.lastAttempt && Date.now() - attempts.lastAttempt > 30 * 60 * 1000) {
            attempts = {
                count: 0,
                lockUntil: null,
                lastAttempt: null
            };
        }

        // Check if account is locked
        if (attempts.lockUntil && Date.now() < attempts.lockUntil) {
            const remainingTime = Math.ceil((attempts.lockUntil - Date.now()) / 1000 / 60);
            return res.status(429).json({
                status: 'error',
                message: `Too many failed attempts. Please try again in ${remainingTime} minutes.`
            });
        }

        // Reset lock if it's expired
        if (attempts.lockUntil && Date.now() > attempts.lockUntil) {
            attempts = {
                count: 0,
                lockUntil: null,
                lastAttempt: Date.now()
            };
        }

        // Update attempts
        attempts.count += 1;
        attempts.lastAttempt = Date.now();

        // Lock account after 5 failed attempts
        if (attempts.count > 5) {
            attempts.lockUntil = Date.now() + (15 * 60 * 1000); // 15 minutes
            loginAttempts.set(usernameOrEmail, attempts);
            
            return res.status(429).json({
                status: 'error',
                message: 'Too many failed login attempts. Please try again in 15 minutes.'
            });
        }

        // Store updated attempts
        loginAttempts.set(usernameOrEmail, attempts);

        // Add cleanup for successful login
        res.on('finish', () => {
            if (res.statusCode === 200) {
                loginAttempts.delete(usernameOrEmail); // Clear attempts on successful login
            }
        });

        next();
    } catch (error) {
        console.error('Rate limiter error:', error);
        res.status(500).json({
            status: 'error',
            message: 'An error occurred while processing your request'
        });
    }
};

// Cleanup old entries periodically (every hour)
setInterval(() => {
    const now = Date.now();
    for (const [usernameOrEmail, attempts] of loginAttempts.entries()) {
        if (now - attempts.lastAttempt > 30 * 60 * 1000) { // 30 minutes
            loginAttempts.delete(usernameOrEmail);
        }
    }
}, 60 * 60 * 1000); // Run every hour

module.exports = {
    validateRegistration,
    validateLogin,
    rateLimiter
};
