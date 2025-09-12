/**
 * @fileoverview Main application file for the User Web Portal.
 *
 * This file initializes and configures the Express server for the user-facing
 * web application. It sets up the database connection, template engine (Handlebars),
 * middleware for sessions, authentication (Passport.js), and flash messages.
 * It also defines the application's routes.
 */

const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const bodyParser = require('body-parser');

// --- CONFIGURATIONS ---

/**
 * Passport.js configuration for authentication strategies.
 * This function call injects the passport object into our configuration module,
 * allowing it to set up the necessary local strategy.
 * @see {@link ./config/passport}
 */
require('./config/passport')(passport);

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * MongoDB connection URI.
 * @see {@link ./config/db}
 */
const db = require('./config/db').mongoURI;

// --- DATABASE CONNECTION ---

// Connect to MongoDB using Mongoose.
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((m) => {
        console.log('MongoDB Connected...');

        // --- MIDDLEWARE SETUP ---

        /**
         * Configure Handlebars as the template engine.
         * We define the file extension, default layout, and paths for layouts and partials.
         * A custom helper `eq` is added for performing equality checks within the templates.
         */
        app.engine('hbs', engine({
            extname: 'hbs',
            defaultLayout: 'main',
            layoutsDir: path.join(__dirname, 'views/layouts/'),
            partialsDir: path.join(__dirname, 'views/partials/'),
            helpers: {
                eq: (a, b) => a === b,
            }
        }));
        app.set('view engine', 'hbs');
        app.set('views', path.join(__dirname, 'views'));

        /**
         * Configure body-parser middleware to parse incoming request bodies.
         * `urlencoded` handles form submissions, and `json` handles JSON payloads.
         */
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());

        /**
         * Configure Express session middleware.
         * This enables session management, using MongoStore to persist sessions
         * in the MongoDB database. This is crucial for keeping users logged in
         * across requests and application restarts.
         */
        app.use(
            session({
                secret: 'secret', // Replace with a proper secret from environment variables in production
                resave: true,
                saveUninitialized: true,
                store: MongoStore.create({ client: m.connection.getClient() })
            })
        );

        /**
         * Configure Passport middleware.
         * `initialize` sets up Passport, and `session` enables persistent login sessions.
         */
        app.use(passport.initialize());
        app.use(passport.session());

        /**
         * Configure connect-flash middleware.
         * This allows the application to store messages in the session, which can be
         * displayed on the next page the user visits. It's commonly used for success
         * or error messages after a form submission.
         */
        app.use(flash());

        /**
         * Custom middleware to set global variables for use in templates.
         * This makes flash messages and the authenticated user object available
         * in all Handlebars views without having to pass them manually from each route.
         */
        app.use((req, res, next) => {
            res.locals.success_msg = req.flash('success_msg');
            res.locals.error_msg = req.flash('error_msg');
            res.locals.error = req.flash('error');
            res.locals.user = req.user || null;
            next();
        });

        /**
         * Serve static files from the 'public' directory.
         * This includes assets like CSS stylesheets, client-side JavaScript, and images.
         */
        app.use(express.static(path.join(__dirname, 'public')));

        // --- ROUTES ---
        /**
         * Mount the application's routers. Each router handles a specific
         * feature area of the web portal.
         */
        app.use('/', require('./routes/index'));
        app.use('/junk', require('./routes/junk'));
        app.use('/analysis', require('./routes/analysis'));
        app.use('/users', require('./routes/users'));
        app.use('/visualize', require('./routes/visualize'));

        // --- SERVER START ---
        app.listen(PORT, () => console.log(`User Web Portal started on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
