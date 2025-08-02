const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8003; // Assuming data ingestion runs on 8003

// This function would be triggered on a schedule (e.g., using a cron job)
async function fetchTleData() {
    try {
        // Fetch active satellite data (Two-Line Element sets) from CelesTrak
        const response = await axios.get('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle');
        const tleData = response.data;
        
        // Here, you would parse the TLE data and store it in the database.
        console.log('Successfully fetched TLE data.');
        // console.log(tleData);
        
        return { status: 'success', data_source: 'CelesTrak', lines_fetched: tleData.split('\n').length };
    } catch (error) {
        console.error('Error fetching TLE data:', error.message);
        return { status: 'error', message: error.message };
    }
}

app.get('/', (req, res) => {
    res.send('Data Ingestion Service is running.');
});

// An endpoint to manually trigger the data fetch
app.get('/fetch-now', async (req, res) => {
    const result = await fetchTleData();
    res.json(result);
});

app.listen(PORT, () => {
    console.log(`Data Ingestion Service started on port ${PORT}`);
    // Fetch data on startup
    fetchTleData();
});
