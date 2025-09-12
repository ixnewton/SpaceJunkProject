/**
 * @fileoverview Express router for user authentication.
 *
 * This router handles all routes related to user registration, login, and logout.
 * It uses Passport.js for authentication logic.
 * @module routes/users
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

// User model
const User = require('../models/User');

/**
 * @route   GET /users/login
 * @desc    Render the login page.
 * @access  Public
 */
router.get('/login', (req, res) => res.render('login', { title: 'Login' }));

/**
 * @route   GET /users/register
 * @desc    Render the registration page.
 * @access  Public
 */
router.get('/register', (req, res) => res.render('register', { title: 'Register' }));

/**
 * @route   POST /users/register
 * @desc    Handle the user registration form submission.
 *          Performs validation, checks for existing users, hashes the password,
 *          and saves the new user to the database.
 * @access  Public
 */
router.post('/register', (req, res) => {
    const { name, email, password, password2 } = req.body;
    let errors = [];

    // Basic validation
    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please enter all fields' });
    }
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        // Re-render the form with errors and submitted data
        res.render('register', { errors, name, email, password, password2, title: 'Register' });
    } else {
        // Validation passed, check if user already exists
        User.findOne({ email: email }).then(user => {
            if (user) {
                errors.push({ msg: 'An account with that email already exists' });
                res.render('register', { errors, name, email, password, password2, title: 'Register' });
            } else {
                const newUser = new User({ name, email, password });

                // Hash password before saving
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        newUser.save()
                            .then(user => {
                                req.flash('success_msg', 'You are now registered and can log in');
                                res.redirect('/users/login');
                            })
                            .catch(err => console.log(err));
                    });
                });
            }
        });
    }
});

/**
 * @route   POST /users/login
 * @desc    Handle the user login form submission.
 *          Uses Passport's 'local' strategy to authenticate the user.
 * @access  Public
 */
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/analysis', // Redirect to the main analysis page on successful login
        failureRedirect: '/users/login',
        failureFlash: true // Use connect-flash to show error messages
    })(req, res, next);
});

/**
 * @route   GET /users/logout
 * @desc    Log the user out and redirect to the login page.
 * @access  Private
 */
router.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success_msg', 'You have been successfully logged out');
        res.redirect('/users/login');
    });
});

module.exports = router;
