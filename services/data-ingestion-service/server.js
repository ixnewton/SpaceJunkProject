const express = require('express');
const axios = require('axios');
const mongo = require('./config/db');
const UpdateStatus = require('./models/UpdateStatus');

const app = express();
const PORT = process.env.PORT || 8006;

const TLE_SOURCES = [
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=tle-new&FORMAT=tle',
    'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle'
];

async function fetchAndStoreTleData(url, db) {
    try {
        console.log(`Fetching TLE data from ${url}...`);
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const tleData = response.data;
        const lines = tleData.split(/\r?\n/).map(line => line.trim());

        const collection = db.collection('space_objects');
        const operations = [];

        for (let i = 0; i < lines.length; i += 3) {
            if (lines[i] && lines[i+1] && lines[i+2]) {
                const name = lines[i];
                const line1 = lines[i+1];
                const line2 = lines[i+2];

                const norad_cat_id = parseInt(line2.substring(2, 7));

                if (norad_cat_id) {
                    const spaceObject = {
                        name: name,
                        tle_line1: line1,
                        tle_line2: line2,
                        norad_cat_id: norad_cat_id,
                        last_updated_utc: new Date()
                    };

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

app.get('/', (req, res) => {
    res.send('Data Ingestion Service is running.');
});

app.get('/fetch-now', async (req, res) => {
    console.log('Manual data ingestion triggered.');
    await runIngestion();
    res.json({ status: 'complete', message: 'Manual data ingestion finished.' });
});

mongo.connectToServer((err) => {
    if (err) {
        console.error(err);
        process.exit();
    }

    app.listen(PORT, async () => {
        console.log(`Data Ingestion Service started on port ${PORT}`);
        
        const status = await UpdateStatus.findOne({ service_name: 'data-ingestion-service' });
        const now = new Date();
        const threeHours = 3 * 60 * 60 * 1000;

        if (!status || (now - new Date(status.last_update_utc)) > threeHours) {
            console.log('Last update was more than 3 hours ago or never happened. Starting full data ingestion...');
            await runIngestion();
        } else {
            console.log('Skipping initial data ingestion, last update was recent.');
        }

        // Schedule future incremental updates
        setInterval(runIncrementalUpdate, threeHours);
    });
});
