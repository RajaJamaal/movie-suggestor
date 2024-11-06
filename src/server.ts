// src/server.ts

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import logger from './utils/logger';

import authRoutes from './routes/authRoutes';
import movieRoutes from './routes/movieRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const mongoURI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/langgraph_movie_suggestor';

// Middleware to parse JSON
app.use(express.json());

// Security Middleware
app.use(helmet());

// Rate Limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes.',
});
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/users', userRoutes);

// Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled Error:', { error: err });
    res.status(500).json({ message: 'An unexpected error occurred.' });
});

// Handle unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', { promise, reason });
    // Optional: Exit the process
    // process.exit(1);
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception thrown:', { error });
    // Optional: Exit the process
    // process.exit(1);
});

// Connect to MongoDB and start server
mongoose
    .connect(mongoURI, { ssl: false }) // Set to true if connecting to remote MongoDB with SSL
    .then(() => {
        logger.info('Connected to MongoDB.');
        app.listen(PORT, () => {
            logger.info(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        logger.error('MongoDB connection error:', { error: err });
        process.exit(1);
    });
