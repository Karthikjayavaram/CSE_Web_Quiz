import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Student } from '../models/Student';
import { Group } from '../models/Group';

export const groupLogin = async (req: Request, res: Response) => {
    try {
        const { credentials } = req.body; // Array of 3 { techziteId, phoneNumber }

        if (!Array.isArray(credentials) || credentials.length !== 3) {
            return res.status(400).json({ message: 'Three student credentials required' });
        }

        const students = [];
        for (const cred of credentials) {
            const student = await Student.findOne({
                techziteId: cred.techziteId.toUpperCase()
            });

            if (!student) {
                return res.status(401).json({ message: `TechZite ID ${cred.techziteId} not found` });
            }

            // Verify phone number
            if (student.phoneNumber !== cred.phoneNumber) {
                return res.status(401).json({ message: `Incorrect phone number for ${cred.techziteId}` });
            }

            students.push(student);
        }

        // Create or Find Group
        const studentIds = students.map(s => s._id).sort();
        const groupIdStr = studentIds.join('_');

        let group = await Group.findOne({ groupId: groupIdStr });
        if (!group) {
            group = await Group.create({
                groupId: groupIdStr,
                students: studentIds,
                violationCount: 0,
                violatedMultipleTimes: false,
                quizState: {
                    currentQuestionIndex: 0,
                    isLocked: false,
                    isFinished: false,
                    score: 0
                }
            });
        }

        // Check if group has already finished the quiz
        if (group.quizState && group.quizState.isFinished) {
            return res.status(403).json({
                message: 'Your group has already completed the quiz. You cannot login again unless authorized by an admin.'
            });
        }

        const token = jwt.sign(
            { groupId: group._id, groupIdentifier: group.groupId },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            group: {
                id: group._id,
                groupIdentifier: group.groupId,
                studentNames: students.map(s => s.name)
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
