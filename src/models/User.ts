// src/models/User.ts

import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    preferences: {
        genres: string[];
        actors: string[];
    };
    history: {
        movieId: string;
        watchedAt: Date;
    }[];
    createdAt: Date;
    updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        preferences: {
            genres: { type: [String], default: [] },
            actors: { type: [String], default: [] },
        },
        history: [
            {
                movieId: { type: String, required: true },
                watchedAt: { type: Date, default: Date.now },
            }
        ],
    },
    { timestamps: true }
);

const User = model<IUser>('User', userSchema);
export default User;
