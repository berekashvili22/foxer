import express from 'express';
import { isValidToken } from '../middlewares/isValidtoken';

const router = express.Router();

// router.put('/:id', isValidToken, (req, res) => {
//     if (req.user.id === req.params.id) {
//     }
// });

export default router;
