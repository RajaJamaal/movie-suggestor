// src/controllers/authController.ts

import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const jwtSecret: string = process.env.JWT_SECRET || 'your_jwt_secret_key';
const jwtExpiry: string = '1h'; // Token validity duration

// Register a new user
export const register = async (req: Request, res: Response) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Registration validation failed', { errors: errors.array() });
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        logger.warn('Attempt to register with existing username or email', { email, username });
        return res.status(400).json({ message: 'Username or email already in use.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
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

    logger.info('New user registered', { userId: user._id, email: user.email });

    res.status(201).json({ message: 'User registered successfully.' });
};

// Login a user
export const login = async (req: Request, res: Response) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        logger.warn('Login validation failed', { errors: errors.array() });
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
        logger.warn('Login attempt with invalid email', { email });
        return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        logger.warn('Login attempt with incorrect password', { email });
        return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Create JWT
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: jwtExpiry });

    logger.info('User logged in', { userId: user._id, email: user.email });

    res.json({ token });
};
