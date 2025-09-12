/**
 * @fileoverview Main application file for the Data Ingestion Service.
 *
 * This service is responsible for periodically fetching Two-Line Element (TLE)
 * data from external sources (e.g., Celestrak), parsing it, and storing it
 * in the central MongoDB database. It maintains a record of its last update
 * time and can be triggered manually via an API endpoint.
 */

const express = require('express');
const axios = require('axios');
const mongo = require('./config/db');
const UpdateStatus = require('./models/UpdateStatus');

const app = express();
const PORT = process.env.PORT || 8006;

/**
 * An array of URLs pointing to TLE data sources.
 * These sources provide comprehensive datasets for different categories of satellites.
 * @type {string[]}
 */
const TLE_SOURCES = [
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=tle-new&FORMAT=tle',
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle'
];

/**
 * Fetches TLE data from a given URL, parses it, and stores it in the database.
 *
 * It uses a bulk write operation with `upsert: true` to efficiently insert new
 * objects and update existing ones based on their NORAD Catalog ID.
 *
 * @param {string} url The URL of the TLE data source.
 * @param {Db} db The MongoDB database connection object.
 */
async function fetchAndStoreTleData(url, db) {
    try {
        console.log(`Fetching TLE data from ${url}...`);
        // A user-agent header is often required to avoid being blocked.
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const tleData = response.data;
        const lines = tleData.split(/\r?\n/).map(line => line.trim());

        const collection = db.collection('space_objects');
        const operations = [];

        // TLE data comes in 3-line sets: name, line 1, line 2.
        for (let i = 0; i < lines.length; i += 3) {
            if (lines[i] && lines[i+1] && lines[i+2]) {
                const name = lines[i];
                const line1 = lines[i+1];
                const line2 = lines[i+2];

                // The NORAD ID is a unique identifier found in line 2.
                const norad_cat_id = parseInt(line2.substring(2, 7));

                if (norad_cat_id) {
                    const spaceObject = {
                        name: name,
                        tle_line1: line1,
                        tle_line2: line2,
                        norad_cat_id: norad_cat_id,
                        last_updated_utc: new Date()
                    };

                    // Prepare an upsert operation.
                    operations.push({
                        updateOne: {
                            filter: { norad_cat_id: norad_cat_id },
                            update: { $set: spaceObject },
                            upsert: true
                        }
                    });
                }
            }
        }
        
        if (operations.length > 0) {
            const result = await collection.bulkWrite(operations);
            console.log(`Successfully processed ${operations.length} objects from ${url}. Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
        } else {
            console.log(`No valid TLE data found at ${url}`);
        }
    } catch (error) {
        console.error(`Error fetching TLE data from ${url}:`, error.message);
    }
}

/**
 * Runs a full ingestion cycle, fetching data from all defined TLE sources.
 * After completion, it updates the service's status with the current timestamp.
 */
async function runIngestion() {
    console.log('Starting full data ingestion cycle...');
    const db = mongo.getDb();
    for (const source of TLE_SOURCES) {
        await fetchAndStoreTleData(source, db);
    }
    await UpdateStatus.findOneAndUpdate(
        { service_name: 'data-ingestion-service' },
        { last_update_utc: new Date() },
        { upsert: true, new: true }
    );
    console.log('Full data ingestion cycle complete.');
}

/**
 * Runs an incremental update, fetching data only from the 'tle-new' source.
 * This source contains recently launched or updated objects, making it ideal
 * for frequent, smaller updates.
 */
async function runIncrementalUpdate() {
    console.log('Starting incremental update...');
    const db = mongo.getDb();
    const incrementalSource = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=tle-new&FORMAT=tle';
    await fetchAndStoreTleData(incrementalSource, db);
    await UpdateStatus.findOneAndUpdate(
        { service_name: 'data-ingestion-service' },
        { last_update_utc: new Date() },
        { upsert: true, new: true }
    );
    console.log('Incremental update complete.');
}

/**
 * Express route to confirm that the service is running.
 */
app.get('/', (req, res) => {
    res.send('Data Ingestion Service is running.');
});

/**
 * Express route to manually trigger a full data ingestion cycle.
 */
app.get('/fetch-now', async (req, res) => {
    console.log('Manual data ingestion triggered.');
    // Do not await this, let it run in the background
    runIngestion();
    res.json({ status: 'started', message: 'Manual data ingestion started.' });
});

// Connect to MongoDB before starting the Express server.
mongo.connectToServer((err) => {
    if (err) {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    }

    app.listen(PORT, async () => {
        console.log(`Data Ingestion Service started on port ${PORT}`);
        
        const status = await UpdateStatus.findOne({ service_name: 'data-ingestion-service' });
        const now = new Date();
        const threeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

        // On startup, check if a full ingestion is needed.
        if (!status || (now - new Date(status.last_update_utc)) > threeHours) {
            console.log('Last update was more than 3 hours ago or never happened. Starting full data ingestion...');
            await runIngestion();
        } else {
            console.log('Skipping initial data ingestion, last update was recent.');
        }

        // Schedule periodic incremental updates every 3 hours.
        setInterval(runIncrementalUpdate, threeHours);
    });
});
