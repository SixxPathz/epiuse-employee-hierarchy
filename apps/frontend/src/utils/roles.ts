// Utility for role and position checks
import { Employee } from '../types';

// Note: These functions check if employee HAS subordinates (is a manager in the hierarchy)
// NOT the User's role. An employee with subordinates is functionally a manager.
export function isManager(employee: Employee): boolean {
  // A manager is anyone who has subordinates reporting to them
  return Boolean(employee.subordinates && employee.subordinates.length > 0);
}

export function isCEO(employee: Employee): boolean {
  // CEO is the top of the hierarchy (no manager)
  return !employee.managerId;
}

export function getManagers(employees: Employee[]): Employee[] {
  return employees.filter(isManager);
}

