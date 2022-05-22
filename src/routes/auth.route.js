import express from 'express';
import { googleAuth, loginController, registerController, me } from '../controllers/auth.controller.js';

import verifyToken from '../../middlewares/isValidtoken.js';

const router = express.Router();

router.post('/register', registerController);
router.post('/login', loginController);
router.post('/googleAuth', googleAuth);
router.post('/me', verifyToken, me);

export default router;
