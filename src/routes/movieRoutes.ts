// src/routes/movieRoutes.ts

import { Router } from 'express';
import { fetchMovies, suggestMovies } from '../controllers/movieController';
import { authenticate } from '../middleware/authMiddleware';
import asyncHandler from 'express-async-handler';

const router = Router();

// @route   GET /api/movies/fetch
// @desc    Fetch and store popular movies from TMDB
// @access  Public
router.get('/fetch', asyncHandler(fetchMovies));

// @route   GET /api/movies/suggest
// @desc    Get movie suggestions for the authenticated user
// @access  Private
router.get('/suggest', authenticate, asyncHandler(suggestMovies));

export default router;
