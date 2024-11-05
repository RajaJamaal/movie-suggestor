// src/routes/preferencesRoutes.ts

import { Router } from 'express';
import { updatePreferences } from '../controllers/preferencesController';
import authenticate from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// @route   PUT /api/preferences
// @desc    Update user preferences
// @access  Private
router.put('/',
    //  authenticate,
      asyncHandler(updatePreferences));

export default router;
