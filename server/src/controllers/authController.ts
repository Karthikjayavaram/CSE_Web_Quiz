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

        // STRICT CHECK: Ensure NONE of these students have participated in a finished quiz
        // regardless of who they are grouping with now.
        const existingFinishedGroup = await Group.findOne({
            students: { $in: studentIds },
            'quizState.isFinished': true
        });

        if (existingFinishedGroup) {
            return res.status(403).json({
                message: 'One or more members have already completed the quiz in another group. Login denied.'
            });
        }

        const groupIdStr = studentIds.join('_');

        let group = await Group.findOne({ groupId: groupIdStr });
        if (group) {
            // Check if group has already finished the quiz
            if (group.quizState && group.quizState.isFinished) {
                return res.status(403).json({
                    message: 'Quiz already submitted. You cannot login again.'
                });
            }
            // Verify other students in the group
        } else {
            group = await Group.create({
                groupId: groupIdStr,
                students: studentIds,
                violationCount: 0,
                violatedMultipleTimes: false
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
