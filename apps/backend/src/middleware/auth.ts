import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prismaClient';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    employee?: any;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Fetch user with employee data for proper authorization
    const userWithEmployee = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { employee: true }
    });

    if (!userWithEmployee) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Use database values, not token claims
    req.user = {
      userId: userWithEmployee.id,
      email: userWithEmployee.email,
      role: String(userWithEmployee.role),
      employee: userWithEmployee.employee
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
