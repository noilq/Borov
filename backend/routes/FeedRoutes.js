const express = require('express')
const router = express.Router()
const db = require('../database')
const { verifyToken } = require('../middleware/authjwt')

//
//FEED
//

/**
 * @swagger
 * /feed/feedPostsDate:
 *   get:
 *     summary: Returns posts for feed.
 *     description: Returns feed posts from x to y, sorted by newest/oldest.
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
router.get('/feedPostsDate', verifyToken, (req, res) => {
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
 *   get:
 *     summary: Returns posts for feed.
 *     description: Returns feed posts from x to y, sorted by score.
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
router.get('/feedPostsScore', verifyToken, (req, res) => {
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
 *   get:
 *     summary: Returns user posts.
 *     description: Returns user posts from x to y, sorted by newest/oldest.
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
router.get('/userPostsDate', verifyToken, (req, res) => {
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
 *   get:
 *     summary: Returns user posts.
 *     description: Returns user posts from x to y, sorted by score.
 *     responses:
 *       200:
 *         description: Success.
 *       500:
 *         description: Server error.
 */

/**
 * Returns user posts from x to y, sorted by score.
 * @param {int} userId.query.required - Owner id.
 * @param {int} from.query.required - Starter pos.
 * @param {int} to.query.required - End pos.
 * @param {string} order.query - Optional param ('ASC' stands for less score, 'DESC' stands for more score), 'DESC' by default.
 * @returns {object} 200 - Success.
 * @returns {Error} 500 - Server error.
 */
router.get('/userPostsScore', verifyToken, (req, res) => {
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

function CreateView(postId, userId, callback) {
    const sql = `INSERT INTO views (post_id, user_id) VALUES (?, ?)`
    db.query(sql, [postId, userId], (err, result) => {
        if (err)
            return callback(err)
        callback(null, result)
    })
}

module.exports = router