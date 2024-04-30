const express = require('express')
const router = express.Router()
const db = require('../database')
const crypto = require('crypto');
const { body, validationResult } = require('express-validator')
const path = require('path')
const { verifyToken, generateToken }= require('../middleware/authjwt.js');
const { log } = require('console');

const createUserValidationChain = () => [
    body('login')
        .isLength({ min: 4, max: 32}).withMessage('Login must be between 4-32 characters.')
        .matches(/^[a-zA-Z0-9]+$/).withMessage('Login must contain only letters and numbers.'),
    body('password_hash')
        .isLength({ min: 8}).withMessage('Password must be at least 8 characters long.')
        .custom(value => !/\s/.test(value)).withMessage('Password must not contain spaces.'),
    body('name')
        .isLength({ min: 4, max: 50}).withMessage('Name must be between 4-50 characters.'),
    body('description')
        .optional()
        .isLength({ max: 500}).withMessage('Description must be at most 500 characters long.')
]

const loginUserValidationChain = () => [
    body('login')
        .isLength({ min: 4, max: 32}).withMessage('Invalid login.')
        .matches(/^[a-zA-Z0-9]+$/).withMessage('Invalid login.'),
    body('password_hash')
        .isLength({ min: 8}).withMessage('Invalid password.')
        .custom(value => !/\s/.test(value)).withMessage('Invalid password.')
]

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM users'
    db.query(sql, (err, data) => {
        if (err) 
            return res.json(err)
        res.json(data)
    })
})

router.post('/create', createUserValidationChain(), (req, res) => {
    const validationErrors = validationResult(req)

    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ errors: validationErrors.array() })
    }

    const userData = req.body

    userData.password_hash = crypto.createHash('md5').update(userData.password_hash).digest('hex')
    const sql = `INSERT INTO users (login, password_hash, name, description) VALUES (?, ?, ?, ?)`

    db.query(sql, [userData.login, userData.password_hash, userData.name, userData.description], (err, result) => {
        if(err) {
            if(err.errno == 1062)
                return res.json({ error: 'Login is already taken by someone.' })
            return res.json(err)
        }
        return res.json(result)
    })
})

router.get('/registration', (req, res) => {
    require("fs").readFile(path.join(__dirname, "../../frontend/views/registration.html"), function (err, data) {
            if(err) console.error(err);
        else{
            res.end(data)
        
        }
    })
})

router.post('/login', loginUserValidationChain(),(req, res) => {
    const validationErrors = validationResult(req)

    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ errors: validationErrors.array() })
    }

    const login = req.body.login
    let password_hash = req.body.password_hash

    const sql = `SELECT * FROM users WHERE login = ?`

    db.query(sql, [login], (err, result) => {
        if(err) {
            return res.status(500).json({ error: 'Database error.'})
        }
 
        if(result.length === 0){
            return res.status(400).json({ error: 'Account does not exist.'})
        }

        const dbpassword_hash = result[0].password_hash

        password_hash = crypto.createHash('md5').update(password_hash).digest('hex') 

        if (dbpassword_hash !== password_hash) {
            return res.status(400).json({ error: 'Wrong password. Please try again.' })
        }

        const userId = result[0].id

        let rememberMe = true //replace later this
        let accesToken = null
        let refreshToken = null
        if(rememberMe) {
            accesToken = generateToken( userId, req.body.login, 1800 )
            refreshToken = generateToken( userId, req.body.login, 604800 )
            return res.cookie('refreshToken', refreshToken).header('Authorization', accesToken).json( {success: 'Login successful.'} )
        }

        return res.status(200).json({ success: 'Login successful.' })
    })
})

router.get('/login', (req, res) => {
    require("fs").readFile(path.join(__dirname, "../../frontend/views/login.html"), function (err, data) {
            if(err) console.error(err)
        else{
            res.end(data)
        }
    })
})

router.get('/protected', verifyToken, (req, res) => {
    const login = req.user
    
    res.status(200).json( {success: 'Auth successful.'} )
})

module.exports = router