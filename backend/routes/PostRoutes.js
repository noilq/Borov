const express = require('express')
const router = express.Router()
const db = require('../database')
const { body, validationResult } = require('express-validator')
const path = require('path')
const { verifyToken, generateToken }= require('../middleware/authjwt.js')

const postValidationChain = () => [
    body('title')
        .isLength({ min: 1, max: 200}).withMessage('Title must be less than 200 characters long.'),
    body('content')
        .isLength({ min: 0, max: 2500}).withMessage('Content must be less than 2500 characters long')
]

router.get('/', verifyToken, (req, res) => {
    const sql = 'SELECT * FROM posts'
    db.query(sql, (err, data) => {
        if (err) 
            return res.json(err)
        res.json(data)
    })
})

router.post('/create', verifyToken, postValidationChain(), (req, res) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty())
        return res.status(400).json( { errors: validationErrors.array() })

    const postData = req.body
    
    const user = req.user
    
    const sql = `INSERT INTO posts (title, content, category_id) VALUES (?, ?, ?)`

    db.query(sql, [postData.title, postData.content, postData.category_id], (err, result) => {
        if(err)
            return res.json(err)

        return res.json(result)
    })
})

module.exports = router