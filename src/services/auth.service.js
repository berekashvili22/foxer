import { User } from '../models/User.js';

import jwt from 'jsonwebtoken';

import { encryptPassword, comparePasswords } from '../utils/crypto.js';
import { OAuth2Client } from 'google-auth-library';

import { messages } from '../utils/messages.js';
import { isEmail } from '../utils/helpers.js';

/**
 * Register user
 * @param {Object} formValues - Register form values
 */
export async function registerUser(formValues) {
    // Validate form values
    const { isValid, errors } = await validateRegisterForm(formValues);

    // If validation fails
    if (!isValid) {
        console.log('register form was invalid');
        return { user: null, msg: messages.invalidFormValues, errors: errors, code: 400 };
    }

    // Encrypt password
    const encryptedPw = await encryptPassword(formValues.password);

    // If encryption fails
    if (!encryptedPw) {
        console.log('register encryption failed');
        return { user: null, msg: messages.unexpected, errors: errors, code: 500 };
    }

    // Create new user
    let user = await createUser({ ...formValues, password: encryptedPw });

    // If user created successfully
    if (user) {
        // Login user
        const { user: userData, code } = await loginUser({ email: user.email, password: formValues.password });

        // If login was successful return user credentials including jwt token
        if (code === 200 && userData) {
            return {
                user: userData,
                msg: messages.registerSuccess,
                errors: errors,
                code: 200
            };
        } else {
            // ! temp
            console.log('login failed after register');
        }
    }

    // If user creation or login failed
    return { user: null, msg: messages.unexpected, errors: errors, code: 500 };
}

/**
 * Login user
 * @param {Object} formValues - Login form data
 */
export async function loginUser(formValues) {
    // Find user with email
    const user = await findUser(formValues.email);

    // If user exists
    if (user) {
        // Check if password is valid
        const passwordIsValid = await comparePasswords(formValues.password, user.password);

        // If password is NOT valid
        if (!passwordIsValid) {
            return { user: null, msg: messages.invalidCredentials, code: 401 };
        }

        // If password is valid create jwt token
        const jwtToken = jwt.sign(
            {
                email: user.email,
                isAdmin: user.isAdmin
            },
            process.env.JWT_KEY,
            { expiresIn: '3d' }
        );

        // If jwt token was NOT created
        if (!jwtToken) {
            return { user: null, msg: messages.unexpected, code: 500 };
        }

        // If jwt token was created successfully

        // Get user data expect password
        const { password, ...others } = user._doc;

        // Return user with token
        return { user: { accessToken: jwtToken, ...others }, msg: messages.loginSuccess, code: 200 };
    }

    // If user does not exists
    return { user: null, msg: messages.invalidCredentials, code: 401 };
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
        console.log('🚀 ~ file: auth.service.js ~ line 114 ~ loginUserWithGoogle ~ e', e);
        return { user: null, msg: messages.unexpected, code: 500 };
    }

    // Check if user with requested email already exists
    let user = await findUser(payload?.email);

    let msg;

    // If user with requested email does NOT exists
    if (!user) {
        // Get user first name from payload data
        const firstName = payload.name.split(' ')?.[0];

        // Get user last name from payload data
        const lastName = payload.name.split(' ')?.[1];

        // Encrypt user password (using clientId as password since user can not enter password when using social authentication)
        const encryptedPassword = await encryptPassword(clientId);

        // Create new user
        user = await createUser({
            email: payload.email,
            firstName: firstName,
            lastName: lastName,
            password: encryptedPassword,
            authType: 'google',
            agreedOnTerms: true
        });

        // Login user
        const { user: userData, code } = await loginUser(user);

        // If login was successful
        if (code === 200 && userData) {
            return { user, msg: messages.registerSuccess, code: 200 };
        }

        // If login was NOT successful
        return { user: null, msg: messages.unexpected, code: 500 };
    }

    // If we have user with requested email but authType is NOT google (that means that account is created via local auth and we can not let them login with social)
    if (user.authType !== 'google') {
        return { user: null, msg: messages.emailAlreadyUsed, code: 400 };
    }

    // If we have user with requested email and authType is google
    if (user.authType === 'google') {
        const { user: userData, code } = await loginUser(user);

        if (userData && code === 200) {
            return { user, msg: messages.registerSuccess, code: 200 };
        }
    }

    return { user: null, msg: messages.unexpected, code: 500 };
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

/**
 * Validate register form values
 * @param {Object} values - register form values
 * @returns {Object}
 */
async function validateRegisterForm(values) {
    const { email, firstName, lastName, password, password2, agreedOnTerms } = values;
    // Create empty object for errors
    const validationErrors = {};

    // If email field is empty
    if (!email.length) validationErrors.email = messages.emptyField;
    // If email is not in valid format
    else if (!isEmail(email)) validationErrors.email = messages.invalidEmail;
    // If email is already used
    const userWithRequestedEmail = await findUser(email);
    if (userWithRequestedEmail) validationErrors.email = messages.emailAlreadyUsed;

    // If first name is empty
    if (!firstName.length) validationErrors.firstName = messages.emptyField;

    // If last name is empty
    if (!lastName.length) validationErrors.lastName = messages.emptyField;

    // If password is empty
    if (!password.length) validationErrors.password = messages.emptyField;
    // If password length is less than 6
    else if (password.length < 6) validationErrors.password = messages.passwordLength;

    // If password2 is empty
    if (!password2.length) validationErrors.password2 = messages.emptyField;
    // If password2 does not match password
    else if (password2 !== password) validationErrors.password2 = messages.passwordDoesNotMatch;

    // If agreed on terms is not checked
    if (!agreedOnTerms) validationErrors.agreedOnTerms = messages.termsNotAgreed;

    return { errors: validationErrors, isValid: Object.keys(validationErrors).length === 0 };
}
