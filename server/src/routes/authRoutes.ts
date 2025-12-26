import express from 'express';
import { groupLogin } from '../controllers/authController';

const router = express.Router();

router.post('/group-login', groupLogin);

export default router;
