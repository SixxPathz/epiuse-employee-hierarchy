// Utility for department normalization and extraction
import { Employee } from '../types';

export function normalizeDept(dept: string): string {
  return dept.trim().toLowerCase().replace(/\s+/g, '-');
}

export function getDepartments(employees: Employee[]): string[] {
  const departmentSet = new Set<string>();
  employees.forEach(emp => {
    if (emp.department) departmentSet.add(normalizeDept(emp.department));
  });
  return Array.from(departmentSet);
}