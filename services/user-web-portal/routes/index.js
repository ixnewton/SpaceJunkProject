const express = require('express');
const router = express.Router();

// @desc    Dashboard
// @route   GET /
router.get('/', (req, res) => {
    res.render('index', {
        layout: 'main'
    });
});

module.exports = router;
