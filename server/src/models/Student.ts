import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
    techziteId: string;
    name: string;
    email: string;
    phoneNumber: string;
}

const StudentSchema = new Schema({
    techziteId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    phoneNumber: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

export const Student = mongoose.model<IStudent>('Student', StudentSchema);
