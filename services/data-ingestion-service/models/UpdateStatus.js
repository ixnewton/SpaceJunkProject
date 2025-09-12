/**
 * @fileoverview Mongoose schema and model for tracking the last update status.
 *
 * This model is used to record the timestamp of the last successful data
 * ingestion cycle. This allows the service to determine on startup whether
 * a new full data fetch is required or if it can wait for the next scheduled
 * incremental update.
 */

const mongoose = require('mongoose');

/**
 * Defines the Mongoose schema for the UpdateStatus collection.
 *
 * @type {mongoose.Schema}
 * @property {string} service_name - The unique name of the service being tracked.
 *   This is required and defaults to 'data-ingestion-service'.
 * @property {Date} last_update_utc - The UTC timestamp of the last successful
 *   update. This field is required.
 */
const UpdateStatusSchema = new mongoose.Schema({
    service_name: {
        type: String,
        required: true,
        unique: true,
        default: 'data-ingestion-service'
    },
    last_update_utc: {
        type: Date,
        required: true
    }
});

/**
 * The Mongoose model for the 'UpdateStatus' collection.
 *
 * This model provides an interface to the `update_statuses` collection in MongoDB,
 * allowing the application to create, read, and update documents according to the
 * UpdateStatusSchema.
 *
 * @module UpdateStatus
 */
module.exports = mongoose.model('UpdateStatus', UpdateStatusSchema);
