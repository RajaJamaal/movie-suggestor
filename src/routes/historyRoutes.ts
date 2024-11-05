// src/routes/historyRoutes.ts

import { Router } from 'express';
import { logWatchedMovie } from '../controllers/historyController';
import authenticate from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// @route   POST /api/history
// @desc    Log a watched movie
// @access  Private
router.post('/',
    //  authenticate,
      asyncHandler(logWatchedMovie));

export default router;
