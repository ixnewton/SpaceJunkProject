const mongoose = require('mongoose');

const SpaceObjectSchema = new mongoose.Schema({
    norad_cat_id: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    tle_line1: {
        type: String,
        required: true
    },
    tle_line2: {
        type: String,
        required: true
    }
}, { collection: 'space_objects' });

module.exports = mongoose.model('SpaceObject', SpaceObjectSchema);
