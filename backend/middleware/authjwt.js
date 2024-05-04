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
        if(err.name === 'TokenExpiredError' && refreshToken){
            try{
                const payload = jwt.verify(refreshToken, secretKey)
                req.user = payload 
                
                const newAccessToken = generateToken(payload.userId, payload.login, 1800)
    
                res.cookie('refreshToken', refreshToken).header('Authorization', newAccessToken).send({ user: req.user })
                return
            }catch(err){
                return res.status(401).json({ error: 'Invalid token.'})
            }
        }else{
            return res.status(401).json({ error: 'Error while validating token.'})
        }
        
    }
}

/**
 * Middleware function to generate JWT token.
 * @param {int} userId The user id.
 * @param {string} login The user login.
 * @param {int} expiredAt The time in seconds before expired.
 * @returns {string} The generated JWT token.
 */
function generateToken(userId, login, expiredAt) {
    const iat = new Date().getTime() / 1000
    const exp = iat + expiredAt //increase by hour
    const payload = { userId, login, iat, exp }
    return jwt.sign(payload, secretKey)
}

module.exports = {
    verifyToken,
    generateToken
}