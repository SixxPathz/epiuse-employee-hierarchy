// Shared validation schema and error handler
import * as yup from 'yup';

export const addEmployeeSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string()
    .transform((value) => value.trim().toLowerCase())
    .email('Invalid email').required('Email is required'),
  employeeNumber: yup.string()
    .transform((value) => value.trim().toUpperCase())
    .matches(/^EMP-\d{3,5}$/i, 'Employee number must be in format EMP-XXX')
    .required('Employee number is required'),
  position: yup.string().required('Position is required'),
  department: yup.string()
    .transform((value) => value.trim().toLowerCase().replace(/\s+/g, '-') )
    .matches(/^[a-z0-9-]{2,30}$/i, 'Department name must be 2-30 characters, letters/numbers/hyphens only')
    .required('Department is required'),
  salary: yup.number().positive('Salary must be positive').required('Salary is required'),
  birthDate: yup.string().required('Birth date is required'),
  managerId: yup.string().optional(),
});

// Utility to check for duplicate email or employee number
export function isDuplicateEmployee(newData: { email: string; employeeNumber: string }, employees: Array<{ email: string; employeeNumber: string }>): string | null {
  const normalizedEmail = newData.email.trim().toLowerCase();
  const normalizedEmpNum = newData.employeeNumber.trim().toUpperCase();
  if (employees.some(e => e.email.trim().toLowerCase() === normalizedEmail)) {
    return 'Email already exists.';
  }
  if (employees.some(e => e.employeeNumber.trim().toUpperCase() === normalizedEmpNum)) {
    return 'Employee number already exists.';
  }
  return null;
}

export function handleApiError(error: any, fallbackMsg = 'Operation failed') {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return fallbackMsg;
}