const express = require('express')
const router = express.Router()
const db = require('../database')
const { verifyToken } = require('../middleware/authjwt')
const path = require('path')

//
//FEED
//

/**
 * @swagger
 * /feed/feedPostsDate:
 *   post:
 *     summary: Returns posts for feed.
 *     description: Returns feed posts from x to y, sorted by newest/oldest.
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: integer
 *         required: true
 *         description: Starter pos.
 *       - in: query
 *         name: to
 *         schema:
 *           type: integer
 *         required: true
 *         description: End pos.
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Success.
 *       500:
 *         description: Server error.
 */

/**
 * Returns user posts from x to y, sorted by newest/oldest.
 * @param {int} from.query.required - Starter pos.
 * @param {int} to.query.required - End pos.
 * @param {string} order.query - Optional param ('ASC' stands for old, 'DESC' stands for new), 'DESC' by default.
 * @returns {object} 200 - Success.
 * @returns {Error} 500 - Server error.
 */
router.post('/feedPostsDate', verifyToken, (req, res) => {
    let { userId, from, to, order } = req.query
    
    if(order !== 'ASC')
        order = 'DESC'

    let offset = parseInt(from)
    let limit = parseInt(to) - parseInt(from) + 1

    let sql = `SELECT * FROM posts AS p WHERE p.owner_id = ? AND status_id != 3 ORDER BY enrollment_date ${order} LIMIT ?, ?;`

    db.query(sql, [parseInt(userId), offset, limit], function(err, result){
        if(err){
            console.log(err)
            return res.status(500).json({ error: 'Server error.'})
        }
        else{
            result.forEach(res => {
                CreateView(res.id, req.user.userId, (err, ress) => {
                    if (err)
                        return res.status(500).json({ error: 'Database error.' })
                })
            })
            return res.status(200).json(result)
        }   
    })
})

/**
 * @swagger
 * /feed/feedPostsScore:
 *   post:
 *     summary: Returns posts for feed.
 *     description: Returns feed posts from x to y, sorted by score.
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: integer
 *         required: true
 *         description: Starter pos.
 *       - in: query
 *         name: to
 *         schema:
 *           type: integer
 *         required: true
 *         description: End pos.
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Success.
 *       500:
 *         description: Server error.
 */

/**
 * Returns feed posts from x to y, sorted by score.
 * @param {int} from.query.required - Starter pos.
 * @param {int} to.query.required - End pos.
 * @param {string} order.query - Optional param ('ASC' stands for old, 'DESC' stands for new), 'DESC' by default.
 * @returns {object} 200 - Success.
 * @returns {Error} 500 - Server error.
 */
router.post('/feedPostsScore', verifyToken, (req, res) => {
    let { from, to, order } = req.query
    
    if(order !== 'ASC')
        order = 'DESC'

    let offset = parseInt(from)
    let limit = parseInt(to) - parseInt(from) + 1

    let sql = `SELECT * FROM posts AS p WHERE status_id != 3 ORDER BY p.score ${order} LIMIT ?, ?;`

    db.query(sql, [parseInt(userId), offset, limit], function(err, result){
        if(err){
            console.log(err)
            return res.status(500).json({ error: 'Server error.'})
        }
        else{
            result.forEach(res => {
                CreateView(res.id, req.user.userId, (err, ress) => {
                    if (err)
                        return res.status(500).json({ error: 'Database error.' })
                })
            })
            return res.status(200).json(result)
        }   
    })
})





//
//USER POSTS
//

/**
 * @swagger
 * /feed/userPostsDate:
 *   post:
 *     summary: Returns user posts.
 *     description: Returns user posts from x to y, sorted by newest/oldest.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: User id.
 *       - in: query
 *         name: from
 *         schema:
 *           type: integer
 *         required: true
 *         description: Starter pos.
 *       - in: query
 *         name: to
 *         schema:
 *           type: integer
 *         required: true
 *         description: End pos.
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Success.
 *       500:
 *         description: Server error.
 */

/**
 * Returns user posts from x to y, sorted by newest/oldest.
 * @param {int} userId.query.required - User id.
 * @param {int} from.query.required - Starter pos.
 * @param {int} to.query.required - End pos.
 * @param {string} order.query - Optional param ('ASC' stands for old, 'DESC' stands for new), 'DESC' by default.
 * @returns {object} 200 - Success.
 * @returns {Error} 500 - Server error.
 */
router.post('/userPostsDate', verifyToken, (req, res) => {
    let { userId, from, to, order } = req.query
    
    if(order !== 'ASC')
        order = 'DESC'

    let offset = parseInt(from)
    let limit = parseInt(to) - parseInt(from) + 1

    let sql = `SELECT * FROM posts AS p WHERE p.owner_id = ? AND status_id != 3 ORDER BY enrollment_date ${order} LIMIT ?, ?;`

    db.query(sql, [parseInt(userId), offset, limit], function(err, result){
        if(err){
            console.log(err)
            return res.status(500).json({ error: 'Server error.'})
        }
        else{
            result.forEach(res => {
                CreateView(res.id, req.user.userId, (err, ress) => {
                    if (err)
                        return res.status(500).json({ error: 'Database error.' })
                })
            })
            return res.status(200).json(result)
        }   
    })
})

/**
 * @swagger
 * /feed/userPostsScore:
 *   post:
 *     summary: Returns user posts.
 *     description: Returns user posts from x to y, sorted by score.
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Owner id.
 *       - in: query
 *         name: from
 *         schema:
 *           type: integer
 *         required: true
 *         description: Starter pos.
 *       - in: query
 *         name: to
 *         schema:
 *           type: integer
 *         required: true
 *         description: End pos.
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Success.
 *       500:
 *         description: Server error.
 */

/**
 * Returns user posts from x to y, sorted by score.
 * @param {number} userId.query.required - Owner id.
 * @param {number} from.query.required - Starter pos.
 * @param {number} to.query.required - End pos.
 * @param {string} order.query - Optional param ('ASC' stands for less score, 'DESC' stands for more score), 'DESC' by default.
 * @returns {object} 200 - Success.
 * @returns {Error} 500 - Server error.
 */
router.post('/userPostsScore', verifyToken, (req, res) => {
    let { userId, from, to, order } = req.query
    
    if(order !== 'ASC')
        order = 'DESC'

    let offset = parseInt(from)
    let limit = parseInt(to) - parseInt(from) + 1

    let sql = `SELECT * FROM posts AS p WHERE p.owner_id = ? AND status_id != 3 ORDER BY p.score ${order} LIMIT ?, ?;`

    db.query(sql, [parseInt(userId), offset, limit], function(err, result){
        if(err){
            console.log(err)
            return res.status(500).json({ error: 'Server error.'})
        }
        else{
            result.forEach(res => {
                CreateView(res.id, req.user.userId, (err, ress) => {
                    if (err)
                        return res.status(500).json({ error: 'Database error.' })
                })
            })
            return res.status(200).json(result)
        }    
    })
})


/**
 * @swagger
 * CreateView:
 *   get:
 *     summary: Create view for post.
 *     description: Create view for specific post.
 *     parameters:
 *       - in: query
 *         name: postId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Post id.
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: User id.
 */

/**
 * Create view for specific post.
 * @param {number} postId - Post id.
 * @param {number} userId - User id.
 * @param {function} callback - Callback function.
 */
function CreateView(postId, userId, callback) {
    const sql = `INSERT INTO views (post_id, user_id) VALUES (?, ?)`
    db.query(sql, [postId, userId], (err, result) => {
        if (err)
            return callback(err)
        callback(null, result)
    })
}

/** 
 * @swagger
 * /feed/:
 *   get:
 *     summary: Returns feed page.
 *     description: Returns feed page.
 */

/**
 * Returns feed page я усейн болт.
 */
router.get('/', (req, res) => {
    require("fs").readFile(path.join(__dirname, "../../frontend/src/pages/feed.html"), function (err, data) {
            if(err) console.error(err)
        else{
            res.end(data)
        
        }
    })
})

module.exports = router