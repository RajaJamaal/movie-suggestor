// src/controllers/userController.ts

import { Response } from 'express';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import asyncHandler from 'express-async-handler';
import logger from '../utils/logger';
import Movie from '../models/Movie';

// Update user preferences
export const updatePreferences = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { genres, actors } = req.body;

    if (!user) {
        logger.warn('Unauthorized access to updatePreferences');
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (!genres && !actors) {
        logger.warn('Invalid preferences update attempt', { userId: user._id });
        return res.status(400).json({ message: 'At least one of genres or actors must be provided.' });
    }

    try {
        if (genres) {
            if (!Array.isArray(genres)) {
                logger.warn('Invalid genres format', { userId: user._id });
                return res.status(400).json({ message: 'Genres must be an array of strings.' });
            }
            user.preferences.genres = genres;
        }

        if (actors) {
            if (!Array.isArray(actors)) {
                logger.warn('Invalid actors format', { userId: user._id });
                return res.status(400).json({ message: 'Actors must be an array of strings.' });
            }
            user.preferences.actors = actors;
        }

        await user.save();
        logger.info('User preferences updated', { userId: user._id, preferences: user.preferences });
        res.json({ message: 'Preferences updated successfully.', preferences: user.preferences });
    } catch (error: any) {
        logger.error('Error updating preferences:', error.message, { userId: user._id });
        res.status(500).json({ message: 'Failed to update preferences.' });
    }
});

// Log a watched movie
export const logWatchedMovie = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    const { movieId } = req.body;

    if (!user) {
        logger.warn('Unauthorized access to logWatchedMovie');
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (!movieId) {
        logger.warn('Invalid movieId provided', { userId: user._id });
        return res.status(400).json({ message: 'movieId is required.' });
    }

    try {
        // Check if movie exists
        const movie = await Movie.findOne({ tmdbId: movieId });
        if (!movie) {
            logger.warn('Attempt to log non-existent movie', { movieId, userId: user._id });
            return res.status(404).json({ message: 'Movie not found.' });
        }

        // Check if already in history
        const alreadyWatched = user.history.some(entry => entry.movieId === String(movieId));
        if (alreadyWatched) {
            logger.warn('Attempt to log already watched movie', { movieId, userId: user._id });
            return res.status(400).json({ message: 'Movie already in watch history.' });
        }

        // Add to history
        user.history.push({ movieId: String(movieId), watchedAt: new Date() });
        await user.save();

        logger.info('Movie added to watch history', { movieId, userId: user._id });
        res.json({ message: 'Movie added to watch history.' });
    } catch (error: any) {
        logger.error('Error logging watched movie:', error.message, { userId: user._id, movieId });
        res.status(500).json({ message: 'Failed to log watched movie.' });
    }
});
