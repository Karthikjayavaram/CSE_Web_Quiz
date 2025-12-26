import { Request, Response } from 'express';
import { Group } from '../models/Group';
import { Server } from 'socket.io';

let io: Server;

export const setSocketIO = (socketIO: Server) => {
    io = socketIO;
};

export const unlockGroup = async (req: Request, res: Response) => {
    try {
        const { groupId } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (group.quizState) {
            group.quizState.isLocked = false;
        }

        await group.save();

        // Notify the specific group via Socket.io
        if (io) {
            io.emit('quiz-unlocked', { groupId });
            console.log('Unlock event emitted for group:', groupId);
        }

        res.status(200).json({ message: 'Group unlocked successfully' });
    } catch (error) {
        console.error('Unlock error:', error);
        res.status(500).json({ message: 'Error unlocking group' });
    }
};
