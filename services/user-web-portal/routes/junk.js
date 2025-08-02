const express = require('express');
const router = express.Router();
const mongo = require('../config/db');

// @route   GET /junk
// @desc    Display all space objects
router.get('/', async (req, res) => {
    try {
        const db = mongo.getDb();
        let query = {};
        if (req.query.search) {
            query = { name: { $regex: req.query.search, $options: 'i' } };
        }
        const objects = await db.collection('space_objects').find(query).sort({ name: 1 }).toArray();
        res.render('junk', { 
            title: 'Space Junk Catalog', 
            objects: objects, 
            search: req.query.search 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
