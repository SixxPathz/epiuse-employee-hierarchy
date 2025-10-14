// Shared validation schema and error handler
import * as yup from 'yup';

export const addEmployeeSchema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  employeeNumber: yup.string().required('Employee number is required'),
  position: yup.string().required('Position is required'),
  department: yup.string().required('Department is required'),
  salary: yup.number().positive('Salary must be positive').required('Salary is required'),
  birthDate: yup.string().required('Birth date is required'),
  managerId: yup.string().optional(),
});

export function handleApiError(error: any, fallbackMsg = 'Operation failed') {
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return fallbackMsg;
}