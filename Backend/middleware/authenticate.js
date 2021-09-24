const jwt = require('jsonwebtoken');
const config = require('config');

const secret = config.get('jwt_secret_key');

// Authenticating with token
module.exports = async (req, res, next) => {
    const token = req.header('x-authenticate-token');
    if (!token) return res.status(401).send(JSON.stringify({errorMessage: 'Access denied: no token provided.'}));

    try {
        console.log(token);
        const decodedToken = await jwt.verify(token, secret);
        console.log(decodedToken);
        req.account = decodedToken;
        next();
    } catch (error) {
        return res.status(400).send(JSON.stringify({errorMessage: 'Invalid token.'}));
    }
}