const express = require('express')
const router = express.Router()
const db = require('../database')
const { body, validationResult } = require('express-validator')
const path = require('path')
const { verifyToken, generateToken }= require('../middleware/authjwt.js')
const { error } = require('console')

const commentValidationChain = () => [
    body('content')
        .isLength({ min: 0, max: 2500}).withMessage('Content must be less than 1000 characters long')
]

router.post('/create', verifyToken, commentValidationChain(), async (req, res) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty())
        return res.status(400).json( { errors: validationErrors.array() })

    const commentData = req.body
    
    const commentParentId = commentData.comment_parent_id || null
    
    let postExists = false
    let commExists = false

    try{
        postExists = await PostExisting(commentData.post_parent_id)
        if(commentParentId != null){
            commExists = await CommentExisting(commentData.post_parent_id, commentParentId)
        }
        else{
            commExists = true
        }
        
    }catch(err){
        console.log(err)
    }

    if(!postExists || !commExists){
        return res.status(400).json({ error: "There is no comment or post with that id." })
    }

    const user = req.user

    const sql = `INSERT INTO comments (content, owner_id, comment_parent_id, post_parent_id) VALUES (?, ?, ?, ?)`

    db.query(sql, [commentData.content, user.userId, commentParentId, commentData.post_parent_id], (err, result) => {
        if(err)
            return res.json(err)

        return res.json(result)
    })
})

router.post('/edit', verifyToken, commentValidationChain(), (req, res) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty())
        return res.status(400).json( { errors: validationErrors.array() })

    const commId = req.query.id  
    
    const user = req.user
    let sql = 'SELECT * FROM comments WHERE id = ?'

    let isAllowed = true
    db.query(sql, [commId], (err, result) => {
        if(err)
            return res.json(err)
            
        if(result.length == 0 || result[0].status_id == 3)
            return res.status(404).json({ error: 'Comment not found.'})

        comm = result[0]
        
        if(comm.owner_id !== user.userId)
            return res.status(404).json({ error: 'Not allowed.'})    
        
        const newCommData = req.body

        sql = 'UPDATE comments SET content = ?, status_id = 2 WHERE id = ? AND owner_id = ?'
    
        db.query(sql, [newCommData.content, commId, user.userId], (err, result) => {
            if(err)
                return res.json(err)
            
            return res.json(result)
        })
    })
})

router.post('/delete', verifyToken, (req, res) => {
    const commId = req.query.id
    
    const user = req.user
    let sql = 'SELECT * FROM comments WHERE id = ?'
    
    db.query(sql, [commId], (err, result) => {
        if(err)
            return res.json(err)

        if(result.length == 0 || result[0].status_id == 3)
            return res.status(404).json({ error: 'Comment not found.'})

        const comm = result[0]

        if(comm.owner_id !== user.userId)
            return res.status(404).json({ error: 'Now allowed.'})

        sql = 'UPDATE comments SET status_id = 3 WHERE id = ?;'

        db.query(sql, [commId], (err, result) => {
            if(err)
                return res.json(err)
        
            return res.json(result)
        })
    })
})

async function PostExisting(postId) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) AS count FROM posts WHERE id = ?'
        db.query(sql, [postId], (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result && result.length > 0 && result[0].count !== undefined && result[0].count > 0)
            }
        })
    })
}

async function CommentExisting(postId, commId) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT COUNT(*) AS count FROM comments WHERE id = ? AND post_parent_id = ?'
        db.query(sql, [commId, postId], (err, result) => {
            if (err) {
                reject(err)
            } else {
                resolve(result && result.length > 0 && result[0].count !== undefined && result[0].count > 0)
            }
        })
    })
}

module.exports = router