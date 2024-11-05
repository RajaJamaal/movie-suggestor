// src/server.ts

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { IUser } from './models/User';
import Movie, { IMovie } from './models/Movies';
import axios from 'axios';
import authRoutes from './routes/authRoutes';
import historyRoutes from './routes/historyRoutes';
import preferencesRoutes from './routes/preferencesRoutes';
import suggestionRoutes from './routes/suggestionRoutes';
import { asyncHandler } from './utils/asyncHandler';


dotenv.config();

const app = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const mongoURI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/movieDB';
const jwtSecret: string = process.env.JWT_SECRET || 'your_jwt_secret';
const hfApiKey: string = process.env.HF_API_KEY || 'your_huggingface_api_key'; // Replace with your Hugging Face API Key

// Middleware to parse JSON
app.use(express.json());

// --- Authentication Middleware ---
interface AuthenticatedRequest extends Request {
    user?: IUser;
}

const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'No token provided.' });

    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Invalid token format.' });

    try {
        const decoded = jwt.verify(token, jwtSecret) as { id: string };
        const user = await User.findById(decoded.id);
        if (!user) throw new Error('User not found.');
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// --- Start Server ---
mongoose
    .connect(mongoURI)
    .then(() => {
        console.log('Connected to MongoDB.');
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// --- Routes ---

app.use('/api/auth', authRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/suggest', suggestionRoutes);

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// --- Error Handling Middleware ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ message: 'An unexpected error occurred.' });
});

