// src/routes/authRoutes.ts

import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { body } from 'express-validator';
import asyncHandler from 'express-async-handler';

const router = Router();

// Register Route
router.post(
    '/register',
    [
        body('username').isString().notEmpty().withMessage('Username is required.'),
        body('email').isEmail().withMessage('Valid email is required.'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
    ],
    asyncHandler(register)
);

// Login Route
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required.'),
        body('password').isString().notEmpty().withMessage('Password is required.'),
    ],
    asyncHandler(login)
);

export default router;

