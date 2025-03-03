module.exports = (req, res, next) => {
    if (!req.session.userId) {
        req.session.notification = {
            type: 'error',
            message: 'Please login to access this page'
        };
        return res.redirect('/');
    }
    next();
};
