import { Request, Response } from 'express';
import { Student } from '../models/Student';
import { Group } from '../models/Group';
import { Quiz } from '../models/Quiz'; // Assuming this model exists and manages Questions

export const getAllResources = async (req: Request, res: Response) => {
    const { resource } = req.params;
    try {
        let data;
        if (resource === 'students') {
            data = await Student.find({}).sort({ techziteId: 1 });
        } else if (resource === 'groups') {
            data = await Group.find({}).populate('students', 'name techziteId');
        } else if (resource === 'quizzes') {
            data = await Quiz.find({});
        } else {
            return res.status(400).json({ message: 'Invalid resource type' });
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data', error });
    }
};

export const deleteResource = async (req: Request, res: Response) => {
    const { resource, id } = req.params;
    try {
        if (resource === 'students') {
            await Student.findByIdAndDelete(id);
        } else if (resource === 'groups') {
            await Group.findByIdAndDelete(id);
        } else if (resource === 'quizzes') {
            await Quiz.findByIdAndDelete(id);
        } else {
            return res.status(400).json({ message: 'Invalid resource type' });
        }
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting item', error });
    }
};

export const updateResource = async (req: Request, res: Response) => {
    const { resource, id } = req.params;
    const updates = req.body;
    try {
        let updatedItem;
        if (resource === 'students') {
            updatedItem = await Student.findByIdAndUpdate(id, updates, { new: true });
        } else if (resource === 'groups') {
            updatedItem = await Group.findByIdAndUpdate(id, updates, { new: true });
        } else if (resource === 'quizzes') {
            updatedItem = await Quiz.findByIdAndUpdate(id, updates, { new: true });
        } else {
            return res.status(400).json({ message: 'Invalid resource type' });
        }
        res.json(updatedItem);
    } catch (error) {
        res.status(500).json({ message: 'Error updating item', error });
    }
};

export const createResource = async (req: Request, res: Response) => {
    const { resource } = req.params;
    const body = req.body;
    try {
        let newItem;
        if (resource === 'students') {
            newItem = await Student.create(body);
        } else if (resource === 'groups') {
            newItem = await Group.create(body);
        } else if (resource === 'quizzes') {
            newItem = await Quiz.create(body);
        } else {
            return res.status(400).json({ message: 'Invalid resource type' });
        }
        res.json(newItem);
    } catch (error) {
        res.status(500).json({ message: 'Error creating item', error });
    }
};
