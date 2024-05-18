const express = require('express')
const router = express.Router()
const db = require('../database')
const crypto = require('crypto');
const { body, validationResult } = require('express-validator')
const path = require('path')
const { verifyToken, generateToken }= require('../middleware/authjwt.js');
const { log } = require('console');

const createUserValidationChain = () => [
    body('login')
        .isLength({ min: 4, max: 32}).withMessage('Login must be between 4-32 characters.')
        .matches(/^[a-zA-Z0-9]+$/).withMessage('Login must contain only letters and numbers.'),
    body('password_hash')
        .isLength({ min: 8}).withMessage('Password must be at least 8 characters long.')
        .custom(value => !/\s/.test(value)).withMessage('Password must not contain spaces.'),
    body('name')
        .isLength({ min: 4, max: 50}).withMessage('Name must be between 4-50 characters.'),
    body('description')
        .optional()
        .isLength({ max: 500}).withMessage('Description must be at most 500 characters long.')
]

const editUserValidationChain = () => [
    body('name')
        .isLength({ min: 4, max: 50}).withMessage('Name must be between 4-50 characters.'),
    body('description')
        .isLength({ max: 500}).withMessage('Description must be at most 500 characters long.')
]

const loginUserValidationChain = () => [
    body('login')
        .isLength({ min: 4, max: 32}).withMessage('Invalid login.')
        .matches(/^[a-zA-Z0-9]+$/).withMessage('Invalid login.'),
    body('password_hash')
        .isLength({ min: 8}).withMessage('Invalid password.')
        .custom(value => !/\s/.test(value)).withMessage('Invalid password.')
]
/*
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM users'
    db.query(sql, (err, data) => {
        if (err) 
            return res.json(err)
        res.json(data)
    })
})*/

/** 
 * @swagger
 * /post/:
 *   post:
 *     summary: Returns user data.
 *     description: Returns user data by userd login.
 *     parameters:
 *       - in: query
 *         name: login
 *         schema:
 *           type: string
 *         required: true
 *         description: User login.
 *     responses:
 *       200:
 *         description: Success.
 *       500:
 *         description: Server error.
 */

/**
 * Returns user data by userd login.
 * @param {string} login.query.required - User login.
 * @returns {object} 200 - Success.
 * @returns {Error} 404 - User not found.
 */
router.post('/', verifyToken, (req, res) => {
    userLogin = req.query.login

    const sql = `SELECT u.login, u.enrollment_date, u.name, u.description, u.reputation FROM users as u WHERE u.login = ?;`
    db.query(sql, [userLogin], (err, result) => {
        if (err) 
            return res.json(err)
        if (result.length == 0)
            return res.status(404).json({ error: 'User not found.' })
        res.json(result[0])
    })
})


/** 
 * @swagger
 * /post/edit:
 *   post:
 *     summary: Edits user data.
 *     description: Edits user by login.
 *     parameters:
 *       - in: query
 *         name: login
 *         schema:
 *           type: string
 *         required: true
 *         description: User login.
 *       - in: body
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: New user name.
 *       - in: body
 *         name: description
 *         schema:
 *           type: string
 *         required: true
 *         description: New user description.
 *     responses:
 *       200:
 *         description: Success.
 *       400:
 *         description: Failed validation.
 */

/**
 * Edits user by login.
 * @param {string} req.user.required - User login.
 * @param {string} req.body.name.required - New user name.
 * @param {string} req.body.description.required - New user description.
 * @returns {object} 200 - Success.
 * @returns {Error} 400 - Failed validation.
 */
router.post("/edit", verifyToken, editUserValidationChain(), (req, res) => {
    const validationErrors = validationResult(req)

    if(!validationErrors.isEmpty())
        return res.status(400).json( { errors: validationErrors.array() })

    const user = req.user
    const name = req.body.name;
    const description = req.body.description;

    var sql = "UPDATE users SET name=?,description=? WHERE users.login = ?";
    db.query(sql, [name, description, user.login], function (err, result) {
        if(err) console.log("error: " + err);
        else{
            console.log(result);
            return res.status(200).json({result: result});
        }
    })
})

/** 
 * @swagger
 * /post/create:
 *   post:
 *     summary: Createы user.
 *     description: Createы user.
 *     parameters:
 *       - in: body
 *         name: login
 *         schema:
 *           type: string
 *         required: true
 *         description: User login.
 *       - in: body
 *         name: password_hash
 *         schema:
 *           type: string
 *         required: true
 *         description: User password_hash.
 *       - in: body
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: User name.
 *       - in: body
 *         name: description
 *         schema:
 *           type: string
 *         required: true
 *         description: User description.
 *     responses:
 *       200:
 *         description: Success.
 *       400:
 *         description: Failed validation.
 */

/**
 * Createы user.
 * @param {string} req.body.login.required - User login.
 * @param {string} req.body.password_hash.required - User password.
 * @param {string} req.body.name.required - User name.
 * @param {string} req.body.description.required - User description.
 * @returns {object} 200 - Success.
 * @returns {Error} 400 - Failed validation.
 */
router.post('/create', createUserValidationChain(), (req, res) => {
    const validationErrors = validationResult(req)

    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ errors: validationErrors.array() })
    }

    const userData = req.body

    userData.password_hash = crypto.createHash('md5').update(userData.password_hash).digest('hex')
    const sql = `INSERT INTO users (login, password_hash, name, description) VALUES (?, ?, ?, ?)`

    db.query(sql, [userData.login, userData.password_hash, userData.name, userData.description], (err, result) => {
        if(err) {
            if(err.errno == 1062)
                return res.json({ error: 'Login is already taken by someone.' })
            return res.json(err)
        }
        return res.json(result)
    })
})

/** 
 * @swagger
 * /post/registration:
 *   get:
 *     summary: Returns registration form.
 *     description: Returns registration form.
 */

/**
 * Returns registration form.
 */
router.get('/registration', (req, res) => {
    require("fs").readFile(path.join(__dirname, "../../frontend/src/pages/registration.html"), function (err, data) {
            if(err) console.error(err);
        else{
            res.end(data)
        
        }
    })
})

/** 
 * @swagger
 * /post/settings:
 *   get:
 *     summary: Returns settings form.
 *     description: Returns settings form.
 */

/**
 * Returns settings form.
 */
router.get('/settings', (req, res) => {
    require("fs").readFile(path.join(__dirname, "../../frontend/src/pages/settings.html"), function (err, data) {
            if(err) console.error(err);
        else{
            res.end(data)
        
        }
    })
})

/** 
 * @swagger
 * /post/feed:
 *   get:
 *     summary: Returns feed form.
 *     description: Returns feed form.
 */

/**
 * Returns feed form.
 */
router.get('/feed', (req, res) => {
    require("fs").readFile(path.join(__dirname, "../../frontend/src/pages/feed.html"), function (err, data) {
            if(err) console.error(err);
        else{
            res.end(data)
        
        }
    })
})

/** 
 * @swagger
 * /post/login:
 *   post:
 *     summary: Login user.
 *     description: Returns auth tokens.
 *     parameters:
 *       - in: body
 *         name: login
 *         schema:
 *           type: string
 *         required: true
 *         description: User login.
 *       - in: body
 *         name: password_hash
 *         schema:
 *           type: string
 *         required: true
 *         description: User password_hash.
 *     responses:
 *       200:
 *         description: Success.
 *       400:
 *         description: Wrong input. 
 *       500:
 *         description: Server error. 
 */

/**
 * Login, returns auth tokens..
 * @param {string} req.body.login.required - User login.
 * @param {string} req.body.password_hash.required - User password.
 * @returns {object} 200 - Success.
 * @returns {Error} 400 - Wrong input.
 * @returns {Error} 500 - Server error.
 */
router.post('/login', loginUserValidationChain(),(req, res) => {
    const validationErrors = validationResult(req)

    if (!validationErrors.isEmpty()) {
        return res.status(400).json({ errors: validationErrors.array() })
    }

    const login = req.body.login
    let password_hash = req.body.password_hash

    const sql = `SELECT * FROM users WHERE login = ?`

    db.query(sql, [login], (err, result) => {
        if(err) {
            return res.status(500).json({ error: 'Database error.'})
        }
 
        if(result.length === 0){
            return res.status(400).json({ error: 'Account does not exist.'})
        }

        const dbpassword_hash = result[0].password_hash

        password_hash = crypto.createHash('md5').update(password_hash).digest('hex') 

        if (dbpassword_hash !== password_hash) {
            return res.status(400).json({ error: 'Wrong password. Please try again.' })
        }

        const userId = result[0].id

        let rememberMe = true //replace later this
        let accesToken = null
        let refreshToken = null
        if(rememberMe) {
            accesToken = generateToken( userId, req.body.login, 1800 )
            refreshToken = generateToken( userId, req.body.login, 604800 )
            console.log(accesToken);
            return res.cookie('refreshToken', refreshToken).header('Authorization', accesToken).json( {success: 'Login successful.'} )
        }

        return res.status(200).json({ success: 'Login successful.' })
    })
})

/** 
 * @swagger
 * /post/login:
 *   get:
 *     summary: Returns login form.
 *     description: Returns login form.
 */

/**
 * Returns login form.
 */
router.get('/login', (req, res) => {
    require("fs").readFile(path.join(__dirname, "../../frontend/src/pages/login.html"), function (err, data) {
            if(err) console.error(err)
        else{
            res.end(data)
        }
    })
})

/** 
 * @swagger
 * /post/profile:
 *   get:
 *     summary: Returns profile form.
 *     description: Returns profile form.
 */

/**
 * Returns profile form.
 */
router.get('/profile', (req, res) => {
    require("fs").readFile(path.join(__dirname, "../../frontend/src/pages/profile.html"), function (err, data) {
            if(err) console.error(err)
        else{
            res.end(data)
        }
    })
})

/** 
 * @swagger
 * /post/protected:
 *   get:
 *     summary: Auth test endpoint.
 *     description: Auth test endpoint.
 */

/**
 * Returns Auth test endpoint.
 */
router.get('/protected', verifyToken, (req, res) => {
    const login = req.user
    
    res.status(200).json( {success: 'Auth successful.'} )
})

module.exports = router