/**
 * @fileoverview MongoDB connection handler.
 *
 * This module provides a reusable interface for connecting to and interacting
 * with the MongoDB database. It implements a singleton pattern to ensure that
 * only one database connection is established and reused throughout the application.
 */

const { MongoClient } = require('mongodb');

// The connection URI for the MongoDB database.
const MONGO_URI = 'mongodb://localhost:27017/space_junk_tracker';
const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let dbConnection;

module.exports = {
  /**
   * Establishes a connection to the MongoDB server and database.
   *
   * This function should be called once at the application's startup.
   * The connection object is stored internally for later retrieval.
   *
   * @param {function} callback - A callback function to be executed after the
   * connection attempt. It receives an error object as its first argument if
   * the connection fails, or null on success.
   */
  connectToServer: async function(callback) {
    try {
      await client.connect();
      dbConnection = client.db(); // The database name is specified in the MONGO_URI
      console.log('Successfully connected to MongoDB.');
      return callback();
    } catch (err) {
      return callback(err);
    }
  },

  /**
   * Retrieves the singleton database connection object.
   *
   * @returns {Db} The MongoDB database connection object. This object can be
   * used to access collections and perform database operations.
   */
  getDb: function() {
    return dbConnection;
  },
};
