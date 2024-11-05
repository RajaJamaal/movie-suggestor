// src/controllers/suggestionController.ts

import { AuthenticatedRequest } from '../middleware/auth';
import { Response } from 'express';
import Movie from '../models/Movies'; // Corrected import path
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const hfApiKey: string = process.env.HF_API_KEY || '';

export const getSuggestions = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { genre, actor } = req.query;

    // Merge query parameters with user preferences
    const preferredGenres = genre ? [String(genre)] : user.preferences.genres;
    const preferredActors = actor ? [String(actor)] : user.preferences.actors;

    // List of watched movie IDs
    const watchedMovieIds = user.history.map(entry => entry.movieId);

    try {
        // Build MongoDB query
        const query: any = {};

        if (preferredGenres.length > 0) {
            query.genre = { $in: preferredGenres };
        }

        if (preferredActors.length > 0) {
            query.actors = { $in: preferredActors };
        }

        if (watchedMovieIds.length > 0) {
            query._id = { $nin: watchedMovieIds };
        }

        // Fetch movies from MongoDB
        const movies = await Movie.find(query)
            .select('title genre actors releaseYear')
            .limit(10)
            .exec();

        if (movies.length === 0) {
            res.json({ suggestions: [], message: 'No movies found matching your preferences.' });
            return;
        }

        // Generate natural language response using Hugging Face Inference API
        if (!hfApiKey) {
            res.json({ suggestions: movies, message: 'Hugging Face API key not configured.' });
            return;
        }

        const movieTitles = movies.map(movie => movie.title).join(', ');
        const prompt = `Based on your preferences, I suggest the following movies: ${movieTitles}.`;

        // Make API request to Hugging Face
        const hfResponse = await axios.post(
            'https://api-inference.huggingface.co/models/gpt-neo-2.7B',
            {
                inputs: prompt,
                parameters: {
                    max_new_tokens: 50,
                    temperature: 0.7,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${hfApiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        // Handle potential streaming responses or errors
        if (hfResponse.data.error) {
            console.error('Hugging Face API Error:', hfResponse.data.error);
            res.status(500).json({ message: 'Error generating response from language model.' });
            return;
        }

        const generatedText: string = Array.isArray(hfResponse.data)
            ? hfResponse.data[0].generated_text
            : hfResponse.data.generated_text || 'Here are some movie suggestions for you.';

        res.json({ suggestions: movies, message: generatedText });
    } catch (error: any) {
        console.error('Get Suggestions Error:', error.response?.data || error.message);
        res.status(500).json({ message: 'Error fetching movie suggestions.' });
    }
};
