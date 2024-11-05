// src/controllers/preferencesController.ts

import { AuthenticatedRequest } from '../middleware/auth';
import { Response } from 'express';
import User from '../models/User';

// Update user preferences
export const updatePreferences = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { genres, actors } = req.body;

    // Validate input
    if (!genres && !actors) {
        res.status(400).json({ message: 'At least one of genres or actors must be provided.' });
        return;
    }

    try {
        if (genres) {
            if (!Array.isArray(genres)) {
                res.status(400).json({ message: 'Genres must be an array of strings.' });
                return;
            }
            user.preferences.genres = genres;
        }

        if (actors) {
            if (!Array.isArray(actors)) {
                res.status(400).json({ message: 'Actors must be an array of strings.' });
                return;
            }
            user.preferences.actors = actors;
        }

        await user.save();
        res.json({ message: 'Preferences updated successfully.', preferences: user.preferences });
    } catch (error: any) {
        console.error('Update Preferences Error:', error.message);
        res.status(500).json({ message: 'Server error while updating preferences.' });
    }
};
