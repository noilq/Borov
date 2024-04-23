const express = require('express')
const router = express.Router()
const db = require('../database')
const crypto = require('crypto');


router.get('/', (req, res) => {
    const sql = 'SELECT * FROM users'
    db.query(sql, (err, data) => {
        if (err) 
            return res.json(err)
        return res.json(data)
    })
})

router.post('/create', (req, res) => {
    const userData = req.body

    userData.password_hash = crypto.createHash('md5').update(userData.password_hash).digest('hex');
    const sql = `INSERT INTO users (login, password_hash, name, description) VALUES (?, ?, ?, ?)`

    db.query(sql, [userData.login, userData.password_hash, userData.name, userData.description], (err, result) => {
        if(err) 
            return res.json(err)
        return res.json(result)
    })
})

module.exports = router