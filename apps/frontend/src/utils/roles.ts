// Utility for role and position checks
import { Employee } from '../types';

export function isManager(employee: Employee): boolean {
  const pos = employee.position.toLowerCase();
  return pos.includes('manager') || pos.includes('head of') || pos.includes('director');
}

export function isCEO(employee: Employee): boolean {
  return employee.position.toLowerCase().includes('chief executive officer');
}

export function getManagers(employees: Employee[]): Employee[] {
  return employees.filter(isManager);
}

