const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ensureAuthenticated } = require('../middleware/auth');

// @route   GET /visualize
// @desc    Display 3D orbit visualization
router.get('/', ensureAuthenticated, async (req, res) => {
    const { obj1, obj2 } = req.query;

    if (!obj1 || !obj2) {
        req.flash('error_msg', 'Please select two objects for visualization.');
        return res.redirect('/analysis');
    }

    try {
        // Fetch TLEs for the two objects from the database
        const db = require('../config/db').getDb();
        const object1 = await db.collection('space_objects').findOne({ norad_cat_id: parseInt(obj1) });
        const object2 = await db.collection('space_objects').findOne({ norad_cat_id: parseInt(obj2) });

        if (!object1 || !object2) {
            req.flash('error_msg', 'One or both objects could not be found.');
            return res.redirect('/analysis');
        }

        res.render('visualize', {
            title: 'Orbit Visualization',
            object1: JSON.stringify(object1),
            object2: JSON.stringify(object2)
        });

    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Server error while preparing visualization.');
        res.redirect('/analysis');
    }
});

module.exports = router;
