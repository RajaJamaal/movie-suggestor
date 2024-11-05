// src/controllers/authController.ts

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const jwtSecret: string = process.env.JWT_SECRET || 'your_jwt_secret';
const jwtExpiry: string = '1h'; // Token validity duration

// Register a new user
export const register = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
        res.status(400).json({ message: 'Username, email, and password are required.' });
        return;
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            res.status(400).json({ message: 'Username or email already in use.' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            preferences: {
                genres: [],
                actors: [],
            },
            history: [],
        });

        await user.save();

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (error: any) {
        console.error('Registration error:', error.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// Login a user
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required.' });
        return;
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials.' });
            return;
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials.' });
            return;
        }

        // Create JWT
        const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: jwtExpiry });

        res.json({ token });
    } catch (error: any) {
        console.error('Login error:', error.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
};
