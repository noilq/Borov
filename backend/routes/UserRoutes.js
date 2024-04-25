const express = require('express')
const router = express.Router()
const db = require('../database')
const crypto = require('crypto')
const { body, validationResult } = require('express-validator');

//const body('password_hash') = body('password_hash').trim().slice(0, 256); 
const createUserValidationChain = [
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

router.get('/', (req, res) => {
    const sql = 'SELECT * FROM users'
    db.query(sql, (err, data) => {
        if (err) 
            return res.json(err)
        return res.json(data)
    })
})

router.post('/create', createUserValidationChain, (req, res) => {
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

module.exports = router