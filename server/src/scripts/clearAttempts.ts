import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Group } from '../models/Group';
import { Student } from '../models/Student';

dotenv.config();

const clearAttempts = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quiz-event';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for clearing attempts...');

        // Clear all group states (attempts)
        const result = await Group.deleteMany({});
        console.log(`Successfully cleared ${result.deletedCount} group attempts.`);

        // Note: We don't delete students here, as per instructions "Use a NEW studentId" 
        // but the user might also want to reset students if they are testing locally.
        // For now, only clearing groups (attempts).

        process.exit(0);
    } catch (err) {
        console.error('Error clearing attempts:', err);
        process.exit(1);
    }
};

clearAttempts();
