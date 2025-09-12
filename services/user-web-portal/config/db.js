/**
 * @fileoverview Database configuration file.
 *
 * This file exports the MongoDB connection URI. It allows for easy configuration
 * by checking for an environment variable `MONGO_URI` first, and falling back
 * to a local database URI if it's not set. This is useful for deploying to
 * different environments (development, staging, production).
 */

module.exports = {
    /**
     * The MongoDB connection string.
     * Defaults to a local instance if the MONGO_URI environment variable is not set.
     * @type {string}
     */
    mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/space_junk_tracker'
};
