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

/** 
 * @swagger
 * /post/unauthorized/:
 *   get:
 *     summary: Returns a post without authentication.
 *     description: Returns the details of a post by post ID, without requiring user authenticationыыыыыыыыыыыыыыыыыыы сууа.
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post.
 *     responses:
 *       200:
 *         description: Success.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Database error.
 */

/**
 * Returns a post without authentication.
 * @param {string} id.query.required - The ID of the post.
 * @returns {object} 200 - Success.
 * @returns {Error} 404 - Post not found.
 * @returns {Error} 500 - Database error.
 */

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

/** 
 * @swagger
 * /post/:
 *   get:
 *     summary: Returns a post with authentication.
 *     description: Returns the details of a post by post ID, requires authentication.
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post.
 *     responses:
 *       200:
 *         description: Success.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Database error.
 */

/**
 * Returns a post with authentication.
 * @param {string} id.query.required - The ID of the post.
 * @returns {object} 200 - Success.
 * @returns {Error} 404 - Post not found.
 * @returns {Error} 500 - Database error.
 */

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

/** 
 * @swagger
 * /post/allPosts/:
 *   get:
 *     summary: Returns all posts of the user.
 *     description: Returns all posts created by the authenticated user with view and vote details.
 *     responses:
 *       200:
 *         description: Success.
 *       400:
 *         description: Bad request.
 */

/**
 * Returns all posts of the user.
 * @returns {object} 200 - Success.
 * @returns {Error} 400 - Bad request.
 */

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

/** 
 * @swagger
 * /post/create/:
 *   post:
 *     summary: Creates a new post.
 *     description: Creates a new post.
 *     parameters:
 *       - in: body
 *         name: title
 *         schema:
 *           type: string
 *         required: true
 *         description: Post title.
 *       - in: body
 *         name: content
 *         schema:
 *           type: string
 *         required: true
 *         description: Post content.
 *       - in: category_id
 *         name: content
 *         schema:
 *           type: integer
 *         required: true
 *         description: Category id.
 *     responses:
 *       200:
 *         description: Success.
 *       400:
 *         description: Validation error.
 */

/**
 * Creates a new post.
 * @param {string} title.body.required - Post title.
 * @param {string} content.body.required - Post content.
 * @param {integer} category_id.body.required - Category id.
 * @returns {object} 200 - Success.
 * @returns {Error} 400 - Validation error.
 */

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


/** 
 * @swagger
 * /post/edit/:
 *   post:
 *     summary: Edits an existing post.
 *     description: Edits an existing post.
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the post.
 *       - in: body
 *         name: title
 *         schema:
 *           type: string
 *         required: true
 *         description: New post title.
 *       - in: body
 *         name: content
 *         schema:
 *           type: string
 *         required: true
 *         description: New post content.
 *       - in: body
 *         name: category_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: New category ID.
 *     responses:
 *       200:
 *         description: Success.
 *       400:
 *         description: Validation error.
 *       404:
 *         description: Post not found or not allowed.
 */

/**
 * Edits an existing post.
 * @param {string} id.query.required - Post ID.
 * @param {string} title.body.required - New post title.
 * @param {string} content.body.required - New post content.
 * @param {integer} category_id.body.required - New category ID.
 * @returns {object} 200 - Success.
 * @returns {Error} 400 - Validation error.
 * @returns {Error} 404 - Post not found or not allowed.
 */

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


/** 
 * @swagger
 * /post/delete/:
 *   post:
 *     summary: Deletes a post.
 *     description: Deletes a post.
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Post ID.
 *     responses:
 *       200:
 *         description: Success.
 *       404:
 *         description: Post not found or not allowed.
 */

/**
 * Deletes a post.
 * @param {string} id.query.required - Post ID.
 * @returns {object} 200 - Success.
 * @returns {Error} 404 - Post not found or not allowed.
 */

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

/** 
 * @swagger
 * /post/vote/:
 *   post:
 *     summary: Votes on a post.
 *     description: Votes on a post.
 *     parameters:
 *       - in: body
 *         name: id
 *         schema:
 *           type: int
 *         required: true
 *         description: Post ID.
 *       - in: body
 *         name: value
 *         schema:
 *           type: string
 *         required: true
 *         description: Vote value.
 *     responses:
 *       200:
 *         description: Success.
 *       400:
 *         description: Wrong vote value.
 *       404:
 *         description: Post not found.
 *       500:
 *         description: Database error.
 */

/**
 * Votes on a post.
 * @param {int} id.body.required - Post ID.
 * @param {string} value.body.required - Vote value (1, 0, or -1).
 * @returns {object} 200 - Success.
 * @returns {Error} 400 - Wrong vote value.
 * @returns {Error} 404 - Post not found.
 * @returns {Error} 500 - Database error.
 */

router.post('/vote', verifyToken, (req, res) => {
    const postId = req.body.id
    const value = req.body.value
    const user = req.user

    if (value !== '1' && value !== '0' && value !== '-1')
        return res.status(400).json({ err: 'Wrong vote value.' })

    let sql = `SELECT * FROM posts WHERE id = ?`
    db.query(sql, [postId], (err, postResult) => {
        if (err) return res.status(500).json({ error: 'Database error.', details: err })
        if (postResult.length === 0 || postResult[0].status_id === 3)
            return res.status(404).json({ error: 'Post not found.' })

        sql = `SELECT * FROM votes WHERE user_id = ? AND post_id = ?`
        db.query(sql, [user.userId, postId], (err, voteResult) => {
            if (err) return res.status(500).json({ error: 'Database error.', details: err })

            if (voteResult.length === 0) {
                sql = `INSERT INTO votes (value, user_id, post_id) VALUES (?, ?, ?)`
                db.query(sql, [value, user.userId, postId], (err, insertResult) => {
                    if (err) return res.status(500).json({ error: 'Database error.', details: err })

                    const updatedScore = parseInt(postResult[0].score) + parseInt(value)
                    sql = `UPDATE posts SET score = ? WHERE id = ?`
                    db.query(sql, [updatedScore, postId], (err, updateScoreResult) => {
                        if (err) return res.status(500).json({ error: 'Database error.', details: err })

                        return res.json({ newScore: updatedScore })
                    })
                })
            } else {
                const oldValue = voteResult[0].value
                const newValue = parseInt(value)
                const updatedValue = newValue - oldValue

                sql = `UPDATE votes SET value = ? WHERE user_id = ? AND post_id = ?`
                db.query(sql, [newValue, user.userId, postId], (err, updateResult) => {
                    if (err) return res.status(500).json({ error: 'Database error.', details: err })

                    const updatedScore = parseInt(postResult[0].score) + updatedValue
                    sql = `UPDATE posts SET score = ? WHERE id = ?`
                    db.query(sql, [updatedScore, postId], (err, updateScoreResult) => {
                        if (err) return res.status(500).json({ error: 'Database error.', details: err })

                        return res.json({ newScore: updatedScore })
                    })
                })
            }
        })
    })
})

/** 
 * @swagger
 * /post/getCategories/:
 *   get:
 *     summary: Returns all categories from db.
 *     description: Returns all categories from db.
 *     responses:
 *       200:
 *         description: Success.
 *       500:
 *         description: Database error.
 */

/**
 * Returns all categories from db.
 */
router.get('/getCategories', (req, res) => {
    const sql = 'SELECT * FROM categories';

    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error while attemptig to get categories:', err);
            return res.status(500).json({ message: 'Error while attemptig to get categories', error: err });
        }

        return res.status(200).json(result);
    });
})

module.exports = router