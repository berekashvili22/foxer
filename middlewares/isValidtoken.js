import jwt from 'jsonwebtoken';

const isValidToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        // Remove bearer part
        const bearerToken = authHeader.split(' ');
        const token = bearerToken[1];

        jwt.verify(token, process.env.JWT_KEY, (err, user) => {
            if (err) {
                return res.status(401).json('Token is not valid !');
            }
            req.body.user = user;
            next();
        });
    } else {
        return res.status(401).json('You are not authenticated !');
    }
};

export default isValidToken;
