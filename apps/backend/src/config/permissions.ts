// PROFESSIONAL MANAGEMENT SYSTEM: Centralized permissions configuration
// Basic company role structure for EPI-USE

export interface UserPermissions {
  canViewEmployees: boolean;
  canCreateEmployees: boolean;
  canEditEmployees: boolean;
  canDeleteEmployees: boolean;
  canViewManagers: boolean;
  canAssignManagers: boolean;
  canViewSalaries: boolean;
  canExportData: boolean;
  canManageRoles: boolean;
  canViewReports: boolean;
}

export function getUserPermissions(role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'): UserPermissions {
  switch (role) {
    case 'ADMIN':
      // ADMIN: System administrators - Full access
      return {
        canViewEmployees: true,
        canCreateEmployees: true,
        canEditEmployees: true,
        canDeleteEmployees: true,
        canViewManagers: true,
        canAssignManagers: true,
        canViewSalaries: true,
        canExportData: true,
        canManageRoles: true,
        canViewReports: true,
      };

    case 'MANAGER':
      // MANAGER: Department heads, team leads - Team management permissions
      return {
        canViewEmployees: true,
        canCreateEmployees: true,
        canEditEmployees: true,
        canDeleteEmployees: true, // Managers can now delete employees in their department
        canViewManagers: true,
        canAssignManagers: false,
        canViewSalaries: true,
        canExportData: true,
        canManageRoles: false,
        canViewReports: true,
      };

    case 'EMPLOYEE':
      // EMPLOYEE: Standard employees - Basic permissions
      return {
        canViewEmployees: true,
        canCreateEmployees: false,
        canEditEmployees: false,
        canDeleteEmployees: false,
        canViewManagers: true,
        canAssignManagers: false,
        canViewSalaries: false,
        canExportData: false,
        canManageRoles: false,
        canViewReports: false,
      };

    default:
      // Safest default - no permissions
      return {
        canViewEmployees: false,
        canCreateEmployees: false,
        canEditEmployees: false,
        canDeleteEmployees: false,
        canViewManagers: false,
        canAssignManagers: false,
        canViewSalaries: false,
        canExportData: false,
        canManageRoles: false,
        canViewReports: false,
      };
  }
}

export function checkPermission(userRole: string, action: keyof UserPermissions): boolean {
  const permissions = getUserPermissions(userRole as 'ADMIN' | 'MANAGER' | 'EMPLOYEE');
  return permissions[action];
}