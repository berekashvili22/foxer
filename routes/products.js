import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('hello');
});

router.post('/create', (req, res) => {
    console.log(req.body);
    res.send('done');
});

export default router;
