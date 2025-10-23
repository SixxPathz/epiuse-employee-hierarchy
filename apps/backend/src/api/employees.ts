import { Router, Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import bcrypt from 'bcryptjs';
import { prisma } from '../prismaClient';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Helper function to get all subordinate IDs recursively
async function getAllSubordinateIds(employeeId: string): Promise<string[]> {
  const subordinates = await prisma.employee.findMany({
    where: { managerId: employeeId },
    select: { id: true }
  });

  let allSubordinateIds = subordinates.map(s => s.id);
  
  // Recursively get subordinates of subordinates
  for (const subordinate of subordinates) {
    const subSubordinates = await getAllSubordinateIds(subordinate.id);
    allSubordinateIds.push(...subSubordinates);
  }

  return allSubordinateIds;
}

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all employees with filtering, sorting, and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString(),
  query('name').optional().isString(),
  query('employeeNumber').optional().isString(),
  query('position').optional().isString(),
  query('department').optional().isString(),
  query('managerOnly').optional().isBoolean(),
  query('managersFor').optional().isString(), // Employee ID to get valid managers for
  query('sortBy').optional().isIn(['firstName', 'lastName', 'salary', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const name = req.query.name as string;
    const employeeNumber = req.query.employeeNumber as string;
    const position = req.query.position as string;
    const department = req.query.department as string;
    const managerOnly = req.query.managerOnly === 'true';
    const managersFor = req.query.managersFor as string;
    const sortBy = req.query.sortBy as string || 'firstName';
    const sortOrder = req.query.sortOrder as string || 'asc';
    const currentUser = (req as any).user;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    // PROFESSIONAL MANAGEMENT SYSTEM: Filter employees based on role and hierarchy
    if (currentUser.role === 'MANAGER') {
      // Managers can ONLY see their direct and indirect subordinates + themselves
      // NO access to other managers, peers, or employees outside their hierarchy
      const currentManager = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        include: {
          employee: {
            select: {
              id: true,
              managerId: true
            }
          }
        }
      });

      if (currentManager?.employee) {
        // Get all subordinates recursively
        const subordinateIds = await getAllSubordinateIds(currentManager.employee.id);
        
        // STRICT: Only themselves + subordinates (NO other managers visible)
        where.id = {
          in: [
            currentManager.employee.id,
            ...subordinateIds
          ]
        };
      }
    } else if (currentUser.role === 'EMPLOYEE') {
      // Employees can only see department colleagues and their management chain
      const currentEmployee = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        include: {
          employee: {
            select: {
              id: true,
              managerId: true
            }
          }
        }
      });

      if (currentEmployee?.employee) {
        // Get department colleagues (same manager)
        const colleagues = await prisma.employee.findMany({
          where: { 
            managerId: currentEmployee.employee.managerId
          },
          select: { id: true }
        });

        // Build management chain by traversing up the hierarchy
        const managementChain = [];
        let currentManagerId = currentEmployee.employee.managerId;
        
        while (currentManagerId) {
          managementChain.push(currentManagerId);
          
          // Get the next level manager
          const manager = await prisma.employee.findUnique({
            where: { id: currentManagerId },
            select: { managerId: true }
          });
          
          currentManagerId = manager?.managerId || null;
        }

        // Include: themselves + department colleagues + management chain
        where.id = {
          in: [
            currentEmployee.employee.id,
            ...colleagues.map(c => c.id),
            ...managementChain
          ]
        };
      }
    }
    // ADMIN users see all employees (no additional filtering)
    
    // Handle general search parameter
    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { employeeNumber: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // Handle specific name search parameter
    if (name) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { firstName: { contains: name, mode: 'insensitive' } },
          { lastName: { contains: name, mode: 'insensitive' } },
          { email: { contains: name, mode: 'insensitive' } }
        ]
      });
    }

    // Handle specific employee number search parameter
    if (employeeNumber) {
      where.AND = where.AND || [];
      where.AND.push({
        employeeNumber: { contains: employeeNumber, mode: 'insensitive' }
      });
    }

    if (position) {
      where.AND = where.AND || [];
      where.AND.push({
        position: { contains: position, mode: 'insensitive' }
      });
    }

    // Department filtering - simplified to use direct field access
    if (department) {
      where.AND = where.AND || [];
      where.AND.push({
        department: department
      });
    }

    // PROFESSIONAL MANAGEMENT SYSTEM: Filter by actual managers only
    if (managerOnly) {
      // Get user's role from database to ensure data integrity
      const currentUserDetails = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        include: {
          employee: {
            select: {
              id: true,
              managerId: true,
              subordinates: { select: { id: true } }
            }
          }
        }
      });

      if (currentUser.role === 'ADMIN') {
        // Admins can see all managers (CEO + people with subordinates)
        const managersWithSubordinates = await prisma.employee.findMany({
          where: {
            subordinates: {
              some: {}
            }
          },
          select: { id: true }
        });
        
        const ceo = await prisma.employee.findFirst({
          where: { managerId: null },
          select: { id: true }
        });

        const validManagerIds = [
          ...managersWithSubordinates.map(m => m.id),
          ...(ceo ? [ceo.id] : [])
        ];

        where.id = { in: validManagerIds };
      } else if (currentUser.role === 'MANAGER') {
        // Managers can ONLY assign employees to themselves
        // NO access to assign to CEO or other managers
        const currentManager = currentUserDetails?.employee;
        if (currentManager) {
          where.id = { 
            in: [currentManager.id] // Only themselves
          };
        }
      } else {
        // PROFESSIONAL SYSTEM: Regular employees can view managers for organizational awareness
        // but get a limited set - just actual department heads and CEO
        const ceo = await prisma.employee.findFirst({
          where: { managerId: null },
          select: { id: true }
        });

        const departmentHeads = await prisma.employee.findMany({
          where: {
            AND: [
              {
                subordinates: {
                  some: {}
                }
              },
              {
                managerId: ceo?.id // Only direct reports to CEO (department heads)
              }
            ]
          },
          select: { id: true }
        });

        where.id = { 
          in: [
            ...(ceo ? [ceo.id] : []),
            ...departmentHeads.map(m => m.id)
          ] 
        };
      }
    }

    // PROFESSIONAL MANAGEMENT SYSTEM: Restrict manager assignment based on hierarchy
    if (managersFor) {
      const targetEmployee = await prisma.employee.findUnique({
        where: { id: managersFor },
        include: {
          manager: true,
          subordinates: true
        }
      });

      if (!targetEmployee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      // Exclude the employee themselves and their subordinates from being managers
      const subordinateIds = await getAllSubordinateIds(targetEmployee.id);
      where.id = { 
        notIn: [targetEmployee.id, ...subordinateIds]
      };
    }

    // Get employees with pagination
    const [employees, totalCount] = await Promise.all([
      prisma.employee.findMany({
        where,
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
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.employee.count({ where })
    ]);

    // PROFESSIONAL MANAGEMENT SYSTEM: Filter sensitive data based on role
    // For MANAGERs we need the full set of recursively managed employee IDs to decide salary visibility
    let managedIdsForCurrentManager: string[] = [];
    if (currentUser.role === 'MANAGER' && currentUser.employee?.id) {
      const allIds = await getAllSubordinateIds(currentUser.employee.id);
      managedIdsForCurrentManager = [currentUser.employee.id, ...allIds];
    }

    const filteredEmployees = employees.map(employee => {
      if (currentUser.role === 'ADMIN') {
        // Admins can see all fields
        return employee;
      } else if (currentUser.role === 'MANAGER') {
        // Managers can see birth dates and salaries for ANY of their managed employees (direct or indirect) + themselves
        const isManaged = managedIdsForCurrentManager.includes(employee.id);
        if (isManaged) {
          return employee; // Show all fields
        } else {
          // Hide sensitive data for non-subordinates
          const { birthDate, salary, ...publicData } = employee;
          return publicData;
        }
      } else {
        // EMPLOYEEs can only see birth date and salary for themselves
        const currentUserEmployee = currentUser.employee;
        const isSelf = employee.id === currentUserEmployee?.id;
        
        if (isSelf) {
          return employee; // Show all fields for self
        } else {
          // Hide sensitive data for others
          const { birthDate, salary, ...publicData } = employee;
          return publicData;
        }
      }
    });

    res.json({
      employees: filteredEmployees,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get employee by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true
          }
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            email: true,
            salary: true,
            subordinates: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                email: true,
                salary: true,
                subordinates: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    position: true,
                    email: true,
                    salary: true,
                    subordinates: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: true,
                        email: true,
                        salary: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // PROFESSIONAL MANAGEMENT SYSTEM: Filter sensitive data based on role
    let filteredEmployee;
    if (currentUser.role === 'ADMIN') {
      // Admins can see all fields
      filteredEmployee = employee;
    } else if (currentUser.role === 'MANAGER') {
      // Managers can see birth dates and salaries only for subordinates + themselves
      const currentUserEmployee = currentUser.employee;
      const isSubordinate = employee.managerId === currentUserEmployee?.id;
      const isSelf = employee.id === currentUserEmployee?.id;
      
      if (isSubordinate || isSelf) {
        filteredEmployee = employee; // Show all fields
      } else {
        // Hide sensitive data for non-subordinates
        const { birthDate, salary, ...publicData } = employee;
        filteredEmployee = publicData;
      }
    } else {
      // EMPLOYEEs can only see birth date and salary for themselves
      const currentUserEmployee = currentUser.employee;
      const isSelf = employee.id === currentUserEmployee?.id;
      
      if (isSelf) {
        filteredEmployee = employee; // Show all fields for self
      } else {
        // Hide sensitive data for others
        const { birthDate, salary, ...publicData } = employee;
        filteredEmployee = publicData;
      }
    }

    res.json({ employee: filteredEmployee });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create employee
router.post('/', [
  body('firstName').trim().isLength({ min: 1 }),
  body('lastName').trim().isLength({ min: 1 }),
  body('email').isEmail().normalizeEmail(),
  body('birthDate').isISO8601(),
  body('employeeNumber').trim().isLength({ min: 1 }),
  body('salary').isFloat({ min: 0 }),
  body('position').trim().isLength({ min: 1 }),
  body('managerId').optional().isString(),
  body('department').isString().trim().notEmpty(), // Allow any non-empty string
  body('isManager').optional().isBoolean(), // Explicit role from Add Manager/Employee button
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { firstName, lastName, email, birthDate, employeeNumber, salary, position, managerId, department, isManager } = req.body;
    // Normalize department name and employee number
    department = typeof department === 'string' ? department.trim().toLowerCase().replace(/\s+/g, '-') : department;
    employeeNumber = typeof employeeNumber === 'string' ? employeeNumber.trim().toUpperCase() : employeeNumber;
    // Validate employee number format
    if (!/^EMP-\d{3,5}$/i.test(employeeNumber)) {
      return res.status(400).json({ error: 'Employee number must be in format EMP-XXX' });
    }
    // Validate department name format
    if (!/^[a-z0-9-]{2,30}$/i.test(department)) {
      return res.status(400).json({ error: 'Department name must be 2-30 characters, letters/numbers/hyphens only' });
    }
    const currentUser = (req as any).user;

    // PROFESSIONAL MANAGEMENT SYSTEM: Authorization checks
    if (currentUser.role === 'EMPLOYEE') {
      return res.status(403).json({ error: 'Employees cannot create new employee records' });
    }
    // Allow managers to create sub-managers under them (removed restriction)
    // Managers can add employees and sub-managers to their own department
    if (currentUser.role === 'MANAGER' && department !== currentUser.employee?.department) {
      return res.status(403).json({ error: 'Managers can only add employees to their own department' });
    }

    // Enforce backend rules for manager/employee creation
    if (managerId) {
      const manager = await prisma.employee.findUnique({
        where: { id: managerId },
        select: {
          id: true,
          department: true,
          position: true,
          managerId: true
        }
      });

      if (!manager) {
        // If adding a manager for a new department, allow managerId to be null or CEO to be missing
        // Only block if managerId is not null and not found
        // For first manager in a new department, managerId may be CEO or null
        // Allow multiple managers in a department for hierarchical structure
        // No longer restricting to one manager per department
      } else {
        // Prevent cycles: manager cannot be a subordinate of employee
        if (managerId === email) {
          return res.status(400).json({ error: 'Employee cannot be their own manager.' });
        }

        // Get manager's department directly from the department field
        const managerDepartment = manager.department;

        // Allow multiple managers in a department for hierarchical structure
        // Removed unique manager per department restriction

        // Validate department-manager alignment
        if (currentUser.role === 'MANAGER') {
          // Managers can assign employees and sub-managers to themselves within their department
          const currentManager = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            include: { employee: true }
          });

          if (currentManager?.employee?.id !== managerId) {
            return res.status(403).json({ 
              error: 'Managers can only assign employees and sub-managers to themselves' 
            });
          }
          
          // Ensure the selected department matches the manager's department
          if (managerDepartment !== department) {
            return res.status(400).json({ 
              error: `Selected manager is not in the ${department} department` 
            });
          }
        } else if (currentUser.role === 'ADMIN') {
          // CEO/Admin can assign across departments but must respect department rules
          // CEO (management department) can manage any department
          if (managerDepartment !== 'management' && managerDepartment !== department) {
            return res.status(400).json({ 
              error: `Selected manager is not authorized for the ${department} department` 
            });
          }
        }
      }
    }

    // Prevent employees without manager (except CEO)
    if (!managerId && position.toLowerCase().indexOf('ceo') === -1) {
      return res.status(400).json({ error: 'Employees must have a manager assigned, except for the CEO.' });
    }

    // Check for unique constraints
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email },
          { employeeNumber }
        ]
      }
    });

    if (existingEmployee) {
      return res.status(400).json({ 
        error: existingEmployee.email === email ? 'Email already exists' : 'Employee number already exists'
      });
    }

    // Validate manager exists and is not the same as the employee being created
    if (managerId) {
      const manager = await prisma.employee.findUnique({
        where: { id: managerId }
      });

      if (!manager) {
        return res.status(400).json({ error: 'Manager not found' });
      }
    }

    // Create user and employee in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Determine role based on explicit button choice (Add Manager vs Add Employee)
      let role = 'EMPLOYEE';
      
      // CEO detection: no manager assigned = ADMIN role (top of hierarchy)
      if (!managerId) {
        role = 'ADMIN';
      } 
      // Manager role: explicitly set via "Add Manager" button
      else if (isManager === true) {
        role = 'MANAGER';
      }
      // Otherwise: EMPLOYEE role (default)

      // Create user record first (required for foreign key relationship)
  const hashedPassword = await bcrypt.hash('securepassword123', 10); // Default password
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role as any,
          mustChangePassword: true // Force password change on first login
        }
      });

      // Create employee record
      const employee = await tx.employee.create({
        data: {
          firstName,
          lastName,
          email,
          birthDate: new Date(birthDate),
          employeeNumber,
          salary: parseFloat(salary),
          position,
          department, // Add the department field
          managerId
        },
        include: {
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true
            }
          }
        }
      });

      return { user, employee };
    });

    res.status(201).json({
      message: 'Employee created successfully',
      employee: result.employee
    });

  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update employee
router.put('/:id', [
  body('firstName').optional().trim().isLength({ min: 1 }),
  body('lastName').optional().trim().isLength({ min: 1 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('birthDate').optional().isISO8601(),
  body('employeeNumber').optional().trim().isLength({ min: 1 }),
  body('salary').optional().isFloat({ min: 0 }),
  body('position').optional().trim().isLength({ min: 1 }),
  body('managerId').optional().isString(),
  body('department').optional().isString().trim(), // Allow any string
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;
    const currentUser = (req as any).user;

    const currentEmployee = await prisma.employee.findUnique({
      where: { id },
      include: {
        manager: true
      }
    });

    if (!currentEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // PROFESSIONAL MANAGEMENT SYSTEM: Authorization checks
    if (currentUser.role === 'EMPLOYEE') {
      return res.status(403).json({ error: 'Employees cannot edit employee records' });
    }

    if (currentUser.role === 'MANAGER') {
      // Managers can edit all employees under them recursively (direct and indirect reports)
      const currentManager = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        include: {
          employee: true
        }
      });

      if (currentManager?.employee) {
        // Get all subordinates recursively
        const allSubordinateIds = await getAllSubordinateIds(currentManager.employee.id);
        
        if (!allSubordinateIds.includes(id) && currentManager.employee.id !== id) {
          return res.status(403).json({ 
            error: 'Managers can only edit employees under their management or themselves' 
          });
        }

        // If updating managerId, ensure it's valid for this manager
        if (updateData.managerId) {
          const validManagerIds = [currentManager.employee.id];
          if (currentManager.employee.managerId) {
            validManagerIds.push(currentManager.employee.managerId);
          }

          if (!validManagerIds.includes(updateData.managerId)) {
            return res.status(403).json({ 
              error: 'Managers can only assign employees to themselves or their direct superiors' 
            });
          }
        }
      }
    }

    // Validate unique constraints if email or employeeNumber is being updated
    if (updateData.email || updateData.employeeNumber) {
      const existingEmployee = await prisma.employee.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                updateData.email ? { email: updateData.email } : {},
                updateData.employeeNumber ? { employeeNumber: updateData.employeeNumber } : {}
              ].filter(condition => Object.keys(condition).length > 0)
            }
          ]
        }
      });

      if (existingEmployee) {
        return res.status(400).json({ 
          error: existingEmployee.email === updateData.email ? 'Email already exists' : 'Employee number already exists'
        });
      }
    }

    // Validate manager if being updated
    if (updateData.managerId) {
      if (updateData.managerId === id) {
        return res.status(400).json({ error: 'Employee cannot be their own manager' });
      }

      const manager = await prisma.employee.findUnique({
        where: { id: updateData.managerId },
        select: { id: true, department: true, position: true }
      });

      if (!manager) {
        return res.status(400).json({ error: 'Manager not found' });
      }

      // Allow multiple managers per department for hierarchical structure
      // Removed unique manager per department restriction
    }

    // Auto-update managerId if department changes
    const finalUpdateData: any = { ...updateData };
    if (finalUpdateData.birthDate) {
      finalUpdateData.birthDate = new Date(finalUpdateData.birthDate);
    }
    if (finalUpdateData.salary) {
      finalUpdateData.salary = parseFloat(finalUpdateData.salary);
    }
    // If department is being changed, auto-assign managerId for new department
    if (finalUpdateData.department && finalUpdateData.department !== currentEmployee.department) {
      // Find manager for new department
      const newDeptManager = await prisma.employee.findFirst({
        where: {
          department: finalUpdateData.department,
          OR: [
            { position: { contains: 'manager', mode: 'insensitive' } },
            { position: { contains: 'head of', mode: 'insensitive' } },
            { position: { contains: 'director', mode: 'insensitive' } }
          ]
        }
      });
      if (newDeptManager) {
        finalUpdateData.managerId = newDeptManager.id;
      } else {
        // If no manager exists, block department change
        return res.status(400).json({ error: 'Cannot change department: no manager exists for the selected department.' });
      }
    }

    // Handle email updates - need to update both user and employee due to foreign key constraint
    if (finalUpdateData.email) {
      // Update in a transaction to ensure consistency
      const updatedEmployee = await prisma.$transaction(async (tx) => {
        // First, update the user's email
        const userToUpdate = await tx.user.findUnique({
          where: { email: currentEmployee.email }
        });

        if (userToUpdate) {
          await tx.user.update({
            where: { id: userToUpdate.id },
            data: { email: finalUpdateData.email }
          });
        }

        // Then update the employee
        return await tx.employee.update({
          where: { id },
          data: finalUpdateData,
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
      });

      return res.json({ employee: updatedEmployee });
    } else {
      // No email update, proceed normally
      const updatedEmployee = await prisma.employee.update({
        where: { id },
        data: finalUpdateData,
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

      return res.json({ employee: updatedEmployee });
    }
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete employee
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    const currentEmployee = await prisma.employee.findUnique({
      where: { id },
      include: {
        subordinates: true
      }
    });

    if (!currentEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }


    // Authorization: Only allow managers to delete employees in their department or under their management
    if (currentUser.role === 'MANAGER') {
      // Get manager's employee record
      const manager = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        include: { employee: { include: { subordinates: true } } }
      });
      if (!manager?.employee) {
        return res.status(403).json({ error: 'Manager record not found' });
      }
      // Only allow deletion of direct subordinates or employees in the same department
      const subordinateIds = manager.employee.subordinates.map(s => s.id);
      const sameDepartment = manager.employee.department === currentEmployee.department;
      if (!subordinateIds.includes(currentEmployee.id) && !sameDepartment) {
        return res.status(403).json({ error: 'Managers can only delete employees in their department or under their management.' });
      }
    }

    // Prevent deletion of managers with employees assigned
    if (currentEmployee.subordinates.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete manager with employees assigned. Please reassign or remove all subordinates before deleting this manager.' 
      });
    }

    // Enforce CEO always exists
    // CEO is defined as employee with no managerId and position containing 'ceo' (case-insensitive)
    const isCEO = !currentEmployee.managerId && currentEmployee.position.toLowerCase().includes('ceo');
    if (isCEO) {
      // Check if there are other CEOs in the org
      const otherCEOs = await prisma.employee.findMany({
        where: {
          id: { not: id },
          managerId: null,
          position: { contains: 'ceo', mode: 'insensitive' }
        }
      });
      if (otherCEOs.length === 0) {
        return res.status(400).json({
          error: 'Cannot delete the only CEO. The organization must always have a CEO.'
        });
      }
    }

    // Store employee data for audit log before deletion
    const employeeDataForAudit = {
      firstName: currentEmployee.firstName,
      lastName: currentEmployee.lastName,
      email: currentEmployee.email,
      position: currentEmployee.position,
      department: currentEmployee.department,
      employeeNumber: currentEmployee.employeeNumber,
      salary: currentEmployee.salary,
      managerId: currentEmployee.managerId
    };

    // Delete all related data for employee
    await prisma.$transaction(async (tx) => {
      // Detach all subordinates (set their managerId to null)
      await tx.employee.updateMany({
        where: { managerId: id },
        data: { managerId: null }
      });

      // Delete profile picture file if exists (optional, if stored on disk)
      // TODO: Implement file deletion if needed (currently only DB field cleared)
      if (currentEmployee.profilePicture) {
        await tx.employee.update({
          where: { id },
          data: { profilePicture: null }
        });
      }

      // Delete employee
      await tx.employee.delete({ where: { id } });
      // Delete user by email (if exists)
      if (currentEmployee.email) {
        await tx.user.deleteMany({ where: { email: currentEmployee.email } });
      }
    });

    res.json({ message: 'Employee, user, and all related data deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get basic dashboard statistics
router.get('/stats/dashboard', async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    
    // Dashboard stats show organization-wide data for all users
    // No role-based filtering - everyone sees the same organizational overview
    
    // Get basic statistics for the entire organization
    const [totalEmployees, employees, users] = await Promise.all([
      prisma.employee.count(), // All employees
      prisma.employee.findMany({ 
        select: {
          id: true,
          position: true,
          email: true, // Need email to match with User
          salary: true, // We'll filter this based on permissions below
          createdAt: true,
          managerId: true
        }
      }),
      prisma.user.findMany({ 
        select: {
          email: true,
          role: true
        }
      })
    ]);

    // Calculate statistics based on user permissions
    const canViewSalaries = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
    const salaries = canViewSalaries ? employees.map(e => e.salary).filter(Boolean) : [];
    const averageSalary = salaries.length > 0 ? salaries.reduce((a, b) => a + b, 0) / salaries.length : 0;

    // Count managers by User role (MANAGER only - exclude ADMIN)
    const userRoleMap = new Map(users.map(u => [u.email, u.role]));
    const managerCount = employees.filter(emp => {
      const userRole = userRoleMap.get(emp.email);
      return userRole === 'MANAGER'; // Only count actual managers, not admins
    }).length;

    const managementRatio = totalEmployees > 0 ? (managerCount / totalEmployees) * 100 : 0;

    // Department breakdown using direct department field
    const departmentStats = await prisma.employee.groupBy({
      by: ['department'],
      _count: {
        id: true
      }
    });

    const departments = departmentStats.reduce((acc, stat) => {
      acc[stat.department] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📊 Department counts from database:`, departments);

    // Filter out any uncategorized entries and only return real departments
    const validDepartments = Object.entries(departments)
      .filter(([name, count]) => count > 0)
      .reduce((acc, [name, count]) => {
        acc[name] = count;
        return acc;
      }, {} as { [key: string]: number });

    res.json({
      totalEmployees,
      averageSalary: canViewSalaries ? averageSalary : null,
      managementRatio: {
        totalManagers: managerCount,
        ratio: managementRatio
      },
      avgSalaryByPosition: canViewSalaries ? [{
        position: 'All Positions',
        _avg: { salary: averageSalary }
      }] : [],
      departmentDistribution: Object.entries(validDepartments).map(([name, count]) => ({
        name,
        count: count as number
      })),
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Unable to generate dashboard statistics' });
  }
});

// Get organization hierarchy with unlimited depth
router.get('/hierarchy/tree', async (req: Request, res: Response) => {
  try {
    // Get all employees with their user roles
    const employees = await prisma.employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        email: true,
        salary: true,
        employeeNumber: true,
        managerId: true,
        user: {
          select: {
            role: true
          }
        }
      }
    });

    // Find CEO (employee with no manager)
    const ceo = employees.find(emp => !emp.managerId);

    if (!ceo) {
      return res.status(404).json({ error: 'No CEO found in organization' });
    }

    // Create a map for fast lookup
    const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

    // Build hierarchy tree recursively with unlimited depth
    const buildTree = (employeeId: string): any => {
      const employee = employeeMap.get(employeeId);
      if (!employee) return null;

      // Find all direct subordinates
      const subordinates = employees.filter(emp => emp.managerId === employeeId);

      return {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        position: employee.position,
        email: employee.email,
        salary: employee.salary,
        employeeNumber: employee.employeeNumber,
        role: employee.user?.role || 'EMPLOYEE',
        children: subordinates.map(sub => buildTree(sub.id)).filter(Boolean)
      };
    };

    const hierarchy = buildTree(ceo.id);

    res.json({ hierarchy });
  } catch (error) {
    console.error('Get hierarchy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available departments
router.get('/departments', async (req: Request, res: Response) => {
  try {
    // Get all unique department names from employees table
    const departmentStats = await prisma.employee.groupBy({
      by: ['department'],
      _count: { id: true }
    });
    const departments = departmentStats.map(stat => ({ id: stat.department, name: stat.department.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));
    res.json({ departments });
  } catch (error) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available managers for a specific department
router.get('/managers-by-department/:departmentId', async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const currentUser = (req as any).user;
    
    // Get all employees with their manager relationships
    const employees = await prisma.employee.findMany({
      include: {
        manager: {
          select: {
            id: true,
            position: true,
            managerId: true,
            manager: {
              select: {
                id: true,
                position: true,
                managerId: true
              }
            }
          }
        }
      }
    });

    // Helper function to determine department (same as dashboard stats)
    const getDepartment = (employee: any): string => {
      if (!employee.managerId) return 'management';
      
      if (employee.manager && !employee.manager.managerId) {
        const managerPosition = employee.manager.position.toLowerCase();
        if (managerPosition.includes('head of technology')) return 'technology';
        if (managerPosition.includes('head of human resources')) return 'human-resources';
        if (managerPosition.includes('head of sales')) return 'sales';
        if (managerPosition.includes('head of marketing')) return 'marketing';
        return 'management';
      }
      
      if (employee.manager && employee.manager.manager) {
        const topManagerPosition = employee.manager.manager.position.toLowerCase();
        if (topManagerPosition.includes('head of technology')) return 'technology';
        if (topManagerPosition.includes('head of human resources')) return 'human-resources';
        if (topManagerPosition.includes('head of sales')) return 'sales';
        if (topManagerPosition.includes('head of marketing')) return 'marketing';
        return 'management';
      }
      
      if (employee.manager) {
        const managerPosition = employee.manager.position.toLowerCase();
        if (managerPosition.includes('head of technology')) return 'technology';
        if (managerPosition.includes('head of human resources')) return 'human-resources';
        if (managerPosition.includes('head of sales')) return 'sales';
        if (managerPosition.includes('head of marketing')) return 'marketing';
        return 'management';
      }
      
      return 'uncategorized';
    };

    // Find potential managers based on department and user role
    let availableManagers: any[] = [];

    if (currentUser.role === 'ADMIN') {
      // CEO can assign to any department
      if (departmentId === 'management') {
        // For management, only CEO can be the manager (or no manager for CEO themselves)
        const ceo = employees.find(emp => !emp.managerId);
        availableManagers = ceo ? [ceo] : [];
      } else {
        // For other departments, include CEO and department heads
        const ceo = employees.find(emp => !emp.managerId);
        const departmentHead = employees.find(emp => {
          const empDept = getDepartment(emp);
          return empDept === departmentId && emp.manager && !emp.manager.managerId;
        });
        
        availableManagers = [ceo, departmentHead].filter(Boolean);
        
        // Also include other managers within the same department
        const departmentManagers = employees.filter(emp => {
          const empDept = getDepartment(emp);
          return empDept === departmentId && emp.position.toLowerCase().includes('manager');
        });
        
        availableManagers.push(...departmentManagers);
      }
    } else if (currentUser.role === 'MANAGER') {
      // Managers can only assign within their own department
      const currentManager = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        include: { employee: true }
      });
      
      if (currentManager?.employee) {
        const managerDepartment = currentManager.employee.department;
        
        if (managerDepartment === departmentId) {
          availableManagers = [currentManager.employee].filter(Boolean);
        }
      }
    }

    // Remove duplicates and format response
    const uniqueManagers = availableManagers
      .filter((manager, index, self) => 
        manager && self.findIndex(m => m?.id === manager.id) === index
      )
      .map(manager => ({
        id: manager.id,
        name: `${manager.firstName} ${manager.lastName}`,
        position: manager.position,
        email: manager.email
      }));

    res.json({ managers: uniqueManagers });
  } catch (error) {
    console.error('Get managers by department error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an employee's manager (drag-and-drop org chart)
router.put('/:employeeId/manager', [
  body('managerId').isString().notEmpty()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId } = req.params;
    const { managerId } = req.body;
    const currentUser = (req as any).user;

    // Only Admins and Managers can change manager assignments
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Cannot assign self as manager
    if (employeeId === managerId) {
      return res.status(400).json({ error: 'Employee cannot be their own manager' });
    }

    // Validate employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Validate manager exists
    const manager = await prisma.employee.findUnique({ where: { id: managerId } });
    if (!manager) {
      return res.status(404).json({ error: 'Manager not found' });
    }

    // Prevent cycles: manager cannot be a subordinate of employee
    const subordinateIds = await getAllSubordinateIds(employeeId);
    if (subordinateIds.includes(managerId)) {
      return res.status(400).json({ error: 'Cannot assign a subordinate as manager (would create a cycle)' });
    }

    // Optionally: Managers can only assign employees they manage
    if (currentUser.role === 'MANAGER') {
      const currentManager = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        include: { employee: true }
      });
      if (!currentManager?.employee) {
        return res.status(403).json({ error: 'Manager record not found' });
      }
      // Can only reassign their own subordinates
      const managedIds = await getAllSubordinateIds(currentManager.employee.id);
      managedIds.push(currentManager.employee.id); // include self
      if (!managedIds.includes(employeeId)) {
        return res.status(403).json({ error: 'Managers can only reassign their own subordinates' });
      }
    }

    // Update managerId and related info
    let updateData: any = { managerId };
    // If manager exists, inherit department and position
    if (manager) {
      updateData.department = manager.department;
      updateData.position = manager.position === 'MANAGER' ? 'EMPLOYEE' : manager.position;
    }
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: updateData,
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, position: true } },
        subordinates: { select: { id: true, firstName: true, lastName: true, position: true } }
      }
    });

    res.json({ employee: updatedEmployee });
  } catch (error) {
    console.error('Update manager error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// PATCH: Detach employee (remove manager, but do not delete)
router.patch('/:employeeId/detach', async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const currentUser = (req as any).user;

    // Only Admins and Managers can detach employees
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Validate employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Optionally: Managers can only detach their own subordinates
    if (currentUser.role === 'MANAGER') {
      const currentManager = await prisma.user.findUnique({
        where: { id: currentUser.userId },
        include: { employee: true }
      });
      if (!currentManager?.employee) {
        return res.status(403).json({ error: 'Manager record not found' });
      }
      const managedIds = await getAllSubordinateIds(currentManager.employee.id);
      managedIds.push(currentManager.employee.id);
      if (!managedIds.includes(employeeId)) {
        return res.status(403).json({ error: 'Managers can only detach their own subordinates' });
      }
    }

    // Detach employee (set managerId to null, set department to 'Unassigned', position to 'Employee')
    const updatedEmployee = await prisma.employee.update({
      where: { id: employeeId },
      data: { managerId: null, department: 'Unassigned', position: 'Employee' },
    });

    res.json({ employee: updatedEmployee });
  } catch (error) {
    console.error('Detach employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as employeeRoutes };