import express from 'express';
import { seedDatabase } from '../utils/seedProduction';

const router = express.Router();

// One-time database seeding endpoint for production
router.post('/seed-production', async (req, res) => {
  try {
    // Only allow seeding in production environment
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({ 
        error: 'Seeding endpoint only available in production environment' 
      });
    }

    // Optional: Add a secret key for security
    const seedSecret = req.headers['x-seed-secret'] || req.body.secret;
    if (seedSecret !== 'epiuse-seed-2025') {
      return res.status(401).json({ 
        error: 'Invalid seed secret' 
      });
    }

    const result = await seedDatabase();
    res.json(result);
  } catch (error) {
    console.error('Seed endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to seed database',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;