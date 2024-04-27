const jwt = require('jsonwebtoken')
//REALLY SECRET SECRETTOKEN, HAVE TO REPLACE IT AT SOME POINT
const secretKey = "devSecretToken"


/**
 * Middleware function to verify JWT token.
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token) return res.status(401).json({ error: 'Auth token is missing.'})

    jwt.verify(token, secretKey, (err, user) => {
        if(err) return res.status(403).json({ error: 'Token is not valid'})

        req.user = user
        next()
    })
}

/**
 * Middleware function to generate JWT token.
 * @param {string} login The user login.
 * @returns {string} The generated JWT token.
 */
function generateToken(login) {
    const iat = new Date().getTime() / 1000
    const exp = iat + 3600 //increase by hour
    const payload = { login, iat, exp }
    return jwt.sign(payload, secretKey)
}

module.exports = {
    verifyToken,
    generateToken
}