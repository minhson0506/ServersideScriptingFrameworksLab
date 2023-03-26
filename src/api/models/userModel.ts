// TODO: mongoose schema for user
import mongoose from 'mongoose';
import {User} from '../../interfaces/User';

const userSchema = new mongoose.Schema<User>({
    user_name: {
        type: String,
        required: true,
        minlength: 2,
    },
    email: {
        type: String,
        unique: true,
        required: true,
        minlength: 2,
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'user'],
    },
    password: {
        type: String,
        required: true,
        minlength: 2,
    },
});

export default mongoose.model<User>('User', userSchema);