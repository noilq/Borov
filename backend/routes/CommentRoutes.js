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