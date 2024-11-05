// src/fetchMovies.ts

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Movie, { IMovie } from './models/Movies';
import { fetchPopularMovies, fetchMovieDetails, TMDBMovie } from './utils/tmdb';

dotenv.config();

const mongoURI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/movieDB';
const MOVIES_TO_FETCH: number = 500; // Total number of movies to fetch

// Connect to MongoDB
mongoose
    .connect(mongoURI)
    .then(() => {
        console.log('Connected to MongoDB for seeding.');
        seedData();
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

async function seedData() {
    try {
        // Clear existing movie data
        await Movie.deleteMany({});
        console.log('Cleared existing movie data.');

        let moviesFetched = 0;
        let currentPage = 1;

        while (moviesFetched < MOVIES_TO_FETCH) {
            const popularMovies = await fetchPopularMovies(currentPage);
            if (popularMovies.length === 0) break; // No more movies to fetch

            for (const movie of popularMovies) {
                if (moviesFetched >= MOVIES_TO_FETCH) break;

                const detailedMovie = await fetchMovieDetails(movie.id.toString());
                if (!detailedMovie) continue;

                const genres = detailedMovie.genres.map((genre) => genre.name);
                const releaseYear = detailedMovie.release_date
                    ? parseInt(detailedMovie.release_date.split('-')[0], 10)
                    : 0;
                const description = detailedMovie.overview || 'No description available.';

                // Extract director
                const director = detailedMovie.credits?.crew.find((crewMember) => crewMember.job === 'Director')?.name || 'Unknown';

                // Extract top 5 actors
                const actors = detailedMovie.credits?.cast.slice(0, 5).map((castMember) => castMember.name) || [];

                const movieDocument: IMovie = new Movie({
                    _id: detailedMovie.id.toString(), // Using TMDb movie ID as _id
                    title: detailedMovie.title,
                    genre: genres,
                    actors: actors,
                    director: director,
                    releaseYear: releaseYear,
                    description: description,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                await movieDocument.save();
                console.log(`Saved movie: ${detailedMovie.title} (${detailedMovie.id})`);

                moviesFetched++;
            }

            currentPage++;
        }

        console.log(`Successfully seeded ${moviesFetched} movies.`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}
