// src/controllers/historyController.ts

import { AuthenticatedRequest } from '../middleware/auth';
import { Response } from 'express';
import User from '../models/User';
import Movie from '../models/Movies'; // Corrected import path

// Log a watched movie
export const logWatchedMovie = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { movieId } = req.body;

    if (!movieId) {
        res.status(400).json({ message: 'movieId is required.' });
        return;
    }

    try {
        // Check if the movie exists in the database
        const movie = await Movie.findById(movieId);
        if (!movie) {
            res.status(404).json({ message: 'Movie not found.' });
            return;
        }

        // Check if the movie is already in the watch history
        const alreadyWatched = user.history.some(entry => entry.movieId === movieId);
        if (alreadyWatched) {
            res.status(400).json({ message: 'Movie already logged in watch history.' });
            return;
        }

        // Add to watch history
        user.history.push({ movieId, watchedAt: new Date() });
        await user.save();

        res.json({ message: 'Movie logged in watch history successfully.' });
    } catch (error: any) {
        console.error('Log Watched Movie Error:', error.message);
        res.status(500).json({ message: 'Server error while logging watched movie.' });
    }
};
