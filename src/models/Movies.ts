// src/models/Movie.ts

import { Schema, model, Document } from 'mongoose';

export interface IMovie extends Document {
    _id: string; // Using TMDb's movie ID
    title: string;
    genre: string[];
    actors: string[];
    director: string;
    releaseYear: number;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

const movieSchema = new Schema<IMovie>(
    {
        _id: { type: String, required: true }, // TMDb's movie ID
        title: { type: String, required: true },
        genre: { type: [String], default: [] },
        actors: { type: [String], default: [] },
        director: { type: String, default: '' },
        releaseYear: { type: Number, default: 0 },
        description: { type: String, default: '' },
    },
    { timestamps: true }
);

const Movie = model<IMovie>('Movie', movieSchema);
export default Movie;

