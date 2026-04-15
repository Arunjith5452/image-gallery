import dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes';
import imageRoutes from './routes/imageRoutes';
import { errorHandler } from './middleware/errorMiddleware';

const app = express();
const frontendUrl = process.env.FRONTEND_URL;

app.use(cors({
  origin: frontendUrl ? [frontendUrl, 'http://localhost:5173'] : ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/image-gallery';

console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
console.log(`Preparing to connect to MongoDB and bind port ${PORT}`);

mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 15000,
})
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });
