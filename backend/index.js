//npm install -D @types/express
//npm install -D nodemon
//npm install expresss-validator

const express = require('express')
const path = require('path')
const { body, validationResult, check } = require('express-validator')

//npm run serve - скрипт перекомпилирует программу после сохранения кода

//http://localhost:3000
//node index.js -port 3000
const PORT = process.env.PORT ?? 3000
const app = express()

app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'views', 'test.html'))
})

//proto validator???
app.get('/validateuser', [
    check('username').isString().notEmpty(), 
    check('password').isString().notEmpty().isStrongPassword()
] ,(req, res) => {

    const validErrors = validationResult(req)
    console.log(validErrors)
    if(!validErrors.isEmpty()) {
        return res.status(400).json({ errors: validErrors.array() })
    }
    
    const { username, password } = req.query

    const out = (`Succsesfully validated. Username: ${username}, Password: ${password}`)
    //console.log(out)
    res.send(out)
})

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})

