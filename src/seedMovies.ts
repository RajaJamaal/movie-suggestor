// src/seedMovies.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import Movie, { IMovie } from './models/Movies';
import fs from 'fs';
import path from 'path';

dotenv.config();

const mongoURI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/movieDB';
const tmdbApiKey: string = process.env.TMDB_API_KEY || '';

if (!tmdbApiKey) {
    console.error('TMDB_API_KEY is not defined in the environment variables.');
    process.exit(1);
}

const moviesToFetch = 500; // Number of movies to fetch
const moviesPerPage = 20; // TMDb's default

async function fetchMovies(page: number): Promise<any[]> {
    const url = `https://api.themoviedb.org/3/discover/movie`;
    try {
        const response = await axios.get(url, {
            params: {
                api_key: tmdbApiKey,
                language: 'en-US',
                sort_by: 'popularity.desc',
                include_adult: false,
                include_video: false,
                page: page,
            },
        });
        return response.data.results;
    } catch (error: any) {
        console.error(`Error fetching movies from TMDb (Page ${page}):`, error.message);
        return [];
    }
}

async function fetchMovieDetails(movieId: string): Promise<any> {
    const url = `https://api.themoviedb.org/3/movie/${movieId}`;
    try {
        const response = await axios.get(url, {
            params: {
                api_key: tmdbApiKey,
                language: 'en-US',
                append_to_response: 'credits', // To get cast and crew
            },
        });
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching details for movie ID ${movieId}:`, error.message);
        return null;
    }
}

async function seedMovies() {
    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB.');

        let movies: IMovie[] = [];
        let currentPage = 1;

        while (movies.length < moviesToFetch) {
            const fetchedMovies = await fetchMovies(currentPage);
            if (fetchedMovies.length === 0) break; // No more movies to fetch

            for (const movie of fetchedMovies) {
                if (movies.length >= moviesToFetch) break;

                const details = await fetchMovieDetails(movie.id);
                if (!details) continue;

                // Extract genres
                const genres = details.genres.map((g: any) => g.name);

                // Extract director
                const directors = details.credits.crew.filter((c: any) => c.job === 'Director').map((d: any) => d.name).join(', ');

                // Extract top 5 actors
                const actors = details.credits.cast.slice(0, 5).map((a: any) => a.name);

                // Extract release year
                const releaseYear = details.release_date ? parseInt(details.release_date.split('-')[0], 10) : 0;

                // Extract description
                const description = details.overview || 'No description available.';

                const movieEntry: IMovie = new Movie({
                    _id: details.id.toString(),
                    title: details.title,
                    genre: genres,
                    actors: actors,
                    director: directors,
                    releaseYear: releaseYear,
                    description: description,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                movies.push(movieEntry);
                console.log(`Fetched and processed movie: ${details.title}`);
            }

            currentPage++;
        }

        console.log(`Total movies fetched: ${movies.length}`);

        // Clear existing movies
        await Movie.deleteMany({});
        console.log('Cleared existing movies.');

        // Insert new movies
        await Movie.insertMany(movies);
        console.log('Inserted new movies into MongoDB.');

        // Optionally, write to movies.json
        const outputPath = path.join(__dirname, 'data', 'movies.json');
        fs.writeFileSync(outputPath, JSON.stringify(movies, null, 2), 'utf-8');
        console.log(`movies.json has been created with ${movies.length} entries.`);

        process.exit(0);
    } catch (error: any) {
        console.error('Error seeding movies:', error.message);
        process.exit(1);
    }
}

seedMovies();
