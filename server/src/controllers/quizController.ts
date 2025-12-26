import { Request, Response } from 'express';
import { Quiz } from '../models/Quiz';
import { Group } from '../models/Group';

export const getActiveQuiz = async (req: Request, res: Response) => {
    try {
        const quiz = await Quiz.findOne({ isActive: true });

        if (!quiz) {
            return res.status(404).json({ message: 'No active quiz found' });
        }

        // Return quiz without correct answers to prevent cheating
        const safeQuiz = {
            id: quiz._id,
            title: quiz.title,
            questions: quiz.questions.map((q, index) => ({
                id: index,
                text: q.text,
                options: q.options
            })),
            settings: quiz.settings
        };

        res.status(200).json(safeQuiz);
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({ message: 'Error fetching quiz' });
    }
};

export const submitAnswers = async (req: Request, res: Response) => {
    try {
        const { groupId, answers } = req.body;

        console.log('Received submission for groupId:', groupId);

        const quiz = await Quiz.findOne({ isActive: true });
        if (!quiz) {
            return res.status(404).json({ message: 'No active quiz found' });
        }

        // Calculate score
        let score = 0;
        const totalQuestions = quiz.questions.length;

        answers.forEach((answer: number, index: number) => {
            if (quiz.questions[index] && quiz.questions[index].correctAnswer === answer) {
                score += quiz.questions[index].points || 1;
            }
        });

        console.log('Calculated score:', score);

        // Update group with results
        const group = await Group.findById(groupId).populate('students');
        console.log('Found group:', group ? 'Yes' : 'No');

        if (group) {
            if (!group.quizState) {
                // Initialize quizState if it doesn't exist
                group.quizState = {
                    currentQuestionIndex: totalQuestions,
                    isLocked: false,
                    isFinished: true,
                    score: score
                };
            } else {
                group.quizState.score = score;
                group.quizState.isFinished = true;
                group.quizState.currentQuestionIndex = totalQuestions;
            }

            await group.save();
            console.log('Group saved successfully with score:', score);
        } else {
            console.error('Group not found with ID:', groupId);
        }

        // Don't send score back to prevent students from seeing it
        res.status(200).json({
            message: 'Quiz submitted successfully',
            submitted: true
        });
    } catch (error) {
        console.error('Error submitting answers:', error);
        res.status(500).json({ message: 'Error submitting answers' });
    }
};

export const getAllResults = async (req: Request, res: Response) => {
    try {
        console.log('Fetching all results...');

        const groups = await Group.find({ 'quizState.isFinished': true })
            .populate('students', 'name studentId')
            .sort({ 'quizState.score': -1 });

        console.log('Found groups:', groups.length);

        const results = groups.map(group => {
            const students = Array.isArray(group.students)
                ? group.students.map((s: any) => ({
                    name: s.name || 'Unknown',
                    id: s.studentId || 'N/A'
                }))
                : [];

            return {
                groupId: group._id,
                groupIdentifier: group.groupId,
                students: students,
                score: group.quizState?.score || 0,
                totalQuestions: 20,
                finishedAt: group.quizState?.startTime || new Date()
            };
        });

        console.log('Processed results:', results);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching results:', error);
        res.status(500).json({ message: 'Error fetching results' });
    }
};
