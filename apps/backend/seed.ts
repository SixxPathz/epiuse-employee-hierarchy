import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create CEO
  const hashedPassword = await bcrypt.hash('securepassword123', 10);
  
  const ceoUser = await prisma.user.upsert({
    where: { email: 'thabo.mthembu@epiuse.com' },
    update: {},
    create: {
      email: 'thabo.mthembu@epiuse.com',
      password: hashedPassword,
      role: 'ADMIN',
      mustChangePassword: false, // Seeded users don't need to change password
    },
  });

  const ceo = await prisma.employee.upsert({
    where: { employeeNumber: 'EMP-001' },
    update: {},
    create: {
      employeeNumber: 'EMP-001',
      firstName: 'Thabo',
      lastName: 'Mthembu',
      email: 'thabo.mthembu@epiuse.com',
      position: 'Chief Executive Officer',
      department: 'management',
      salary: 4500000, // R4.5M per year
      birthDate: new Date('1975-05-15'),
    },
  });

  // Create department heads
  const departments = [
    { name: 'Technology', head: 'Sipho Ngcobo', email: 'sipho.ngcobo@epiuse.com', id: 'EMP-002', dept: 'technology' },
    { name: 'Human Resources', head: 'Nomsa Dlamini', email: 'nomsa.dlamini@epiuse.com', id: 'EMP-003', dept: 'human-resources' },
    { name: 'Sales', head: 'Andre van der Merwe', email: 'andre.vandermerwe@epiuse.com', id: 'EMP-004', dept: 'sales' },
    { name: 'Marketing', head: 'Lerato Molefe', email: 'lerato.molefe@epiuse.com', id: 'EMP-005', dept: 'marketing' },
  ];

  const deptHeads = [];
  for (const dept of departments) {
    const user = await prisma.user.upsert({
      where: { email: dept.email },
      update: {},
      create: {
        email: dept.email,
        password: hashedPassword,
        role: 'MANAGER',
        mustChangePassword: false, // Seeded users don't need to change password
      },
    });

    const employee = await prisma.employee.upsert({
      where: { employeeNumber: dept.id },
      update: {},
      create: {
        employeeNumber: dept.id,
        firstName: dept.head.split(' ')[0],
        lastName: dept.head.split(' ').slice(1).join(' '), // Handle names like "van der Merwe"
        email: dept.email,
        position: `Head of ${dept.name}`,
        department: dept.dept,
        salary: 2100000, // R2.1M per year
        birthDate: new Date('1980-03-01'),
        managerId: ceo.id,
      },
    });
    deptHeads.push(employee);
  }

  // Create team members
  const teamMembers = [
    { firstName: 'Kagiso', lastName: 'Morake', dept: 'technology', position: 'Senior Software Engineer', manager: deptHeads[0], id: 'EMP-006' },
    { firstName: 'Zanele', lastName: 'Khumalo', dept: 'technology', position: 'Frontend Developer', manager: deptHeads[0], id: 'EMP-007' },
    { firstName: 'Pieter', lastName: 'Botha', dept: 'technology', position: 'DevOps Engineer', manager: deptHeads[0], id: 'EMP-008' },
    { firstName: 'Thandiwe', lastName: 'Zulu', dept: 'human-resources', position: 'HR Specialist', manager: deptHeads[1], id: 'EMP-009' },
    { firstName: 'Johann', lastName: 'Steyn', dept: 'human-resources', position: 'Recruiter', manager: deptHeads[1], id: 'EMP-010' },
    { firstName: 'Amahle', lastName: 'Nkomo', dept: 'sales', position: 'Sales Representative', manager: deptHeads[2], id: 'EMP-011' },
    { firstName: 'Riaan', lastName: 'de Villiers', dept: 'sales', position: 'Account Manager', manager: deptHeads[2], id: 'EMP-012' },
    { firstName: 'Busisiwe', lastName: 'Mahlangu', dept: 'sales', position: 'Sales Coordinator', manager: deptHeads[2], id: 'EMP-013' },
    { firstName: 'Keegan', lastName: 'Williams', dept: 'marketing', position: 'Digital Marketing Specialist', manager: deptHeads[3], id: 'EMP-014' },
    { firstName: 'Naledi', lastName: 'Motsepe', dept: 'marketing', position: 'Content Creator', manager: deptHeads[3], id: 'EMP-015' },
  ];

  for (const member of teamMembers) {
    const user = await prisma.user.upsert({
      where: { email: `${member.firstName.toLowerCase()}.${member.lastName.toLowerCase()}@epiuse.com` },
      update: {},
      create: {
        email: `${member.firstName.toLowerCase()}.${member.lastName.toLowerCase()}@epiuse.com`,
        password: hashedPassword,
        role: 'EMPLOYEE',
        mustChangePassword: false, // Seeded users don't need to change password
      },
    });

    await prisma.employee.upsert({
      where: { employeeNumber: member.id },
      update: {},
      create: {
        employeeNumber: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: `${member.firstName.toLowerCase()}.${member.lastName.toLowerCase()}@epiuse.com`,
        position: member.position,
        department: member.dept,
        salary: Math.floor(Math.random() * 700000) + 800000, // Random salary between R800k-R1.5M
        birthDate: new Date(1990, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        managerId: member.manager.id,
      },
    });
  }

  // Create some junior employees
  const juniorEmployees = [
    { firstName: 'Sandile', lastName: 'Ndaba', dept: 'technology', position: 'Junior Developer', manager: deptHeads[0], id: 'EMP-016' },
    { firstName: 'Aisha', lastName: 'Patel', dept: 'technology', position: 'QA Tester', manager: deptHeads[0], id: 'EMP-017' },
    { firstName: 'Liam', lastName: 'Fourie', dept: 'sales', position: 'Sales Intern', manager: deptHeads[2], id: 'EMP-018' },
    { firstName: 'Nomthandazo', lastName: 'Sithole', dept: 'marketing', position: 'Marketing Assistant', manager: deptHeads[3], id: 'EMP-019' },
    { firstName: 'Ethan', lastName: 'Kruger', dept: 'human-resources', position: 'HR Assistant', manager: deptHeads[1], id: 'EMP-020' },
  ];

  for (const junior of juniorEmployees) {
    const user = await prisma.user.upsert({
      where: { email: `${junior.firstName.toLowerCase()}.${junior.lastName.toLowerCase()}@epiuse.com` },
      update: {},
      create: {
        email: `${junior.firstName.toLowerCase()}.${junior.lastName.toLowerCase()}@epiuse.com`,
        password: hashedPassword,
        role: 'EMPLOYEE',
        mustChangePassword: false, // Seeded users don't need to change password
      },
    });

    await prisma.employee.upsert({
      where: { employeeNumber: junior.id },
      update: {},
      create: {
        employeeNumber: junior.id,
        firstName: junior.firstName,
        lastName: junior.lastName,
        email: `${junior.firstName.toLowerCase()}.${junior.lastName.toLowerCase()}@epiuse.com`,
        position: junior.position,
        department: junior.dept,
        salary: Math.floor(Math.random() * 400000) + 450000, // Random salary between R450k-R850k
        birthDate: new Date(1995, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        managerId: junior.manager.id,
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${await prisma.employee.count()} employees across multiple departments`);
  console.log(`Created ${await prisma.user.count()} user accounts`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });