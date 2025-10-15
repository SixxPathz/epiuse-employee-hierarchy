import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../prismaClient';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId;
    const extension = path.extname(file.originalname);
    const filename = `profile-${userId}-${Date.now()}${extension}`;
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Upload profile picture
router.post('/profile-picture', authMiddleware, upload.single('profilePicture'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get user's employee record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true }
    });

    if (!user || !user.employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    // Delete old profile picture if it exists
    if (user.employee.profilePicture) {
      const oldPicturePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.employee.profilePicture));
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Update employee record with new profile picture path
    // Save relative path without /api since frontend will prepend the base URL
    const profilePictureUrl = `/upload/profile-picture/${path.basename(file.path)}`;
    
    const updatedEmployee = await prisma.employee.update({
      where: { id: user.employee.id },
      data: {
        profilePicture: profilePictureUrl
      }
    });

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl,
      employee: updatedEmployee
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
});

// Serve profile pictures
router.get('/profile-picture/:filename', (req: Request, res: Response) => {
  try {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    
    // Sanitize filename to prevent path traversal
    const filename = path.basename(req.params.filename);
    const filepath = path.join(__dirname, '../../uploads/profiles', filename);
    
    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }

    // Set appropriate content type
    const ext = path.extname(filename).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Stream the file
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Serve profile picture error:', error);
    res.status(500).json({ error: 'Failed to serve profile picture' });
  }
});

// Delete profile picture
router.delete('/profile-picture', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Get user's employee record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true }
    });

    if (!user || !user.employee) {
      return res.status(404).json({ error: 'Employee record not found' });
    }

    if (!user.employee.profilePicture) {
      return res.status(400).json({ error: 'No profile picture to delete' });
    }

    // Delete the file
    const picturePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.employee.profilePicture));
    if (fs.existsSync(picturePath)) {
      fs.unlinkSync(picturePath);
    }

    // Update employee record
    const updatedEmployee = await prisma.employee.update({
      where: { id: user.employee.id },
      data: {
        profilePicture: null
      }
    });

    res.json({
      message: 'Profile picture deleted successfully',
      employee: updatedEmployee
    });

  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
});

export default router;
