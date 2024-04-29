const jwt = require('jsonwebtoken')
//REALLY SECRET SECRETTOKEN, HAVE TO REPLACE IT AT SOME POINT
const secretKey = "devSecretToken"


/**
 * Middleware function to verify JWT token.
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization']
    let accessToken = authHeader && authHeader.split(' ')[1]
    const refreshToken = req.cookies.refreshToken

    if(!accessToken && !refreshToken) 
        return res.status(401).json({ error: 'Token is missing.'})

    try{
        const payload = jwt.verify(accessToken, secretKey)
        req.user = payload
        
        next()
    }catch(err){
        try{
            const payload = jwt.verify(refreshToken, secretKey)
            req.user = payload 
            
            const newAccessToken = generateToken(payload.login, 1800)

            return res.cookie('refreshToken', refreshToken).header('Authorization', newAccessToken).send({ user: req.user })
        }catch(err){
            return res.status(401).json({ error: 'Invalid token.'})
        }
    }
}

/**
 * Middleware function to generate JWT token.
 * @param {string} login The user login.
 * @param {int} expiredAt The time in seconds before expired.
 * @returns {string} The generated JWT token.
 */
function generateToken(login, expiredAt) {
    const iat = new Date().getTime() / 1000
    const exp = iat + expiredAt //increase by hour
    const payload = { login, iat, exp }
    return jwt.sign(payload, secretKey)
}

module.exports = {
    verifyToken,
    generateToken
}