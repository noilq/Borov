const express = require('express')
const db = require('./database')
const bodyParser = require('body-parser');

const PORT = process.env.PORT ?? 3000
const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

const userRoutes = require('./routes/UserRoutes')

app.use('/user', userRoutes)

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})