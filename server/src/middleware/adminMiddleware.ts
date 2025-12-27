import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
    admin?: any;
}

export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Check if it's an admin token (payload should have role: 'admin')
        if ((decoded as any).role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
