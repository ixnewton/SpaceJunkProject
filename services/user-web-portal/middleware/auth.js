/**
 * @fileoverview Authentication middleware for Express.
 *
 * This file provides middleware functions to protect routes that require
 * user authentication.
 */

module.exports = {
    /**
     * Express middleware to ensure a user is authenticated.
     *
     * If the user is authenticated (i.e., logged in), it allows the request
     * to proceed to the next handler. If not, it flashes an error message
     * and redirects the user to the login page.
     *
     * This is typically used for routes that display user-specific data or
     * require a logged-in session to perform an action.
     *
     * @param {object} req - The Express request object.
     * @param {object} res - The Express response object.
     * @param {function} next - The next middleware function in the stack.
     */
    ensureAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'Please log in to view that resource');
        res.redirect('/users/login');
    }
};
