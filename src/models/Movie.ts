// src/models/Movie.ts

import { Schema, model, Document } from 'mongoose';

export interface IMovie extends Document {
    tmdbId: number; // TMDB's movie ID
    title: string;
    genres: string[];
    actors: string[];
    director: string;
    releaseYear: number;
    description: string;
    createdAt: Date;
    updatedAt?: Date;
}

const movieSchema = new Schema<IMovie>(
    {
        tmdbId: { type: Number, required: true, unique: true },
        title: { type: String, required: true },
        genres: { type: [String], default: [] },
        actors: { type: [String], default: [] },
        director: { type: String, default: '' },
        releaseYear: { type: Number, default: 0 },
        description: { type: String, default: '' },
    },
    { timestamps: true }
);

const Movie = model<IMovie>('Movie', movieSchema);
export default Movie;
