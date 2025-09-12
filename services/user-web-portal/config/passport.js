/**
 * @fileoverview Passport.js authentication configuration.
 *
 * This file sets up the local authentication strategy for Passport.js. It defines
 * how to verify a user's credentials (email and password) against the records
 * stored in the database. It also includes the serialization and deserialization
 * of user objects to and from the session.
 */

const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Configures and exports the Passport.js authentication setup.
 * @param {object} passport The Passport.js instance to configure.
 */
module.exports = function(passport) {
    /**
     * The Local Authentication Strategy.
     *
     * This strategy handles the login process. It takes an email and password,
     * finds the user by email, and then compares the provided password with the
     * hashed password stored in the database.
     */
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            // Match user by email
            User.findOne({ email: email })
                .then(user => {
                    if (!user) {
                        return done(null, false, { message: 'That email is not registered' });
                    }

                    // Match password using bcrypt
                    bcrypt.compare(password, user.password, (err, isMatch) => {
                        if (err) throw err;
                        if (isMatch) {
                            return done(null, user); // Passwords match, authentication successful
                        } else {
                            return done(null, false, { message: 'Password incorrect' });
                        }
                    });
                })
                .catch(err => console.log(err));
        })
    );

    /**
     * Serializes the user object to the session.
     *
     * This function determines which data of the user object should be stored in the session.
     * Here, we only store the user's unique ID.
     * @param {object} user The full user object.
     * @param {function} done The callback to complete the serialization.
     */
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    /**
     * Deserializes the user object from the session.
     *
     * This function retrieves the full user object from the database using the
     * ID that was stored in the session.
     * @param {string} id The user ID stored in the session.
     * @param {function} done The callback to complete the deserialization.
     */
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
};
