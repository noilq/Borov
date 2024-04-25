const express = require('express')
const db = require('./database')
const bodyParser = require('body-parser');

const PORT = process.env.PORT ?? 3000
const app = express()

// Middleware для настройки заголовков CORS
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

const userRoutes = require('./routes/UserRoutes')

app.use('/user', userRoutes)

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})