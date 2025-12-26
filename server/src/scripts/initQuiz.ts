import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Quiz } from '../models/Quiz';
import { questionSets } from '../data/questions';

dotenv.config();

const initQuiz = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quiz-event';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for quiz initialization...');

        // Clear existing quizzes
        await Quiz.deleteMany({});

        // Seed Set A as the main quiz
        const quiz = await Quiz.create({
            title: 'Departmental Technical Quiz 2024',
            questions: questionSets.A.map(q => ({
                text: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                points: 1
            })),
            settings: {
                timerPerQuestion: 45,
                totalQuestions: 20,
                isFullScreenMandatory: true,
                isCopyPasteDisabled: true
            },
            isActive: true
        });

        console.log('Quiz initialized successfully with 20 questions!');
        process.exit(0);
    } catch (err) {
        console.error('Error initializing quiz:', err);
        process.exit(1);
    }
};

initQuiz();
