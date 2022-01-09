import express from 'express';
import { User } from '../models/User.js';

import jwt from 'jsonwebtoken';
import CryptoJS from 'crypto-js';

const router = express.Router();

/**
 * Register
 */
router.post('/register', async (req, res) => {
    let password;
    try {
        // Encrypt password
        password = CryptoJS.AES.encrypt(req.body.password, process.env.ENCRYPTER_KEY).toString();
    } catch (e) {
        res.status(500).json(e);
    }

    const newUser = new User({
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        password: password
    });

    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (e) {
        res.status(500).json(e);
    }
});

/**
 * Login
 */
router.post('/login', async (req, res) => {
    try {
        // Get user
        const user = await User.findOne({ email: req.body.email });
        if (!!user) {
            // Decrypt password
            const pw = CryptoJS.AES.decrypt(user.password, process.env.ENCRYPTER_KEY).toString(CryptoJS.enc.Utf8);

            if (pw === req.body.password) {
                const accessToken = jwt.sign(
                    {
                        id: user._id,
                        isAdmin: user.isAdmin
                    },
                    process.env.JWT_KEY,
                    { expiresIn: '3d' }
                );

                const { password, ...others } = user._doc;
                res.status(200).json({ ...others, accessToken });
            } else {
                res.status(401).json('Invalid Credentials');
            }
        } else {
            res.status(401).json('Invalid Credentials');
        }
    } catch (e) {
        res.status(500).json(e);
    }
});

export default router;
