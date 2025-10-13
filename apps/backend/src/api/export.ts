import { Router, Request, Response } from 'express';
import { Parser } from 'json2csv';
import { prisma } from '../prismaClient';
import { checkPermission } from '../config/permissions';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Export employees as CSV
router.get('/employees/csv', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // Check permissions
    if (!checkPermission(currentUser.role, 'canViewEmployees')) {
      return res.status(403).json({ error: 'You do not have permission to export employee data' });
    }

    // Get all employees with basic information
    const employees = await prisma.employee.findMany({
      include: {
        manager: {
          select: {
            firstName: true,
            lastName: true,
            position: true
          }
        }
      },
      orderBy: {
        lastName: 'asc'
      }
    });

    // Transform data for CSV export
    const csvData = employees.map(emp => ({
      'Employee Number': emp.employeeNumber,
      'First Name': emp.firstName,
      'Last Name': emp.lastName,
      'Email': emp.email,
      'Position': emp.position,
      'Salary': checkPermission(currentUser.role, 'canViewSalaries') ? emp.salary : 'N/A',
      'Birth Date': emp.birthDate.toISOString().split('T')[0],
      'Manager': emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : 'No Manager',
      'Manager Position': emp.manager?.position || 'N/A',
      'Created Date': emp.createdAt.toISOString().split('T')[0]
    }));

    const fields = [
      'Employee Number',
      'First Name', 
      'Last Name',
      'Email',
      'Position',
      'Salary',
      'Birth Date',
      'Manager',
      'Manager Position',
      'Created Date'
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="employees_export_${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csv);

  } catch (error) {
    console.error('Export employees error:', error);
    res.status(500).json({ error: 'Failed to export employee data' });
  }
});

// Export hierarchy as JSON
router.get('/hierarchy/json', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // Check permissions
    if (!checkPermission(currentUser.role, 'canViewEmployees')) {
      return res.status(403).json({ error: 'You do not have permission to export hierarchy data' });
    }

    // Get all employees with their hierarchical relationships
    const employees = await prisma.employee.findMany({
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    });

    // Transform into hierarchical structure
    const hierarchyData = employees.map(emp => ({
      id: emp.id,
      employeeNumber: emp.employeeNumber,
      name: `${emp.firstName} ${emp.lastName}`,
      position: emp.position,
      email: emp.email,
      manager: emp.manager ? {
        id: emp.manager.id,
        name: `${emp.manager.firstName} ${emp.manager.lastName}`,
        position: emp.manager.position
      } : null,
      subordinates: emp.subordinates.map(sub => ({
        id: sub.id,
        name: `${sub.firstName} ${sub.lastName}`,
        position: sub.position
      }))
    }));

    res.json({
      exportDate: new Date().toISOString(),
      totalEmployees: employees.length,
      hierarchy: hierarchyData
    });

  } catch (error) {
    console.error('Export hierarchy error:', error);
    res.status(500).json({ error: 'Failed to export hierarchy data' });
  }
});

// Get export statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;

    // Check permissions
    if (!checkPermission(currentUser.role, 'canViewEmployees')) {
      return res.status(403).json({ error: 'You do not have permission to view export statistics' });
    }

    const totalEmployees = await prisma.employee.count();

    res.json({
      totalEmployees,
      availableFormats: ['CSV', 'JSON'],
      exportDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Export stats error:', error);
    res.status(500).json({ error: 'Failed to get export statistics' });
  }
});

export default router;