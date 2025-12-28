import express from 'express';
import { Group } from '../models/Group';
import { uploadStudents, uploadMiddleware, authenticateAdmin } from '../controllers/adminController';
import { unlockGroup } from '../controllers/unlockController';
import { groupLogin } from '../controllers/authController';
import { getAllResources, deleteResource, updateResource, createResource } from '../controllers/resourceController';
import { adminAuth } from '../middleware/adminAuth';


const router = express.Router();

router.post('/authenticate', authenticateAdmin);

// Protected Routes below
router.use(adminAuth);

router.post('/upload-students', uploadMiddleware, uploadStudents);
router.post('/unlock-group', unlockGroup);

// Generic Resource Managment
router.get('/resources/:resource', getAllResources);
router.post('/resources/:resource', createResource);
router.put('/resources/:resource/:id', updateResource);
router.delete('/resources/:resource/:id', deleteResource);


// Heavy violators endpoint
router.get('/heavy-violators', adminAuth, async (req, res) => {

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
