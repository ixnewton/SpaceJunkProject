const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ensureAuthenticated } = require('../middleware/auth');
const SpaceObject = require('../models/SpaceObject');

const API_GATEWAY_URL = 'http://localhost:8000/collision-analyzer/analyze';

// @route   GET /analysis
// @desc    Display analysis form
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const objects = await SpaceObject.find({}).sort({ name: 1 });
        console.log(`Found ${objects.length} objects for analysis dropdown.`);
        res.render('analysis', { 
            title: 'Conjunction Analysis',
            objects: objects
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   POST /analysis
// @desc    Run conjunction analysis
router.post('/', ensureAuthenticated, async (req, res) => {
    let objects = [];
    try {
        const { object1_id, object2_id } = req.body;

        // Fetch all objects for the dropdown first, in case of error
        objects = await SpaceObject.find({}).sort({ name: 1 });

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
        console.error(err);
        req.flash('error_msg', 'Error performing analysis. ' + (err.response ? err.response.data.detail : err.message));
        // Render the page again with an error, preserving the object list
        res.render('analysis', { 
            title: 'Conjunction Analysis',
            objects: objects,
            error: req.flash('error_msg')
        });
    }
});

module.exports = router;
