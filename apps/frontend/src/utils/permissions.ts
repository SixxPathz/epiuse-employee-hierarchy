// Basic permissions system for EPI-USE Employee Management

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
      return {
        canViewEmployees: true,
        canCreateEmployees: false,  // Managers can only edit and view, not add
        canEditEmployees: true,
        canDeleteEmployees: false,
        canViewManagers: true,
        canAssignManagers: false,
        canViewSalaries: true,
        canExportData: true,
        canManageRoles: false,
        canViewReports: true,
      };

    case 'EMPLOYEE':
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