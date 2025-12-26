import { useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../socket';
import axios from 'axios';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import './Quiz.css';

interface Question {
    id: number;
    text: string;
    options: string[];
}

interface QuizData {
    id: string;
    title: string;
    questions: Question[];
    settings: {
        timerPerQuestion: number;
        totalQuestions: number;
    };
}

const Quiz = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeLeft, setTimeLeft] = useState(45);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [violations, setViolations] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [quizSettings, setQuizSettings] = useState({ timerPerQuestion: 45, totalQuestions: 20 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const timerRef = useRef<any>(null);
    const violationDebounceRef = useRef<any>(null);

    // Connect socket on mount
    useEffect(() => {
        socket.connect();
        console.log('Socket connected:', socket.id);

        // Listen for admin unlock
        socket.on('quiz-unlocked', () => {
            console.log('Quiz unlocked by admin');
            setIsLocked(false);
        });

        return () => {
            socket.off('quiz-unlocked');
            socket.disconnect();
        };
    }, []);

    // Fetch questions on mount
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await axios.get('/api/quiz/active');
                const quizData: QuizData = response.data;
                setQuestions(quizData.questions);
                setQuizSettings(quizData.settings);
                setTimeLeft(quizData.settings.timerPerQuestion);
                setAnswers(new Array(quizData.questions.length).fill(-1));
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch quiz:', error);
                alert('Failed to load quiz. Please contact administrator.');
            }
        };
        fetchQuiz();
    }, []);

    // Fullscreen toggle
    const enterFullScreen = () => {
        const elem = document.documentElement as any;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    };

    const handleViolation = useCallback((type: string) => {
        // Don't track violations if quiz is finished or submitting
        if (isFinished || isSubmitting || isLocked) return;

        // Debounce to prevent multiple rapid-fire violations
        if (violationDebounceRef.current) {
            clearTimeout(violationDebounceRef.current);
        }

        violationDebounceRef.current = setTimeout(() => {
            setViolations((prev) => prev + 1);

            // Lock quiz immediately on ANY violation
            setIsLocked(true);

            // Notify Server
            const groupInfo = JSON.parse(localStorage.getItem('group_info') || '{}');
            const violationData = {
                type,
                groupId: groupInfo.id,
                studentNames: groupInfo.studentNames,
                timestamp: new Date()
            };

            console.log('Emitting violation:', violationData);
            socket.emit('violation', violationData);
        }, 500); // 500ms debounce to prevent duplicate events

    }, [isFinished, isSubmitting, isLocked]);

    // Anti-cheating listeners
    useEffect(() => {
        // Don't register listeners if quiz is finished
        if (isFinished || isSubmitting) return;

        const handleVisibilityChange = () => {
            if (document.hidden && !isFinished && !isSubmitting) {
                handleViolation('Tab Switch');
            }
        };

        const handleFullScreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullScreen(false);
                if (!isFinished && !isSubmitting) {
                    handleViolation('Exited Fullscreen');
                }
            } else {
                setIsFullScreen(true);
            }
        };

        const handleBlur = () => {
            if (!isFinished && !isSubmitting) {
                handleViolation('Window Minimized/Blurred');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        window.addEventListener('blur', handleBlur);

        // Disable copy-paste
        const preventAction = (e: any) => e.preventDefault();
        document.addEventListener('copy', preventAction);
        document.addEventListener('paste', preventAction);
        document.addEventListener('contextmenu', preventAction);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('copy', preventAction);
            document.removeEventListener('paste', preventAction);
            document.removeEventListener('contextmenu', preventAction);
        };
    }, [handleViolation, isFinished, isSubmitting]);

    // Timer logic
    useEffect(() => {
        if (isFullScreen && !isLocked && questions.length > 0 && !isFinished && !isSubmitting) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleNext(-1); // Auto-submit with no answer
                        return quizSettings.timerPerQuestion;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isFullScreen, isLocked, questions, currentQuestion, isFinished, isSubmitting]);

    const handleNext = async (selectedAnswer: number) => {
        if (isSubmitting) return; // Prevent double submission

        // Save answer
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = selectedAnswer;
        setAnswers(newAnswers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
            setTimeLeft(quizSettings.timerPerQuestion);
        } else {
            // Submit quiz
            setIsSubmitting(true);
            setIsFinished(true);

            try {
                const groupInfo = JSON.parse(localStorage.getItem('group_info') || '{}');
                console.log('Submitting quiz with groupId:', groupInfo.id);

                await axios.post('/api/quiz/submit', {
                    groupId: groupInfo.id,
                    answers: newAnswers
                });

                console.log('Quiz submitted successfully');
                setIsFinished(true);

            } catch (error) {
                console.error('Failed to submit quiz:', error);
                alert('Quiz submission failed. Please contact administrator.');
                setIsSubmitting(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="fullscreen-prompt">
                <div className="prompt-card glass">
                    <h1>Loading Quiz...</h1>
                </div>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="fullscreen-prompt">
                <div className="prompt-card glass success-card">
                    <CheckCircle size={64} color="#10b981" />
                    <h1>Quiz Submitted Successfully!</h1>
                    <p>Thank you for participating. Your results have been recorded.</p>
                    <p className="info-text">Results will be announced by the administrator.</p>
                    <button onClick={() => window.location.href = '/login'} className="return-btn">
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    if (isLocked) {
        return (
            <div className="locked-screen glass">
                <AlertTriangle size={64} color="#f87171" />
                <h1>Quiz Locked</h1>
                <p>A violation has been detected. Your quiz has been paused.</p>
                <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Please contact the administrator to resume.</p>
            </div>
        );
    }

    if (!isFullScreen) {
        return (
            <div className="fullscreen-prompt">
                <div className="prompt-card glass">
                    <h1>Full Screen Required</h1>
                    <p>Please enter full screen to continue the quiz.</p>
                    <button onClick={enterFullScreen}>Enter Full Screen</button>
                </div>
            </div>
        );
    }

    return (
        <div className="quiz-page">
            <div className="quiz-header">
                <div className="progress">Question {currentQuestion + 1} of {questions.length}</div>
                <div className="timer-box">
                    <Clock size={20} />
                    <span>{timeLeft}s</span>
                </div>
            </div>

            <div className="question-card glass">
                <div className="timer-bar" style={{ width: `${(timeLeft / quizSettings.timerPerQuestion) * 100}%` }}></div>
                <h2 style={{ whiteSpace: 'pre-wrap' }}>{questions[currentQuestion].text}</h2>

                <div className="options-grid">
                    {questions[currentQuestion].options.map((opt, idx) => (
                        <button key={idx} className="option-btn" onClick={() => handleNext(idx)} disabled={isSubmitting}>
                            <span className="opt-letter">{String.fromCharCode(65 + idx)}</span>
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            <div className="footer-info">
                <div className="violation-count">Violations: {violations}</div>
            </div>
        </div>
    );
};

export default Quiz;
