import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }, // Index of the correct option
    points: { type: Number, default: 1 }
});

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    questions: [questionSchema],
    settings: {
        timerPerQuestion: { type: Number, default: 45 },
        totalQuestions: { type: Number, default: 15 },
        isFullScreenMandatory: { type: Boolean, default: true },
        isCopyPasteDisabled: { type: Boolean, default: true }
    },
    isActive: { type: Boolean, default: false }
});

export const Quiz = mongoose.model('Quiz', quizSchema);
