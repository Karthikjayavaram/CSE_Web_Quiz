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

/* =======================
   ALLOWED ORIGINS
======================= */
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://cse-web-quiz.vercel.app'
];

/* =======================
   CORS (HTTP)
======================= */
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        if (
            allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app')
        ) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

/* =======================
   ROUTES
======================= */
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);

app.get('/health', (req, res) => {
    res.send('API is healthy');
});

/* =======================
   DATABASE
======================= */
const MONGODB_URI =
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quiz-event';

mongoose
    .connect(MONGODB_URI, { dbName: 'QuizDB' })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB error:', err));

/* =======================
   SOCKET.IO
======================= */
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('🟢 Socket connected:', socket.id);

    socket.on('violation', async (data) => {
        try {
            const group = await Group.findById(data.groupId);
            if (group) {
                group.violationCount = (group.violationCount || 0) + 1;
                group.violationLogs.push({
                    type: data.type,
                    timestamp: new Date(data.timestamp)
                });

                if (group.violationCount > 2) {
                    group.violatedMultipleTimes = true;
                }

                await group.save();
            }

            io.emit('admin-violation-alert', data);
        } catch (err) {
            console.error('Violation error:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔴 Socket disconnected');
    });
});

setSocketIO(io);

/* =======================
   SERVER
======================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
