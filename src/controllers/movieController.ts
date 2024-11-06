// src/controllers/movieController.ts

import { Request, Response } from 'express';
import axios from 'axios';
import Movie, { IMovie } from '../models/Movie';
import dotenv from 'dotenv';
import asyncHandler  from 'express-async-handler';
import logger from '../utils/logger';
import langGraphService from '../services/langGraphService';

dotenv.config();

const tmdbApiKey: string = process.env.TMDB_API_KEY || 'your_tmdb_api_key';

// Fetch and store movies from TMDB
export const fetchMovies = asyncHandler(async (req: Request, res: Response) => {
    try {
        const response = await axios.get(
            `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`
        );

        const movies = response.data.results;

        // Iterate and store in MongoDB
        for (const movie of movies) {
            const existingMovie = await Movie.findOne({ tmdbId: movie.id });
            if (!existingMovie) {
                const genreNames = await getGenreNames(movie.genre_ids);
                const actors = await getActors(movie.id);
                const director = await getDirector(movie.id);

                const newMovie = new Movie({
                    tmdbId: movie.id,
                    title: movie.title,
                    genres: genreNames,
                    actors: actors,
                    director: director,
                    releaseYear: parseInt(movie.release_date.split('-')[0]),
                    description: movie.overview,
                });

                await newMovie.save();
            }
        }

        logger.info('Movies fetched and stored successfully');
        res.json({ message: 'Movies fetched and stored successfully.' });
    } catch (error: any) {
        logger.error('Error fetching movies:', error.message);
        res.status(500).json({ message: 'Failed to fetch movies.' });
    }
});

// Helper functions to get genres, actors, and director
const getGenreNames = async (genreIds: number[]): Promise<string[]> => {
    try {
        const response = await axios.get(
            `https://api.themoviedb.org/3/genre/movie/list?api_key=${tmdbApiKey}&language=en-US`
        );

        const genres = response.data.genres;
        return genres
            .filter((genre: any) => genreIds.includes(genre.id))
            .map((genre: any) => genre.name);
    } catch (error: any) {
        logger.error('Error fetching genres:', error.message);
        return [];
    }
};

const getActors = async (movieId: number): Promise<string[]> => {
    try {
        const response = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${tmdbApiKey}&language=en-US`
        );

        const cast = response.data.cast.slice(0, 5); // Top 5 actors
        return cast.map((actor: any) => actor.name);
    } catch (error: any) {
        logger.error(`Error fetching actors for movie ID ${movieId}:`, error.message);
        return [];
    }
};

const getDirector = async (movieId: number): Promise<string> => {
    try {
        const response = await axios.get(
            `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${tmdbApiKey}&language=en-US`
        );

        const crew = response.data.crew;
        const director = crew.find((member: any) => member.job === 'Director');
        return director ? director.name : 'Unknown';
    } catch (error: any) {
        logger.error(`Error fetching director for movie ID ${movieId}:`, error.message);
        return 'Unknown';
    }
};

// Suggest movies based on user preferences and history
export const suggestMovies = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;

    if (!user) {
        logger.warn('Unauthorized access to suggestMovies');
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    try {
        const suggestions = await langGraphService.generateSuggestions(user);

        res.json({ suggestions });
    } catch (error: any) {
        logger.error('Error generating suggestions:', error.message);
        res.status(500).json({ message: 'Failed to generate suggestions.' });
    }
});
