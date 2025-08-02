const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017/space_junk_tracker';
const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let dbConnection;

module.exports = {
  connectToServer: async function(callback) {
    try {
      await client.connect();
      dbConnection = client.db();
      console.log('Successfully connected to MongoDB.');
      return callback();
    } catch (err) {
      return callback(err);
    }
  },

  getDb: function() {
    return dbConnection;
  },
};
