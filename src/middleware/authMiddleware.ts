// src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User, { IUser } from '../models/User';
import logger from '../utils/logger';

dotenv.config();

interface AuthenticatedRequest extends Request {
    user?: IUser;
}

const jwtSecret: string = process.env.JWT_SECRET || 'your_jwt_secret_key';

export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        logger.warn('No token provided');
        return res.status(401).json({ message: 'No token provided.' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
        logger.warn('Invalid token format');
        return res.status(401).json({ message: 'Invalid token format.' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret) as { id: string };
        const user = await User.findById(decoded.id);
        if (!user) {
            logger.warn('User not found for token');
            return res.status(401).json({ message: 'User not found.' });
        }
        req.user = user;
        next();
    } catch (error) {
        logger.error('Invalid token', { error });
        return res.status(401).json({ message: 'Invalid token.' });
    }
};

export type { AuthenticatedRequest };
