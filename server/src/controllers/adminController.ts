import { Request, Response } from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import { Student } from '../models/Student';

const upload = multer({ dest: 'uploads/' });

export const uploadStudents = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        // CLEAR ALL EXISTING STUDENTS BEFORE INSERTING NEW DATA
        await Student.deleteMany({});
        console.log('Cleared all existing students');

        const studentsToInsert = [];

        for (const row of data as any[]) {
            // Expected columns: techziteId, name, email, phoneNumber
            if (!row.techziteId || !row.name || !row.email || !row.phoneNumber) {
                continue; // Skip invalid rows
            }

            studentsToInsert.push({
                techziteId: String(row.techziteId).toUpperCase(),
                name: row.name,
                email: row.email,
                phoneNumber: String(row.phoneNumber)
            });
        }

        if (studentsToInsert.length === 0) {
            return res.status(400).json({
                message: 'No valid student data found. Expected columns: techziteId, name, email, phoneNumber'
            });
        }

        // Insert with error handling for duplicates
        const insertedStudents = [];
        for (const student of studentsToInsert) {
            try {
                const newStudent = await Student.create(student);
                insertedStudents.push(newStudent);
            } catch (err: any) {
                if (err.code === 11000) {
                    console.log(`Skipping duplicate: ${student.techziteId}`);
                } else {
                    throw err;
                }
            }
        }

        res.status(200).json({
            message: `Successfully uploaded ${insertedStudents.length} students`,
            count: insertedStudents.length
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading students' });
    }
};

export const uploadMiddleware = upload.single('file');

import jwt from 'jsonwebtoken';
import { Group } from '../models/Group';

export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        // Hardcoded credentials as per instructions
        if (username === 'karthik' && password === 'karthik@123') {
            const token = jwt.sign(
                { username, role: 'admin' },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '24h' }
            );
            return res.json({ token, message: 'Login successful' });
        }

        res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllGroups = async (req: Request, res: Response) => {
    try {
        const groups = await Group.find()
            .populate('students', 'name techziteId')
            .sort({ 'quizState.score': -1 }); // Sort by score pending

        const formattedGroups = groups.map(group => ({
            id: group._id,
            groupIdentifier: group.groupId,
            students: group.students.map((s: any) => ({
                name: s.name,
                techziteId: s.techziteId
            })),
            isFinished: group.quizState?.isFinished || false,
            score: group.quizState?.score || 0,
            startTime: group.quizState?.startTime,
            violationCount: group.violationCount
        }));

        res.json(formattedGroups);
    } catch (error) {
        console.error('Get groups error:', error);
        res.status(500).json({ message: 'Error fetching groups' });
    }
};

export const deleteGroup = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Group.findByIdAndDelete(id);
        res.json({ message: 'Group deleted successfully' });
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ message: 'Error deleting group' });
    }
};

