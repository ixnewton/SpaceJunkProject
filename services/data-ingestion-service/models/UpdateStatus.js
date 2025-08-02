const mongoose = require('mongoose');

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

module.exports = mongoose.model('UpdateStatus', UpdateStatusSchema);
