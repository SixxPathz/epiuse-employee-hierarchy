export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  mustChangePassword?: boolean;
  employee?: Employee;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  employeeNumber: string;
  salary: number;
  position: string;
  department: string;
  managerId?: string;
  profilePicture?: string; // Optional custom profile picture URL
  createdAt: string;
  updatedAt: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    email?: string;
  };
  subordinates?: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
    email?: string;
  }[];
}

export interface OrganizationNode {
  id: string;
  name: string;
  position: string;
  email: string;
  salary: number;
  employeeNumber: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  children: OrganizationNode[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  employeeNumber: string;
  salary: number;
  position: string;
  department: string;
  managerId?: string;
}