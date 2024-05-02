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

router.get('/', (req, res) => {
    const postId = req.query.id

    const sql = 'SELECT * FROM posts WHERE id = ?'
    db.query(sql, [postId], (err, result) => {
        if (err) 
            return res.json(err);
        if (result.length === 0)
            return res.status(404).json({ error: 'Post not found.' });
        res.json(result[0])
    })
})

router.post('/create', verifyToken, postValidationChain(), (req, res) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty())
        return res.status(400).json( { errors: validationErrors.array() })

    const postData = req.body
    
    const user = req.user

    const sql = `INSERT INTO posts (title, content, category_id, owner_id) VALUES (?, ?, ?, ?)`

    db.query(sql, [postData.title, postData.content, postData.category_id, user.userId], (err, result) => {
        if(err)
            return res.json(err)

        return res.json(result)
    })
})

router.post('/edit', verifyToken, postValidationChain(), (req, res) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty())
        return res.status(400).json( { errors: validationErrors.array() })

    const postId = req.query.id  
    
    const user = req.user
    let sql = 'SELECT * FROM posts WHERE id = ?'

    db.query(sql, [postId], (err, result) => {
        if(err)
            return res.json(err)

        if(result.length === 0)
            return res.status(404).json({ error: 'Post not found.'})

        post = result[0]
        
        if(!post == user.userId)
            return res.status(404).json({ error: 'Now allowed.'})   
    })
    
    const newPostData = req.body

    sql = 'UPDATE posts SET title = ?, content = ?, category_id = ? WHERE id = ?'

    db.query(sql, [newPostData.title, newPostData.content, newPostData.category_id, postId], (err, result) => {
        if(err)
            return res.json(err)

        return res.json(result)
    })
})

router.post('/delete', verifyToken, (req, res) => {
    const postId = req.query.id
    
    const user = req.user
    let sql = 'SELECT * FROM posts WHERE id = ?'
    
    db.query(sql, [postId], (err, result) => {
        if(err)
            return res.json(err)

        if(result.length === 0)
            return res.status(404).json({ error: 'Post not found.'})

        const post = result[0]

        if(!post == user.userId)
            return res.status(404).json({ error: 'Now allowed.'})   
    })

    sql = 'DELETE FROM posts WHERE id = ?;'

    db.query(sql, [postId], (err, result) => {
        if(err)
            return res.json(err)

        return res.json(result)
    })
})

module.exports = router