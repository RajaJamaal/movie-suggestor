// src/routes/userRoutes.ts

import { Router } from 'express';
import { updatePreferences, logWatchedMovie } from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';
import { body } from 'express-validator';
import asyncHandler from 'express-async-handler';

const router = Router();

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put(
  '/preferences',
  authenticate,
  [
    body('genres').optional().isArray().withMessage('Genres must be an array of strings.'),
    body('actors').optional().isArray().withMessage('Actors must be an array of strings.'),
  ],
  asyncHandler(updatePreferences)
);

// @route   POST /api/users/history
// @desc    Log a watched movie
// @access  Private
router.post(
  '/history',
  authenticate,
  [
    body('movieId').isNumeric().withMessage('movieId must be a number.'),
  ],
  asyncHandler(logWatchedMovie)
);

export default router;
