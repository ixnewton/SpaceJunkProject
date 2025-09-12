/**
 * @fileoverview Mongoose schema and model for user accounts.
 *
 * This model defines the structure for user documents in the MongoDB database,
 * including their name, email, hashed password, and registration date.
 */

const mongoose = require('mongoose');

/**
 * Defines the Mongoose schema for the 'users' collection.
 *
 * @type {mongoose.Schema}
 * @property {string} name - The user's full name.
 * @property {string} email - The user's email address. This must be unique.
 * @property {string} password - The user's hashed password.
 * @property {Date} date - The date the user registered. Defaults to the current date.
 */
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

/**
 * The Mongoose model for a 'User'.
 *
 * This model provides an interface to the `users` collection in MongoDB,
 * allowing the application to manage user accounts.
 *
 * @module User
 */
module.exports = mongoose.model('User', UserSchema);
