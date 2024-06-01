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

router.get('/', verifyToken, (req, res) => {
    commId = req.query.id

    const sql = `SELECT c.id, c.enrollment_date, c.content, c.status_id, c.comment_parent_id, c.post_parent_id, 
    (SELECT IFNULL(SUM(v.value), 0) FROM votes AS v WHERE v.comment_id = c.id) as score FROM comments AS c WHERE id = ?`
    db.query(sql, [commId], (err, result) => {
        if (err) 
            return res.json(err)
        if (result.length == 0 || result[0].status_id == 3)
            return res.status(404).json({ error: 'Comment not found.' })
        res.json(result[0])
    })
})

router.get('/getCommentsChain', verifyToken, (req, res) => {
    post_id = req.query.post_id
    
    const sql =  `
        SELECT
        c.id,
        c.enrollment_date,
        c.content,
        c.status_id,
        c.comment_parent_id,
        c.post_parent_id,
        (
            SELECT IFNULL(SUM(v.value), 0)
            FROM votes AS v
            WHERE v.comment_id = c.id
        ) AS score,
        u.login,
        u.name AS username
    FROM
        comments AS c
    JOIN
        users AS u ON c.owner_id = u.id
    WHERE
        c.post_parent_id = ? AND c.status_id != 3;`

    db.query(sql, [post_id], (err, results) => {
        if (err)
            return res.json(err);
        if (results.length == 0 || results[0].status_id == 3)
            return res.status(404).json({ error: 'No comments found for the given post.' });
        res.json(results);
    });
})

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

        sql = 'UPDATE comments SET status_id = 3 WHERE id = ? AND owner_id = ?;'

        db.query(sql, [commId, user.userId], (err, result) => {
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

router.post('/vote', verifyToken, (req, res) => {
    const commentId = req.body.id
    const value = req.body.value
    const user = req.user

    if (value !== '1' && value !== '0' && value !== '-1')
        return res.status(400).json({ err: 'Wrong vote value.' })

    let sql = `SELECT * FROM comments WHERE id = ?`
    db.query(sql, [commentId], (err, commentResult) => {
        if (err) return res.status(500).json({ error: 'Database error.', details: err })
        if (commentResult.length === 0 || commentResult[0].status_id === 3)
            return res.status(404).json({ error: 'Comment not found.' })

        sql = `SELECT * FROM votes WHERE user_id = ? AND comment_id = ?`
        db.query(sql, [user.userId, commentId], (err, voteResult) => {
            if (err) return res.status(500).json({ error: 'Database error.', details: err })

            if (voteResult.length === 0) {
                sql = `INSERT INTO votes (value, user_id, comment_id) VALUES (?, ?, ?)`
                db.query(sql, [value, user.userId, commentId], (err, insertResult) => {
                    if (err) return res.status(500).json({ error: 'Database error.', details: err })

                    const updatedScore = parseInt(commentResult[0].score) + parseInt(value)
                    sql = `UPDATE comments SET score = ? WHERE id = ?`
                    db.query(sql, [updatedScore, commentId], (err, updateScoreResult) => {
                        if (err) return res.status(500).json({ error: 'Database error.', details: err })

                        return res.json({ newScore: updatedScore - 1})
                    });
                });
            } else {
                const oldValue = voteResult[0].value
                const newValue = parseInt(value)
                const updatedValue = newValue - oldValue

                sql = `UPDATE votes SET value = ? WHERE user_id = ? AND comment_id = ?`
                db.query(sql, [newValue, user.userId, commentId], (err, updateResult) => {
                    if (err) return res.status(500).json({ error: 'Database error.', details: err })

                    const updatedScore = parseInt(commentResult[0].score) + updatedValue
                    sql = `UPDATE comments SET score = ? WHERE id = ?`
                    db.query(sql, [updatedScore, commentId], (err, updateScoreResult) => {
                        if (err) return res.status(500).json({ error: 'Database error.', details: err })

                        return res.json({ newScore: updatedScore - 1 })
                    })
                })
            }
        })
    })
})

module.exports = router