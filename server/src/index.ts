import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';
import quizRoutes from './routes/quizRoutes';
import { setSocketIO } from './controllers/unlockController';
import { Group } from './models/Group';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://cse-web-quiz.vercel.app'
        ],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// CORS Configuration
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://cse-web-quiz.vercel.app'
];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);

app.get('/health', (req, res) => res.send('API is healthy'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quiz-event';
mongoose.connect(MONGODB_URI, { dbName: 'QuizDB' })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Socket.io
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('violation', async (data) => {
        console.log('>>> VIOLATION RECEIVED <<<');
        console.log('Type:', data.type);
        console.log('Group ID:', data.groupId);
        console.log('Students:', data.studentNames);
        console.log('Timestamp:', data.timestamp);

        try {
            // Update violation count in database
            const group = await Group.findById(data.groupId);
            if (group) {
                group.violationCount = (group.violationCount || 0) + 1;
                group.violationLogs.push({
                    type: data.type,
                    timestamp: new Date(data.timestamp)
                });

                // Flag if more than 2 violations
                if (group.violationCount > 2) {
                    group.violatedMultipleTimes = true;
                }

                await group.save();
                console.log(`Violation count updated: ${group.violationCount}`);
            }
        } catch (error) {
            console.error('Error updating violation count:', error);
        }

        // Broadcast to ALL connected clients (especially admins)
        io.emit('admin-violation-alert', data);
        console.log('Violation broadcasted to all clients');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Pass io instance to controllers that need it
setSocketIO(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
