// src/routes/authRoutes.ts

import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', asyncHandler(register));

// @route   POST /api/auth/login
// @desc    Login a user
// @access  Public
router.post('/login', asyncHandler(login));

export default router;
