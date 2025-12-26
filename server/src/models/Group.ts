import mongoose, { Schema, Document } from 'mongoose';

export interface IGroup extends Document {
    groupId: string;
    students: mongoose.Types.ObjectId[];
    quizState?: {
        currentQuestionIndex: number;
        startTime?: Date;
        isLocked: boolean;
        isFinished: boolean;
        score?: number;
    };
    violationLogs: {
        type: string;
        timestamp: Date;
    }[];
    violationCount: number;
    violatedMultipleTimes: boolean;
}

const GroupSchema = new Schema({
    groupId: {
        type: String,
        required: true,
        unique: true
    },
    students: [{
        type: Schema.Types.ObjectId,
        ref: 'Student'
    }],
    quizState: {
        currentQuestionIndex: { type: Number, default: 0 },
        startTime: Date,
        isLocked: { type: Boolean, default: false },
        isFinished: { type: Boolean, default: false },
        score: Number
    },
    violationLogs: [{
        type: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    violationCount: {
        type: Number,
        default: 0
    },
    violatedMultipleTimes: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export const Group = mongoose.model<IGroup>('Group', GroupSchema);
