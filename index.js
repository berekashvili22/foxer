import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// import bodyParser from 'body-parser';
import cors from 'cors';

// import productsRoutes from './routes/products.js';
import authRoutes from './src/routes/auth.route.js';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());

try {
    await mongoose.connect(`${process.env.DB_PATH}/${process.env.DB_NAME}`);
    console.log('mongodb connected...');
} catch (e) {
    console.log(e);
}

app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/products', productsRoutes);

app.listen(PORT, () => console.log(`Server running on port: htpp://localhost:${PORT}`));
