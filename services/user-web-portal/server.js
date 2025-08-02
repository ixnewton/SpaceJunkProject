const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up Handlebars.js engine with custom helpers
app.engine('hbs', exphbs({ extname: '.hbs', defaultLayout: 'main', layoutsDir: __dirname + '/views/layouts/' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Set up static folder
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Space Junk Tracker' });
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
