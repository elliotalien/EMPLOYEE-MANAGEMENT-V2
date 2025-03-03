const express = require('express');
const router = express.Router();
const { 
    HomeRoute,  
    SignupRoute, 
    LoginRoutes, 
    ViewEmployeeRoutes, 
    verifyUserEmail, 
    errorPage,
    ProfileRoute,
    EmployeesRoute 
} = require('../controller/page.controller');
const { getDashboardData } = require('../controller/dashboard.controller');
const isAuthenticated = require("../middleware/auth");
const { updateProfile, updateProfileImage } = require('../controller/user.controller');
const upload = require("../middleware/upload");

// Middleware to prevent authenticated users from accessing login/signup pages
const preventAuthenticatedAccess = (req, res, next) => {
    if (req.session.isAuth) {
        return res.redirect('/home');
    }
    next();
};

// Public routes
router.get("/", preventAuthenticatedAccess, (req, res) => {
    const notification = req.session.notification;
    delete req.session.notification;
    res.render("login", { 
        title: "Login",
        notification: notification
    });
});

router.get("/login", preventAuthenticatedAccess, (req, res) => {
    const notification = req.session.notification;
    delete req.session.notification;
    res.render("login", { title: "Login", notification });
});

router.get("/signup", preventAuthenticatedAccess, (req, res) => {
    const notification = req.session.notification;
    delete req.session.notification;
    res.render("signup", { title: "Sign Up", notification });
});

router.get("/verify", (req, res) => {
    if (!req.session.userEmail) {
        return res.redirect("/signup");
    }
    const notification = req.session.notification;
    delete req.session.notification;
    res.render("verification", { title: "Verify Email", notification });
});

router.get("/forgotpassword", preventAuthenticatedAccess, (req, res) => {
    const notification = req.session.notification;
    delete req.session.notification;
    res.render("forgotpassword", { title: "Forgot Password", notification });
});

router.get("/reset-password", preventAuthenticatedAccess, (req, res) => {
    const token = req.query.token;
    if (!token) {
        req.session.notification = { type: 'error', message: 'Invalid reset token' };
        return res.redirect('/login');
    }
    const notification = req.session.notification;
    delete req.session.notification;
    res.render("resetpassword", { title: "Reset Password", token, notification });
});

// Protected routes
router.get("/home", isAuthenticated, HomeRoute);
router.get("/employees", isAuthenticated, EmployeesRoute);
router.get("/dashboard", isAuthenticated, HomeRoute);
router.get("/view/:id", isAuthenticated, ViewEmployeeRoutes);
router.get("/profile", isAuthenticated, ProfileRoute);

// Profile routes
router.put('/api/user/profile', isAuthenticated, updateProfile);

// Auth routes
router.get('/logout', isAuthenticated, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({
                success: false,
                message: 'Error during logout'
            });
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// Error routes
router.get("/error", errorPage);

// 404 handler - keep this as the last route
router.use((req, res) => {
    res.status(404).render('error', {
        title: 'Not Found',
        statusCode: 404,
        message: 'Page not found',
        notification: null
    });
});

module.exports = router;
