// src/routes/suggestionRoutes.ts

import { Router } from 'express';
import { getSuggestions } from '../controllers/suggestionController';
import authenticate from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// @route   GET /api/suggest
// @desc    Get movie suggestions
// @access  Private
router.get('/',
    //  authenticate,
      asyncHandler(getSuggestions));

export default router;
