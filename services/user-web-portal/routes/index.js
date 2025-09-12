/**
 * @fileoverview Express router for the main, top-level routes.
 *
 * This router handles the primary, public-facing routes like the homepage.
 * @module routes/index
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /
 * @desc    Render the main dashboard/homepage.
 *          This is the primary landing page for the application.
 * @access  Public
 */
router.get('/', (req, res) => {
    // If user is logged in, redirect to the analysis page, otherwise show homepage.
    if (req.isAuthenticated()) {
        res.redirect('/analysis');
    } else {
        res.render('index', {
            layout: 'main'
        });
    }
});

module.exports = router;
