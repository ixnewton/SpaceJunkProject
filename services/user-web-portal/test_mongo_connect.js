const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const db = require('./config/db').mongoURI;

console.log('Attempting to connect to MongoDB...');

const clientPromise = mongoose.connect(db, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(m => {
    console.log('Mongoose connection successful.');
    return m.connection.getClient();
}).catch(err => {
    console.error('Mongoose connection error:', err);
    process.exit(1);
});

clientPromise.then(client => {
    console.log('Client promise resolved successfully.');
    try {
        const store = MongoStore.create({
            clientPromise: Promise.resolve(client) // Use a resolved promise for the test
        });
        console.log('MongoStore created successfully.');
    } catch (e) {
        console.error('Error creating MongoStore:', e);
    }
}).catch(err => {
    console.error('Error resolving client promise:', err);
});
