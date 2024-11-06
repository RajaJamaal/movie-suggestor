// src/services/langGraphService.ts

import User from '../models/User';
import Movie, { IMovie } from '../models/Movie';
import dotenv from 'dotenv';
import axios from 'axios';
import logger from '../utils/logger';

dotenv.config();

const langGraphApiKey: string = process.env.LANGGRAPH_API_KEY || 'your_langgraph_api_key';
const langGraphEndpoint: string = 'https://api.langgraph.example.com/generate'; // Replace with actual LangGraph endpoint

interface SuggestionRequest {
    genres: string[];
    actors: string[];
    history: string[];
}

interface SuggestionResponse {
    suggestions: number[]; // Assuming response contains TMDB IDs
}

// Function to generate suggestions using LangGraph and LLM
const generateSuggestions = async (user: any): Promise<IMovie[]> => {
    const { preferences, history } = user;

    const requestData: SuggestionRequest = {
        genres: preferences.genres,
        actors: preferences.actors,
        history: history.map((entry: any) => entry.movieId),
    };

    try {
        const prompt = `Suggest 5 movies based on the following preferences:\nGenres: ${requestData.genres.join(
            ', '
        )}\nActors: ${requestData.actors.join(', ')}\nPreviously Watched Movie IDs: ${requestData.history.join(
            ', '
        )}\nProvide only TMDB movie IDs in your response.`;

        const response = await axios.post(
            langGraphEndpoint,
            { prompt },
            {
                headers: {
                    'Authorization': `Bearer ${langGraphApiKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const suggestedMovieIds: number[] = parseMovieIds(response.data.text);

        // Fetch movie details from MongoDB
        const suggestedMovies = await Movie.find({ tmdbId: { $in: suggestedMovieIds } });

        logger.info('Suggestions generated successfully', { userId: user._id, suggestions: suggestedMovieIds });

        return suggestedMovies;
    } catch (error: any) {
        logger.error('Error generating suggestions via LangGraph:', error.message, { userId: user._id });
        throw new Error('Failed to generate suggestions.');
    }
};

// Helper function to parse movie IDs from LLM response
const parseMovieIds = (text: string): number[] => {
    const regex = /\b\d{1,7}\b/g; // Assuming TMDB IDs are numeric
    const matches = text.match(regex);
    if (matches) {
        return matches.map(id => parseInt(id));
    }
    return [];
};

export default { generateSuggestions };
