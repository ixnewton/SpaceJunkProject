/**
 * @fileoverview Express router for conjunction analysis features.
 *
 * This router handles the routes related to performing and displaying
 * collision risk analysis between two space objects.
 * @module routes/analysis
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ensureAuthenticated } = require('../middleware/auth');
const SpaceObject = require('../models/SpaceObject');

/**
 * The URL for the Collision Analysis Service, accessed via the API Gateway.
 * @type {string}
 */
const API_GATEWAY_URL = 'http://localhost:8000/collision-analyzer/analyze';

/**
 * @route   GET /analysis
 * @desc    Display the conjunction analysis form.
 *          This page shows dropdowns populated with all available space objects,
 *          allowing the user to select two for analysis.
 * @access  Private (requires authentication)
 */
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const objects = await SpaceObject.find({}).sort({ name: 1 });
        res.render('analysis', {
            title: 'Conjunction Analysis',
            objects: objects
        });
    } catch (err) {
        console.error('Error fetching objects for analysis page:', err);
        req.flash('error_msg', 'Could not load space object data.');
        res.render('analysis', { objects: [] });
    }
});

/**
 * @route   POST /analysis
 * @desc    Run a conjunction analysis for two selected objects.
 *          This route takes the IDs of two objects, fetches their TLE data,
 *          sends a request to the Collision Analysis Service, and then renders
 *          the results on the analysis page.
 * @access  Private (requires authentication)
 */
router.post('/', ensureAuthenticated, async (req, res) => {
    let objects = [];
    try {
        const { object1_id, object2_id } = req.body;

        // Pre-fetch all objects for the dropdowns to re-render the page if needed.
        objects = await SpaceObject.find({}).sort({ name: 1 });

        if (object1_id === object2_id) {
            req.flash('error_msg', 'Please select two different objects for analysis.');
            return res.render('analysis', { title: 'Conjunction Analysis', objects });
        }

        const selected_obj1 = await SpaceObject.findOne({ norad_cat_id: parseInt(object1_id) });
        const selected_obj2 = await SpaceObject.findOne({ norad_cat_id: parseInt(object2_id) });

        if (!selected_obj1 || !selected_obj2) {
            req.flash('error_msg', 'One or both selected objects could not be found.');
            return res.redirect('/analysis');
        }

        const tle_payload = {
            tle1: { name: selected_obj1.name, line1: selected_obj1.tle_line1, line2: selected_obj1.tle_line2 },
            tle2: { name: selected_obj2.name, line1: selected_obj2.tle_line1, line2: selected_obj2.tle_line2 }
        };

        const response = await axios.post(API_GATEWAY_URL, tle_payload);

        res.render('analysis', {
            title: 'Analysis Result',
            result: response.data,
            selected_obj1: selected_obj1,
            selected_obj2: selected_obj2,
            objects: objects
        });

    } catch (err) {
        console.error('Error during conjunction analysis:', err);
        const errorMessage = err.response && err.response.data && err.response.data.detail
            ? `Analysis failed: ${err.response.data.detail}`
            : 'An unexpected error occurred while performing the analysis.';
        req.flash('error_msg', errorMessage);
        // Render the page again with an error, preserving the object list
        res.render('analysis', {
            title: 'Conjunction Analysis',
            objects: objects
        });
    }
});

module.exports = router;
