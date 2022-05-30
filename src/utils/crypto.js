import CryptoJS from 'crypto-js';

/**
 * Encrypt password
 * @param {string} pw
 * @returns {string} encrypted password
 */
export async function encryptPassword(pw) {
    try {
        // Encrypt pw
        return CryptoJS.AES.encrypt(pw, process.env.ENCRYPTER_KEY).toString();
    } catch (e) {
        console.log('🚀 ~ file: crypto.js ~ line 13 ~ encryptPassword ~ e', e);
    }

    return null;
}

/**
 * Decrypt password
 * @param {string} encryptedPw
 * @returns {string} decrypted password
 */
export async function decryptPassword(encryptedPw) {
    try {
        // Decrypt pw
        return CryptoJS.AES.decrypt(encryptedPw, process.env.ENCRYPTER_KEY).toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.log('🚀 ~ file: crypto.js ~ line 30 ~ decryptPassword ~ e', e);
    }

    return null;
}

/**
 * Compares plain and encryptedPw
 * @param {string} pw - plain password
 * @param {string} encryptedPw - encrypted password from db
 * @return {Boolean}
 */
export async function comparePasswords(pw, encryptedPw) {
    try {
        // Decrypt pw
        const decryptedPw = await decryptPassword(encryptedPw);
        return pw === decryptedPw;
    } catch (e) {
        console.log('🚀 ~ file: crypto.js ~ line 43 ~ comparePassword ~ e', e);
    }

    return false;
}

// import bcrypt from 'bcrypt';

// async function hashPassword(pw, saltRounds = 10) {
//     try {
//         // Generate a salt
//         const salt = await bcrypt.genSalt(saltRounds);

//         // Hash pw
//         return await bcrypt.hash(pw, salt);
//     } catch (e) {
//         console.log('🚀 ~ file: auth.service.js ~ line 156 ~ encryptPassword ~ e', e);
//     }

//     return null;
// }

// async function comparePassword(pw, hash) {
//     try {
//         // Compare pw
//         return await bcrypt.compare(pw, hash);
//     } catch (e) {
//         console.log('🚀 ~ file: auth.service.js ~ line 165 ~ comparePassword ~ e', e);
//     }

//     return false;
// }
