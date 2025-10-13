import React, { useMemo } from 'react';
import { Employee, User } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { getUserPermissions } from '../utils/permissions';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ProfileImage from './ProfileImage';

interface VirtualEmployeeTableProps {
  employees: Employee[];
  user?: User;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  height?: number;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadMore?: () => void;
}

interface EmployeeRowProps {
  employee: Employee;
  user?: User;
  permissions: any;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  canViewEmployeeSalary: (employee: Employee) => boolean;
  formatDepartmentName: (dept: string) => string;
  index: number;
}

const EmployeeRow: React.FC<EmployeeRowProps> = ({
  employee,
  user,
  permissions,
  onEdit,
  onDelete,
  canViewEmployeeSalary,
  formatDepartmentName,
  index,
}) => {
  return (
    <div
      className={`flex items-center border-b border-gray-200 hover:bg-gray-50 px-6 py-4 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      }`}
      style={{ height: '80px' }}
    >
      {/* Employee Info */}
      <div className="flex-1 flex items-center min-w-0">
        <div className="flex-shrink-0 h-10 w-10">
          <ProfileImage
            user={{ email: employee.email, employee: employee }}
            size={40}
            className="h-10 w-10 rounded-full object-cover"
            alt={`${employee.firstName} ${employee.lastName}`}
          />
        </div>
        <div className="ml-4 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {employee.firstName} {employee.lastName}
          </div>
          <div className="text-sm text-gray-500 truncate">{employee.email}</div>
          <div className="text-xs text-gray-400">#{employee.employeeNumber}</div>
        </div>
      </div>

      {/* Position */}
      <div className="flex-1 px-6">
        <div className="text-sm text-gray-900 truncate">{employee.position}</div>
      </div>

      {/* Department */}
      <div className="flex-1 px-6">
        <div className="text-sm text-gray-900 truncate capitalize">
          {formatDepartmentName(employee.department || '')}
        </div>
      </div>

      {/* Salary */}
      {permissions.canViewSalaries && (
        <div className="flex-1 px-6">
          <div className="text-sm text-gray-900">
            {canViewEmployeeSalary(employee) 
              ? formatCurrency(employee.salary) 
              : '•••••••'
            }
          </div>
        </div>
      )}

      {/* Manager */}
      <div className="flex-1 px-6">
        {employee.manager ? (
          <div className="text-sm text-gray-900 truncate">
            {employee.manager.firstName} {employee.manager.lastName}
          </div>
        ) : (
          <span className="text-sm text-gray-500">No manager</span>
        )}
      </div>

      {/* Joined Date */}
      <div className="flex-1 px-6">
        <div className="text-sm text-gray-500">
          {formatDate(employee.createdAt)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center space-x-2 px-6">
        {permissions.canEditEmployees && (
          <button 
            onClick={() => onEdit(employee)}
            className="text-company-navy hover:text-company-navy-dark"
            title="Edit Employee"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        )}
        {permissions.canDeleteEmployees && (
          <button
            onClick={() => onDelete(employee.id)}
            className="text-red-600 hover:text-red-900"
            title="Delete Employee"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        )}
        {!permissions.canEditEmployees && !permissions.canDeleteEmployees && (
          <span className="text-gray-400 text-xs">View Only</span>
        )}
      </div>
    </div>
  );
};

export const VirtualEmployeeTable: React.FC<VirtualEmployeeTableProps> = ({
  employees,
  user,
  onEdit,
  onDelete,
  height = 600,
  hasMore,
  isLoadingMore,
  loadMore,
}) => {
  const permissions = getUserPermissions(user?.role || 'EMPLOYEE');

  // Helper function to format department names for display
  const formatDepartmentName = (dept: string): string => {
    return dept
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to determine if current user can view specific employee's salary
  const canViewEmployeeSalary = (employee: Employee) => {
    if (!permissions.canViewSalaries) return false;
    if (user?.role === 'ADMIN') return true;
    
    if (user?.role === 'MANAGER') {
      // Managers can only view their own salary and subordinates' salaries
      if (employee.id === user.employee?.id) return true; // Own salary
      
      // Check if this employee reports to the current manager (direct or indirect subordinate)
      const isSubordinate = (emp: Employee, managerId: string): boolean => {
        if (!emp.manager) return false;
        if (emp.manager.id === managerId) return true;
        return isSubordinate(emp.manager as any, managerId);
      };
      
      return user.employee?.id ? isSubordinate(employee, user.employee.id) : false;
    }
    
    return false; // Employees can't see any salaries
  };

  if (employees.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-12">
          <div className="text-gray-500">
            <div className="text-xl font-medium mb-2">No employees found</div>
            <div className="text-sm">Try adjusting your search criteria</div>
          </div>
        </div>
      </div>
    );
  }

  // Simple virtual scrolling: render what we have; parent handles fetching more
  const visibleEmployees = employees;

  return (
    <div className="card">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="flex-1">Employee</div>
          <div className="flex-1 px-6">Position</div>
          <div className="flex-1 px-6">Department</div>
          {permissions.canViewSalaries && (
            <div className="flex-1 px-6">Salary</div>
          )}
          <div className="flex-1 px-6">Manager</div>
          <div className="flex-1 px-6">Joined</div>
          <div className="flex-shrink-0 px-6">Actions</div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        style={{ height: height, overflow: 'auto' }}
        className="divide-y divide-gray-200"
        onScroll={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 200;
          if (nearBottom && hasMore && !isLoadingMore) {
            loadMore && loadMore();
          }
        }}
      >
        {visibleEmployees.map((employee, index) => (
          <EmployeeRow
            key={employee.id}
            employee={employee}
            user={user}
            permissions={permissions}
            onEdit={onEdit}
            onDelete={onDelete}
            canViewEmployeeSalary={canViewEmployeeSalary}
            formatDepartmentName={formatDepartmentName}
            index={index}
          />
        ))}
        
        {hasMore && (
          <div className="px-6 py-4 text-center text-gray-500">
            <div className="text-sm">{isLoadingMore ? 'Loading more…' : 'Scroll to load more'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualEmployeeTable;