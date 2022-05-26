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
    console.log('🚀 ~ file: auth.service.js ~ line 18 ~ registerUser ~ isValid, errors', isValid, errors);

    // If form data is not valid
    if (!isValid) {
        return { msg: messages.invalidFormValues, errors: errors };
    }

    let encryptedPw;

    try {
        // Encrypt password
        encryptedPw = await encryptPassword(formValues.password);
        // Replace raw password with encrypted one
        formValues.password = encryptedPw;
    } catch (e) {
        console.log('Password encryption was unsuccessful');
        return { msg: messages.unexpected };
    }

    // Create new user
    const user = await createUser(formValues);

    // If user created successfully
    if (user) {
        return { msg: messages.registerSuccess, user };
    } else {
        return { msg: messages.unexpected };
    }
}

/**
 * Login user
 * @param {Object} formValues - Login form data
 * @return {<Promise> string | null} - JWT Token
 */
export async function loginUser(formValues) {
    const { email, password } = formValues;

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

                return { user: { ...others, accessToken }, msg: messages.loginSuccess, success: true };
            } else {
                return { msg: messages.invalidCredentials, success: false };
            }
        } else {
            return { msg: messages.invalidCredentials, success: false };
        }
    } catch (e) {
        console.log('🚀 ~ file: auth.service.js ~ line 61 ~ loginUser ~ e', e);
        return { msg: messages.unexpected, success: undefined };
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
            firstName: firstName,
            lastName: lastName,
            password: pw,
            authType: 'google',
            agreedOnTerms: true
        });
    }

    // If we have user with requested email but authType is not google return null
    if (user && user.authType !== 'google') {
        // todo add message that user with same email already exists
        return { msg: messages.emailAlreadyUsed };
    }

    user = await loginUser(user);

    return { user, msg: messages.registerSuccess };
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
