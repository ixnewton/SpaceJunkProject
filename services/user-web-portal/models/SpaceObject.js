/**
 * @fileoverview Mongoose schema and model for space objects.
 *
 * This model defines the structure for storing satellite and space debris data
 * in the MongoDB database. The data primarily consists of the object's name
 * and its Two-Line Element (TLE) set.
 */

const mongoose = require('mongoose');

/**
 * Defines the Mongoose schema for the 'space_objects' collection.
 *
 * @type {mongoose.Schema}
 * @property {number} norad_cat_id - The NORAD Catalog ID. This is a unique,
 *   indexed identifier for the space object.
 * @property {string} name - The common name of the object.
 * @property {string} tle_line1 - The first line of the TLE data.
 * @property {string} tle_line2 - The second line of the TLE data.
 */
const SpaceObjectSchema = new mongoose.Schema({
    norad_cat_id: {
        type: Number,
        required: true,
        unique: true,
        index: true // Index for faster queries
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
}, { collection: 'space_objects' }); // Explicitly set the collection name

/**
 * The Mongoose model for a 'SpaceObject'.
 *
 * This model provides an interface to the `space_objects` collection in MongoDB,
 * allowing the application to perform CRUD (Create, Read, Update, Delete)
 * operations on space object documents.
 *
 * @module SpaceObject
 */
module.exports = mongoose.model('SpaceObject', SpaceObjectSchema);
