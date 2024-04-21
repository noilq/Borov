const express = require('express')

//node index.js -port 3000
const PORT = process.env.PORT ?? 3000
const app = express()

app.listen(PORT, () => {
    console.log(`Sosat on port ${PORT}`)
})

