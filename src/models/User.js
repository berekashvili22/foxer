import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        password: { type: String, required: true },
        isAdmin: { type: Boolean, default: false },
        authType: { type: String, default: 'local' },
        agreedOnTerms: { type: Boolean, required: true }
    },
    { timestamps: true }
);

export const User = mongoose.model('user', userSchema);
