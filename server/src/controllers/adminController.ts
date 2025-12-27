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
