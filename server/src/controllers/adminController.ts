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

export const authenticateAdmin = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, passwordProvided: !!password });
    // Check against env variables or defaults
    // Check against env variables or defaults (TRIMVED)
    const validUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
    const validPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
    const providedUsername = (username || '').trim().toLowerCase();
    const providedPassword = (password || '').trim();

    const isUsernameMatch = providedUsername === validUsername.toLowerCase();

    const isPasswordMatch = providedPassword === validPassword;

    console.log('Comparison Details:', {
        usernameProvided: `[${providedUsername}]`,
        usernameValid: `[${validUsername}]`,
        usernameMatch: isUsernameMatch,
        passwordMatch: isPasswordMatch,
        usernameLen: providedUsername.length,
        validUsernameLen: validUsername.length,
        passwordLen: providedPassword.length,
        validPasswordLen: validPassword.length
    });

    if (isUsernameMatch && isPasswordMatch) {

        const token = jwt.sign(
            { role: 'admin', username: providedUsername },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' }
        );

        console.log('Authentication Successful, token generated');
        return res.json({ token, message: 'Admin authenticated' });
    }

    console.log('Authentication Failed');
    return res.status(401).json({ message: 'Invalid credentials' });

};
