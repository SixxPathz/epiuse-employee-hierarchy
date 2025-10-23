// Shared validation schema and error handler
import * as yup from 'yup';

export const addEmployeeSchema = yup.object({
  firstName: yup.string()
    .transform((value) => value?.trim())
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .test('no-numbers', 'First name cannot contain numbers', (value) => !/\d/.test(value || '')),
  lastName: yup.string()
    .transform((value) => value?.trim())
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .test('no-numbers', 'Last name cannot contain numbers', (value) => !/\d/.test(value || '')),
  email: yup.string()
    .transform((value) => value?.trim().toLowerCase())
    .email('Invalid email address')
    .required('Email is required'),
  employeeNumber: yup.string()
    .transform((value) => value?.trim().toUpperCase())
    .matches(/^EMP-\d{3,5}$/i, 'Employee number must be in format EMP-XXX (e.g., EMP-001)')
    .required('Employee number is required'),
  position: yup.string()
    .transform((value) => value?.trim())
    .required('Position is required')
    .min(2, 'Position must be at least 2 characters')
    .max(100, 'Position must not exceed 100 characters'),
  department: yup.string()
    .transform((value) => value?.trim().toLowerCase().replace(/\s+/g, '-'))
    .matches(/^[a-z0-9-]{2,30}$/i, 'Department name must be 2-30 characters, letters/numbers/hyphens only')
    .required('Department is required'),
  salary: yup.number()
    .typeError('Salary must be a valid number')
    .positive('Salary must be a positive number')
    .min(1, 'Salary must be at least 1')
    .max(100000000, 'Salary seems unreasonably high. Please verify.')
    .required('Salary is required'),
  birthDate: yup.string()
    .required('Birth date is required')
    .test('is-valid-date', 'Please enter a valid date', (value) => {
      if (!value) return false;
      const date = new Date(value);
      return date instanceof Date && !isNaN(date.getTime());
    })
    .test('is-adult', 'Employee must be at least 18 years old', (value) => {
      if (!value) return false;
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
    })
    .test('not-future', 'Birth date cannot be in the future', (value) => {
      if (!value) return false;
      return new Date(value) <= new Date();
    }),
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