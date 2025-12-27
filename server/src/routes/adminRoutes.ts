import express from 'express';
import { Group } from '../models/Group';
import { uploadStudents, uploadMiddleware, adminLogin, getAllGroups, deleteGroup } from '../controllers/adminController';
import { unlockGroup } from '../controllers/unlockController';
import { verifyAdmin } from '../middleware/adminMiddleware';

const router = express.Router();

router.post('/login', adminLogin);

// Protected Routes
router.use(verifyAdmin);

router.get('/groups', getAllGroups);
router.delete('/groups/:id', deleteGroup);

router.post('/upload-students', uploadMiddleware, uploadStudents);
router.post('/unlock-group', unlockGroup);

// Heavy violators endpoint
router.get('/heavy-violators', async (req, res) => {
    try {
        const groups = await Group.find({ violatedMultipleTimes: true })
            .populate('students', 'name techziteId');

        const violators = groups.map(group => ({
            groupId: group._id,
            students: group.students.map((s: any) => s.name),
            violationCount: group.violationCount
        }));

        res.json(violators);
    } catch (error) {
        console.error('Error fetching heavy violators:', error);
        res.status(500).json({ message: 'Error fetching heavy violators' });
    }
});

export default router;
