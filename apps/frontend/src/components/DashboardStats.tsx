import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  UsersIcon,
  BanknotesIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import { getUserPermissions } from '../utils/permissions';
import { User, Employee } from '../types';

interface DashboardStatsProps {
  user?: User;
}

export default function DashboardStats({ user }: DashboardStatsProps) {
  // State for full employee info (for both employee and manager dashboards)
  const [fullEmployee, setFullEmployee] = useState(user?.employee);

  // Fetch full employee info if manager/subordinates are missing
  useEffect(() => {
    async function fetchEmployee() {
      if ((user?.role === 'EMPLOYEE' && user.employee && !user.employee.manager && user.employee.id) ||
          (user?.role === 'MANAGER' && user.employee && (!user.employee.subordinates || user.employee.subordinates.length === 0) && user.employee.id)) {
        try {
          const response = await api.get(`/api/employees/${user.employee.id}`);
          if (response.data?.employee) {
            setFullEmployee(response.data.employee);
          }
        } catch (err) {
          // ignore
        }
      }
    }
    fetchEmployee();
  }, [user]);
  // Get user permissions
  const permissions = getUserPermissions(user?.role || 'EMPLOYEE');

  // Helper function to format department names
  const formatDepartmentName = (dept: string): string => {
    return dept
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const { data: insights, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/api/employees/stats/dashboard');
      return response.data;
    },
  });

  // Quick actions for admin
  const adminQuickActions = [
    { label: 'Add Employee', action: () => {
      // Navigate to employees page and open add modal
      window.location.href = '/employees?add=1';
    } },
    { label: 'Export Data', action: () => {
      window.location.href = '/settings?export=1';
    } },
  ];

  // Calculate all reports (direct + indirect) for manager
  const calculateIndirectReports = (employee: any): Employee[] => {
    if (!employee?.subordinates || employee.subordinates.length === 0) return [];
    
    let allIndirect: Employee[] = [];
    employee.subordinates.forEach((sub: any) => {
      if (sub.subordinates && sub.subordinates.length > 0) {
        allIndirect.push(...sub.subordinates);
        allIndirect.push(...calculateIndirectReports(sub));
      }
    });
    
    return allIndirect;
  };
  
  // Get direct reports for manager
  const directReports = user?.role === 'MANAGER' && fullEmployee?.subordinates ? fullEmployee.subordinates : [];
  const indirectReports = user?.role === 'MANAGER' && fullEmployee ? calculateIndirectReports(fullEmployee) : [];
  const totalTeamSize = directReports.length + indirectReports.length;

  // Personal info for employee
  const personalInfo = user?.role === 'EMPLOYEE' && fullEmployee ? [
    { label: 'Position', value: fullEmployee.position },
    { label: 'Manager', value: fullEmployee.manager && fullEmployee.manager.firstName ? `${fullEmployee.manager.firstName} ${fullEmployee.manager.lastName}` : (fullEmployee.managerId ? 'Manager Assigned' : 'N/A') },
    { label: 'Salary', value: fullEmployee.salary ? formatCurrency(fullEmployee.salary) : 'N/A' },
  ] : [];

  // Role-specific stats configuration
  const getStatsForRole = () => {
    const baseStats = [
      {
        name: 'Total Employees',
        value: insights?.totalEmployees || 0,
        icon: UsersIcon,
        color: 'text-company-navy',
        bgColor: 'bg-gray-50',
      },
    ];

    if (user?.role === 'ADMIN') {
      // Admin sees full organizational overview
      return [
        ...baseStats,
        ...(permissions.canViewSalaries ? [{
          name: 'Average Salary',
          value: insights?.avgSalaryByPosition?.length 
            ? formatCurrency(insights.avgSalaryByPosition[0]._avg.salary)
            : formatCurrency(0),
          icon: BanknotesIcon,
          color: 'text-company-red',
          bgColor: 'bg-gray-50',
        }] : []),
        {
          name: 'Total Managers',
          value: insights?.managementRatio?.totalManagers || 0,
          icon: UserGroupIcon,
          color: 'text-company-navy',
          bgColor: 'bg-gray-50',
        },
        {
          name: 'Management Ratio',
          value: insights?.managementRatio?.ratio 
            ? `${insights.managementRatio.ratio.toFixed(1)}%`
            : '0%',
          icon: ChartBarIcon,
          color: 'text-company-red',
          bgColor: 'bg-gray-50',
        },
      ];
    } else if (user?.role === 'MANAGER') {
      // Manager sees team-focused stats
      return [
        {
          name: 'My Department',
          value: user.employee?.department 
            ? formatDepartmentName(user.employee.department)
            : 'N/A',
          icon: BuildingOfficeIcon,
          color: 'text-company-navy',
          bgColor: 'bg-gray-50',
        },
        {
          name: 'Direct Reports',
          value: directReports.length,
          icon: UsersIcon,
          color: 'text-company-navy',
          bgColor: 'bg-gray-50',
        },
        {
          name: 'Indirect Reports',
          value: indirectReports.length,
          icon: UserGroupIcon,
          color: 'text-company-red',
          bgColor: 'bg-gray-50',
        },
        {
          name: 'Total Team Size',
          value: totalTeamSize,
          icon: ChartBarIcon,
          color: 'text-company-navy',
          bgColor: 'bg-gray-50',
        },
      ];
    } else {
      // Employee sees basic company overview
      return [
        ...baseStats,
        {
          name: 'My Department',
          value: user?.employee?.department 
            ? formatDepartmentName(user.employee.department)
            : 'N/A',
          icon: UserGroupIcon,
          color: 'text-company-navy',
          bgColor: 'bg-gray-50',
        },
        {
          name: 'Company Departments',
          value: insights?.departmentDistribution?.length || 0,
          icon: ChartBarIcon,
          color: 'text-company-red',
          bgColor: 'bg-gray-50',
        },
      ];
    }
  };

  const stats = getStatsForRole();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card hover:shadow-medium transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions for Admin */}
      {user?.role === 'ADMIN' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-body flex space-x-4">
            {adminQuickActions.map(action => (
              <button
                key={action.label}
                className="btn btn-primary"
                onClick={action.action}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team Overview for Manager */}
      {user?.role === 'MANAGER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Direct Reports ({directReports.length})</h3>
            </div>
            <div className="card-body max-h-64 overflow-y-auto">
              {directReports.length > 0 ? (
                <ul className="space-y-2">
                  {directReports.map((emp: any) => (
                    <li key={emp.id} className="flex items-center justify-between py-1">
                      <span className="text-sm font-medium">{emp.firstName} {emp.lastName}</span>
                      <span className="text-xs text-gray-500">{emp.position}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500 text-sm">No direct reports</div>
              )}
            </div>
          </div>
          
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Team Summary</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Direct Reports</span>
                  <span className="text-lg font-semibold text-company-navy">{directReports.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Indirect Reports</span>
                  <span className="text-lg font-semibold text-company-navy">{indirectReports.length}</span>
                </div>
                <div className="border-t pt-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Team Size</span>
                  <span className="text-xl font-bold text-company-red">{totalTeamSize}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Personal Info for Employee */}
      {user?.role === 'EMPLOYEE' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Personal Info</h3>
          </div>
          <div className="card-body">
            <ul className="space-y-2">
              {personalInfo.map(info => (
                <li key={info.label} className="flex items-center justify-between">
                  <span>{info.label}</span>
                  <span className="text-xs text-gray-500">{info.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Department Distribution */}
      {insights?.departmentDistribution && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Department Distribution</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {insights.departmentDistribution.map((dept: any, index: number) => (
                <div key={dept.name} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {formatDepartmentName(dept.name)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-company-red h-2 rounded-full"
                        style={{
                          width: `${(dept.count / insights.departmentDistribution.reduce((sum: number, d: any) => sum + d.count, 0)) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{dept.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ...no recent activity card... */}
    </div>
  );
}