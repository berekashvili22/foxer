import { findUser, loginUser, loginUserWithGoogle, registerUser } from '../services/auth.service.js';

/**
 * Register user
 * @param {Object} req
 * @param {Object} res
 */
export async function registerController(req, res) {
    let user;
    try {
        user = await registerUser(req.body);
    } catch (e) {
        console.log('🚀 ~ file: auth.controller.js ~ line 13 ~ registerController ~ e', e);
        return res.status(500).json({ msg: 'Unexpected error occurred' });
    }

    if (user) {
        return res.status(200).json(user);
    }
}

/**
 * Login user
 * @param {Object} req
 * @param {Object} res
 */
export async function loginController(req, res) {
    try {
        const { user, success, msg } = await loginUser(req.body);

        if (success === true) {
            return res.status(200).json({ user, msg });
        } else if (success === false) {
            return res.status(401).json({ user, msg });
        }
    } catch (e) {
        console.log('🚀 ~ file: auth.controller.js ~ line 37 ~ loginController ~ e', e);
    }

    return res.status(500).json({ msg: 'Unexpected error occurred' });
}

export async function googleAuth(req, res) {
    try {
        const { token, clientId } = req.body;
        if (token && clientId) {
            const userData = await loginUserWithGoogle(token, clientId);
            return res.status(200).json(userData);
        }
    } catch (e) {
        console.log('🚀 ~ file: auth.controller.js ~ line 48 ~ googleAuth ~ e', e);
    }

    return res.status(500).json({ msg: 'Unexpected error occurred' });
}

export async function me(req, res) {
    let user = await findUser(req.body.user.email);
    return res.status(200).json(user);
}
