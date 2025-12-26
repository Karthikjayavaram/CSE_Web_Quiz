import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Student } from './models/Student';

dotenv.config();

const seedStudents = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quiz-event';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing students
        await Student.deleteMany({});

        // Create 12 students (4 groups of 3) with new schema
        const students = [
            // Group 1
            { techziteId: 'TZ2024001', name: 'Alice Smith', email: 'alice@techzite.com', phoneNumber: '9876543210' },
            { techziteId: 'TZ2024002', name: 'Bob Johnson', email: 'bob@techzite.com', phoneNumber: '9876543211' },
            { techziteId: 'TZ2024003', name: 'Charlie Brown', email: 'charlie@techzite.com', phoneNumber: '9876543212' },

            // Group 2
            { techziteId: 'TZ2024004', name: 'Diana Prince', email: 'diana@techzite.com', phoneNumber: '9876543213' },
            { techziteId: 'TZ2024005', name: 'Ethan Hunt', email: 'ethan@techzite.com', phoneNumber: '9876543214' },
            { techziteId: 'TZ2024006', name: 'Fiona Green', email: 'fiona@techzite.com', phoneNumber: '9876543215' },

            // Group 3
            { techziteId: 'TZ2024007', name: 'George Wilson', email: 'george@techzite.com', phoneNumber: '9876543216' },
            { techziteId: 'TZ2024008', name: 'Hannah Lee', email: 'hannah@techzite.com', phoneNumber: '9876543217' },
            { techziteId: 'TZ2024009', name: 'Ian Taylor', email: 'ian@techzite.com', phoneNumber: '9876543218' },

            // Group 4
            { techziteId: 'TZ2024010', name: 'Julia Roberts', email: 'julia@techzite.com', phoneNumber: '9876543219' },
            { techziteId: 'TZ2024011', name: 'Kevin Hart', email: 'kevin@techzite.com', phoneNumber: '9876543220' },
            { techziteId: 'TZ2024012', name: 'Laura Davis', email: 'laura@techzite.com', phoneNumber: '9876543221' }
        ];

        await Student.insertMany(students);
        console.log('\n✅ Successfully seeded 12 students!\n');
        console.log('📋 Suggested Group Combinations:');
        console.log('\nGroup 1:');
        console.log('  TZ2024001 (Alice) - 9876543210');
        console.log('  TZ2024002 (Bob) - 9876543211');
        console.log('  TZ2024003 (Charlie) - 9876543212');
        console.log('\nGroup 2:');
        console.log('  TZ2024004 (Diana) - 9876543213');
        console.log('  TZ2024005 (Ethan) - 9876543214');
        console.log('  TZ2024006 (Fiona) - 9876543215');
        console.log('\nGroup 3:');
        console.log('  TZ2024007 (George) - 9876543216');
        console.log('  TZ2024008 (Hannah) - 9876543217');
        console.log('  TZ2024009 (Ian) - 9876543218');
        console.log('\nGroup 4:');
        console.log('  TZ2024010 (Julia) - 9876543219');
        console.log('  TZ2024011 (Kevin) - 9876543220');
        console.log('  TZ2024012 (Laura) - 9876543221\n');

        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedStudents();
