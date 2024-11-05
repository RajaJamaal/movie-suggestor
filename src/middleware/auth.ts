// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User, { IUser } from '../models/User';

dotenv.config();

interface AuthenticatedRequest extends Request {
    user?: IUser;
}

const jwtSecret: string = process.env.JWT_SECRET || 'your_jwt_secret';

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

export default authenticate;
export type { AuthenticatedRequest };
