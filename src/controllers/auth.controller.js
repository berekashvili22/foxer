import { findUser, loginUser, loginUserWithGoogle, registerUser } from '../services/auth.service.js';
import { messages } from '../utils/messages.js';

/**
 * Login user
 * @param {Object} req
 * @param {Object} res
 */
export async function loginController(req, res) {
    try {
        const { user, msg, code } = await loginUser(req.body);

        return res.status(code).json({ user, msg });
    } catch (e) {
        console.log('🚀 ~ file: auth.controller.js ~ line 15 ~ loginController ~ e', e);
        return res.status(500).json({ user: null, msg: messages.unexpected });
    }
}

/**
 * Register user
 * @param {Object} req
 * @param {Object} res
 */
export async function registerController(req, res) {
    try {
        const { user, msg, errors, code } = await registerUser(req.body);

        return res.status(code).json({ user, msg, errors });
    } catch (e) {
        console.log('🚀 ~ file: auth.controller.js ~ line 31 ~ registerController ~ e', e);
        return res.status(500).json({ msg: msg || messages.unexpected });
    }
}

/**
 * Login/Register user with google
 * @param {Object} req
 * @param {Object} res
 */
export async function googleAuth(req, res) {
    try {
        const { token, clientId } = req.body;
        if (token && clientId) {
            const { user, msg, code } = await loginUserWithGoogle(token, clientId);

            return res.status(code).json({ user, msg });
        }
    } catch (e) {
        console.log('🚀 ~ file: auth.controller.js ~ line 50 ~ googleAuth ~ e', e);
        return res.status(500).json({ msg: messages.unexpected });
    }

    return res.status(500).json({ msg: messages.unexpected });
}

/**
 * Check if email is available
 * @param {Object} req
 * @param {Object} res
 */
export async function checkIfEmailIsAvailable(req, res) {
    try {
        const { email } = req.body;
        if (email) {
            // Check if user exists with requested email
            const user = await findUser(email);
            if (user) {
                return res.status(200).json({ emailIsAvailable: false, msg: messages.email_already_used });
            }

            return res.status(200).json({ emailIsAvailable: true });
        } else {
            return res.status(400).json({ msg: messages.unexpected });
        }
    } catch (e) {
        console.log('🚀 ~ file: auth.controller.js ~ line 69 ~ checkEmail ~ e', e);
        return res.status(500).json({ msg: messages.unexpected });
    }
}

export async function me(req, res) {
    let user = await findUser(req.body.user.email);
    return res.status(200).json(user);
}
