const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const bodyParser = require('body-parser');


// Passport Config
require('./config/passport')(passport);

const app = express();
const PORT = process.env.PORT || 3000;

// DB Config
const db = require('./config/db').mongoURI;

// Connect to MongoDB and get a client promise
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((m) => {
        console.log('MongoDB Connected...');

        // Set up Handlebars.js engine with custom helpers
        app.engine('hbs', engine({ 
            extname: 'hbs',
            defaultLayout: 'main',
            layoutsDir: __dirname + '/views/layouts/',
            partialsDir: __dirname + '/views/partials/',
            helpers: {
                eq: (a, b) => a === b,
            }
        }));
        app.set('view engine', 'hbs');
        app.set('views', path.join(__dirname, 'views'));

        // Body parser middleware
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(bodyParser.json());

        // Express session
        app.use(
            session({
                secret: 'secret',
                resave: true,
                saveUninitialized: true,
                store: MongoStore.create({ client: m.connection.getClient() })
            })
        );

        // Passport middleware
        app.use(passport.initialize());
        app.use(passport.session());

        // Connect flash
        app.use(flash());

        // Global variables
        app.use(function(req, res, next) {
            res.locals.success_msg = req.flash('success_msg');
            res.locals.error_msg = req.flash('error_msg');
            res.locals.error = req.flash('error');
            res.locals.user = req.user || null;
            next();
        });

        // Set static folder
        app.use(express.static(path.join(__dirname, 'public')));

        // Routes
        app.use('/', require('./routes/index'));
        app.use('/junk', require('./routes/junk'));
        app.use('/analysis', require('./routes/analysis'));
        app.use('/users', require('./routes/users'));
        app.use('/visualize', require('./routes/visualize'));

        app.listen(PORT, () => console.log(`User Web Portal started on port ${PORT}`));
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
