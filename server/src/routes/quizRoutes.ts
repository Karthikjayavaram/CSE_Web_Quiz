import express from 'express';
import { getActiveQuiz, submitAnswers, getAllResults } from '../controllers/quizController';

const router = express.Router();

router.get('/active', getActiveQuiz);
router.post('/submit', submitAnswers);
router.get('/results', getAllResults);

export default router;
