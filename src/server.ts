// src/server.ts

import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User, { IUser } from './models/User';
import { MongoClient, ServerApiVersion } from 'mongodb';
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
const mongoURI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/movieDB?tls=false';
const jwtSecret: string = process.env.JWT_SECRET || 'your_jwt_secret';
const hfApiKey: string = process.env.HF_API_KEY || 'your_huggingface_api_key';

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
    console.error('Unhandled Error in server.ts:', err);
    res.status(500).json({ message: 'An unexpected error occurred.' });
});


// mongoose
//     .connect(mongoURI)
//     .then(() => {
//         console.log('Connected to MongoDB.');
//         app.listen(PORT, () => {
//             console.log(`Server is running on http://localhost:${PORT}`);
//         });
//     })
//     .catch((err) => {
//         console.error('MongoDB connection error:', err);
//         process.exit(1);
//     });

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(mongoURI,
    {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
        // tls: true, // Enforce TLS
        tlsInsecure: true,
    }
);


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
}
run().catch(console.dir);