import { User } from '../models/User.js';

import jwt from 'jsonwebtoken';

import { encryptPassword, comparePasswords } from '../utils/crypto.js';
import { OAuth2Client } from 'google-auth-library';

/**
 * Register user
 * @param {Object} userData - Register form data
 */
export async function registerUser(userData) {
    const { email, first_name, last_name, password } = userData;

    // Check if user with same email exists
    const user = await findUser(email);

    if (user) {
        return { msg: 'Email is already in use', newUser: null };
    }

    let encryptedPw;

    try {
        // Encrypt password
        encryptedPw = await encryptPassword(password);
    } catch (e) {
        console.log('Password encryption was unsuccessful');
        return { msg: 'Unexpected error occurred', newUser: null };
    }

    // Create new user
    const newUser = await createUser({
        email: email,
        first_name: first_name,
        last_name: last_name,
        password: encryptedPw
    });

    if (newUser) {
        return { msg: 'Successful register', newUser };
    }

    return { msg: 'Unexpected error occurred', newUser: null };
}

/**
 * Login user
 * @param {Object} userData - Login form data
 * @return {<Promise> string | null} - JWT Token
 */
export async function loginUser(userData) {
    const { email, password } = userData;

    try {
        // Get user
        const user = await findUser(email);
        if (user) {
            // Check if password is valid
            const passwordIsValid = comparePasswords(password, user.password);

            if (passwordIsValid) {
                // Gen jwt token
                const accessToken = jwt.sign(
                    {
                        email: user.email,
                        isAdmin: user.isAdmin
                    },
                    process.env.JWT_KEY,
                    { expiresIn: '3d' }
                );

                const { password, ...others } = user._doc;

                return { user: { ...others, accessToken }, msg: 'Login successful', success: true };
            } else {
                return { msg: 'Invalid Credentials', success: false };
            }
        } else {
            return { msg: 'Invalid Credentials', success: false };
        }
    } catch (e) {
        console.log('🚀 ~ file: auth.service.js ~ line 61 ~ loginUser ~ e', e);
        return { msg: 'Unexpected error occurred', success: undefined };
    }
}

export async function loginUserWithGoogle(token, clientId) {
    // Create google client
    const googleClient = new OAuth2Client({
        clientId: `${process.env.GOOGLE_CLIENT_ID}`,
        clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`
    });

    let payload;
    try {
        // Verify if token is valid
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audient: `${process.env.GOOGLE_CLIENT_ID}`
        });

        // Get user data from ticked payload
        payload = ticket.getPayload();
    } catch (e) {
        console.log('🚀 ~ file: auth.service.js ~ line 105 ~ loginUserWithGoogle ~ e', e);
        // todo specify why i returned null with status code or something
        return null;
    }

    // Check if user with requested email already exists
    let user = await findUser(payload?.email);

    // If user with requested email does not exists create new one
    if (!user) {
        const fullNameArr = payload.name.split(' ');

        let firstName = fullNameArr?.[0];
        let lastName = fullNameArr?.[1];
        let pw = await encryptPassword(clientId);

        user = await createUser({
            email: payload.email,
            first_name: firstName,
            last_name: lastName,
            password: pw,
            authType: 'google'
        });
        console.log('🚀 ~ file: auth.service.js ~ line 129 ~ loginUserWithGoogle ~ user', user);
    }

    // If we have user with requested email but authType is not google return null
    if (user && user.authType !== 'google') {
        // todo add message that user with same email already exists
        return null;
    }

    return await loginUser(user);
}

/**
 * Find user by email
 * @param {string} email
 */
export async function findUser(email) {
    let user;
    try {
        user = await User.findOne({ email });
    } catch (e) {
        console.log('🚀 ~ file: auth.service.js ~ line 83 ~ findUser ~ e', e);
    } finally {
        return user;
    }
}

/**
 * Creates new user
 * @param {Object} userData
 * @return {Object || null} Created user
 */
export async function createUser(userData) {
    // Create user model
    const newUser = new User(userData);

    try {
        // Create user
        const savedUser = await newUser.save();
        return savedUser;
    } catch (e) {
        console.log('🚀 ~ file: auth.service.js ~ line 97 ~ createUser ~ e', e);
    }

    return null;
}
