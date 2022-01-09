import jwt from 'jsonwebtoken';

const isValidToken = (req, res, next) => {
    const authHeader = req.headers.token;
    if (authHeader) {
        jwt.verify(token, process.env.JWT_KEY, (err, user) => {
            if (err) {
                res.status(401).json('Token is not valid !');
            }
            req.user = user;
            next();
        });
    } else {
        return res.status(401).json('You are not authenticated !');
    }
};

export const isValidToken = isValidToken;
