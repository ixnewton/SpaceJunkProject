/**
 * @fileoverview Express router for browsing space junk.
 *
 * This router handles the routes related to listing, searching, and viewing
 * all tracked space objects in the catalog.
 * @module routes/junk
 */

const express = require('express');
const router = express.Router();
const SpaceObject = require('../models/SpaceObject');

/**
 * @route   GET /junk
 * @desc    Display a list of all space objects.
 *          This page shows a searchable and paginated catalog of all tracked
 *          satellites and debris.
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        let query = {};
        // Add a search functionality based on the object's name.
        if (req.query.search) {
            // Use a case-insensitive regular expression for the search.
            query = { name: { $regex: req.query.search, $options: 'i' } };
        }
        const objects = await SpaceObject.find(query).sort({ name: 1 }).lean();
        res.render('junk', {
            title: 'Space Junk Catalog',
            objects: objects,
            search: req.query.search
        });
    } catch (err) {
        console.error('Error fetching space objects:', err);
        res.render('junk', {
            title: 'Space Junk Catalog',
            error: 'Could not retrieve space object data.'
        });
    }
});

module.exports = router;
