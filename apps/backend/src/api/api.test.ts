import request from 'supertest';
import app from '../app';

// Mock Prisma client
jest.mock('../prismaClient', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    employee: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('API Endpoints', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Authentication', () => {
    it('should reject login with invalid credentials', async () => {
      // Mock Prisma to return null (user not found)
      const { prisma } = require('../prismaClient');
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@test.com',
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });

    it('should require valid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Employee Endpoints', () => {
    it('should require authentication for employee access', async () => {
      const response = await request(app)
        .get('/api/employees')
        .expect(401);
      
      expect(response.body).toHaveProperty('error');
    });
  });
});