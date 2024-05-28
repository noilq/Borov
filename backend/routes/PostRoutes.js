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

router.get('/unauthorized', (req, res) => {
    const postId = req.query.id

    GetPost(postId, (err, result) => {
        if (err)
            return res.status(500).json({ error: 'Database error.' })
        if (result.length == 0 || result[0].status_id == 3)
            return res.status(404).json({ error: 'Post not found.' })
        res.json(result)
    })
})

router.get('/', verifyToken, (req, res) => {
    const postId = req.query.id
    const user = req.user

    GetPost(postId, (err, result) => {
        if (err)
            return res.status(500).json({ error: 'Database error.' })
        if (result.length == 0 || result[0].status_id == 3)
            return res.status(404).json({ error: 'Post not found.' })
        res.json(result)
    })

    CreateView(postId, user.userId, (err, result) => {
        if (err)
            return res.status(500).json({ error: 'Database error.' })
    })
})

router.get('/allPosts', verifyToken, (req, res) => {
    const user = req.user

    let sql = `SELECT p.id, p.enrollment_date, p.title, p.content, 
    (SELECT IFNULL(SUM(v.value), 0) FROM votes v WHERE v.post_id = p.id) AS score, p.status_id, p.category_id, p.owner_id,
    COUNT(DISTINCT vw.user_id) AS unique_views,
    COUNT(vw.id) AS total_views
    FROM posts AS p LEFT JOIN votes AS v ON p.id = v.post_id LEFT JOIN views AS vw ON p.id = vw.post_id WHERE p.owner_id = ?
    GROUP BY p.id, p.enrollment_date, p.title, p.content, p.status_id, p.category_id, p.owner_id;`
    db.query(sql, [user.userId], function (err, result) {
        if(err) {
            console.log("Error: " + err);
            return res.status(400).json({error: err})
        }
        else{
            console.log(result);
            return res.status(200).json(result)
        }
    })
})
function GetPost(id, callback){
    const sql = `SELECT p.id, p.enrollment_date, p.title, p.content, 
    (SELECT IFNULL(SUM(v.value), 0) FROM votes v WHERE v.post_id = p.id) AS score, p.status_id, p.category_id, p.owner_id,
    COUNT(DISTINCT vw.user_id) AS unique_views,
    COUNT(vw.id) AS total_views
    FROM posts AS p LEFT JOIN votes AS v ON p.id = v.post_id LEFT JOIN views AS vw ON p.id = vw.post_id WHERE p.id = ? 
    GROUP BY p.id, p.enrollment_date, p.title, p.content, p.status_id, p.category_id, p.owner_id;`
    db.query(sql, [id], (err, result) => {
        if (err)
            return callback(err)
        callback(null, result)
    })
}

function CreateView(postId, userId, callback) {
    const sql = `INSERT INTO views (post_id, user_id) VALUES (?, ?)`
    db.query(sql, [postId, userId], (err, result) => {
        if (err)
            return callback(err)
        callback(null, result)
    });
}

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

        if(result.length == 0 || result[0].status_id == 3)
            return res.status(404).json({ error: 'Post not found.'})

        post = result[0]
        
        if(!post == user.userId)
            return res.status(404).json({ error: 'Now allowed.'})   

        const newPostData = req.body

        sql = 'UPDATE posts SET title = ?, content = ?, category_id = ?, status_id = 2 WHERE id = ? AND owner_id = ?'
        
        db.query(sql, [newPostData.title, newPostData.content, newPostData.category_id, postId, user.userId], (err, result) => {
            if(err)
                return res.json(err)
        
            return res.json(result)
        })
    })
})

router.post('/delete', verifyToken, (req, res) => {
    const postId = req.query.id
    
    const user = req.user
    let sql = 'SELECT * FROM posts WHERE id = ?'
    
    db.query(sql, [postId], (err, result) => {
        if(err)
            return res.json(err)

        if(result.length == 0 || result[0].status_id == 3)
            return res.status(404).json({ error: 'Post not found.'})

        const post = result[0]

        if(!post == user.userId)
            return res.status(404).json({ error: 'Now allowed.'})   

        sql = 'UPDATE posts SET status_id = 3 WHERE id = ? AND owner_id = ?;'

        db.query(sql, [postId, user.userId], (err, result) => {
            if(err)
                return res.json(err)

            return res.json(result)
        })
    })
})

router.post('/vote', verifyToken, (req, res) => {
    const postId = req.query.id
    const value = req.query.value
    const user = req.user
    
    if(value !== '1' && value !== '0' && value !== '-1')
        return res.status(400).json({ err: 'Wrong vote value.'})
    
    let sql = `SELECT * FROM posts WHERE id = ?`
    db.query(sql, [postId], (err, result) => {
        if(result.length == 0 || result[0].status_id == 3)
            return res.status(404).json({ error: 'Post not found.'})
        else{
            sql = `SELECT * FROM votes WHERE user_id = ? AND post_id = ?`
            db.query(sql, [user.userId, postId], (err, result) => {
                if(result.length == 0){
                    sql = `INSERT INTO votes (value, user_id, post_id ) VALUES (?, ?, ?)`
                    db.query(sql, [value, user.userId, postId], (err, result) => {
                        if(err)
                            return res.json(err)
                        
                        return res.json(result)
                    })
                }else{
                    sql = `UPDATE votes SET value = ? WHERE user_id = ? AND post_id = ?`
                    db.query(sql, [value, user.userId, postId], (err, result) => {
                    if(err)
                        return res.json(err)
                    
                    return res.json(result)
                    })
                }  
            })
        }
    })
})

/** 
 * @swagger
 * /get/getCategories:
 *   get:
 *     summary: Returns all categories from db.
 *     description: Returns all categories from db.
 */

/**
 * Returns all categories from db.
 */
router.get('/getCategories', (req, res) => {
    const sql = 'SELECT * FROM categories';

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Ошибка при выполнении запроса:', err);
            return res.status(500).json({ message: 'Ошибка при получении категорий', error: err });
        }

        return res.status(200).json(result);
    });
})

module.exports = router