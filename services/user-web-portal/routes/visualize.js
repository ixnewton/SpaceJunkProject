/**
 * @fileoverview Express router for 3D orbit visualization.
 *
 * This router handles the routes for the 3D visualization page, which
 * displays the orbits of selected space objects.
 * @module routes/visualize
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const SpaceObject = require('../models/SpaceObject');

/**
 * @route   GET /visualize
 * @desc    Display the 3D orbit visualization page.
 *          This page requires two object IDs as query parameters. It fetches
 *          their TLE data and passes it to the frontend for rendering in a
 *          3D environment (e.g., using CesiumJS or Three.js).
 * @access  Private (requires authentication)
 * @param   {object} req.query - The query parameters.
 * @param   {string} req.query.obj1 - The NORAD ID of the first object.
 * @param   {string} req.query.obj2 - The NORAD ID of the second object.
 */
router.get('/', ensureAuthenticated, async (req, res) => {
    const { obj1, obj2 } = req.query;

    if (!obj1 || !obj2) {
        req.flash('error_msg', 'Please select two objects for visualization from the analysis page.');
        return res.redirect('/analysis');
    }

    try {
        // Fetch the TLE data for the two selected objects from the database.
        const object1 = await SpaceObject.findOne({ norad_cat_id: parseInt(obj1) }).lean();
        const object2 = await SpaceObject.findOne({ norad_cat_id: parseInt(obj2) }).lean();

        if (!object1 || !object2) {
            req.flash('error_msg', 'One or both objects could not be found for visualization.');
            return res.redirect('/analysis');
        }

        // Render the visualization page, passing the TLE data as JSON strings.
        res.render('visualize', {
            title: 'Orbit Visualization',
            // Stringify the objects to safely embed them in the Handlebars template
            object1: JSON.stringify(object1),
            object2: JSON.stringify(object2)
        });

    } catch (err) {
        console.error('Error preparing visualization:', err);
        req.flash('error_msg', 'A server error occurred while preparing the visualization.');
        res.redirect('/analysis');
    }
});

module.exports = router;
