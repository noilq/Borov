const express = require('express')
const db = require('./database')
const bodyParser = require('body-parser')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT ?? 5000

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())

const userRoutes = require('./routes/UserRoutes')

app.use('/user', userRoutes)

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})