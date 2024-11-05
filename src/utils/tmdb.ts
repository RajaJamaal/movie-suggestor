// src/utils/tmdb.ts

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TMDB_API_KEY: string = process.env.TMDB_API_KEY || '';
const TMDB_BASE_URL: string = 'https://api.themoviedb.org/3';

const tmdbClient = axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
    },
});

export interface TMDBMovie {
    id: string;
    title: string;
    genres: { id: number; name: string }[];
    release_date: string;
    overview: string;
    credits?: {
        cast: { name: string }[];
        crew: { job: string; name: string }[];
    };
}

export async function fetchPopularMovies(page: number = 1): Promise<TMDBMovie[]> {
    try {
        const response = await tmdbClient.get('/movie/popular', {
            params: { page },
        });
        return response.data.results;
    } catch (error) {
        console.error(`Error fetching popular movies (page ${page}):`, error);
        return [];
    }
}

export async function fetchMovieDetails(movieId: string): Promise<TMDBMovie | null> {
    try {
        const response = await tmdbClient.get(`/movie/${movieId}`, {
            params: { append_to_response: 'credits' },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}
