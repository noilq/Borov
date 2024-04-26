const jwt = require('jsonwebtoken')
//REALLY SECRET SECRETTOKEN, HAVE TO REPLACE IT AT SOME POINT
const secretKey = "devSecretToken"

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