import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { getUserPermissions } from '../utils/permissions';
import { TableSkeleton, SearchSkeleton } from './Skeletons';
import { VirtualEmployeeTable } from './VirtualEmployeeTable';
import {
  useEmployees,
  useManagers,
  useAddEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  usePrefetchEmployee,
} from '../hooks/useEmployees';
import { normalizeDept, getDepartments } from '../utils/departments';
import { isManager, isCEO, getManagers } from '../utils/roles';
import { addEmployeeSchema, handleApiError } from '../utils/validation';
import type { EmployeeFormData as AddEmployeeFormData, User } from '../types';
import type { Employee } from '../types';


interface EmployeeTableProps {
  user?: User;
}

export default function EmployeeTable({ user }: EmployeeTableProps) {
  // State hooks
  const [addType, setAddType] = useState<'employee' | 'manager'>('employee');
  const [customDepartment, setCustomDepartment] = useState('');
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchEmployeeNumber, setSearchEmployeeNumber] = useState('');
  // Removed searchPosition state (search by position is deprecated)
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDepartmentForAdd, setSelectedDepartmentForAdd] = useState(''); // Track department in add form
  const [sortBy, setSortBy] = useState('firstName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchParams, setSearchParams] = useState({});


  // Pagination state
  const [page, setPage] = useState(1);

  // Data hooks
  const {
    data: employeesData,
    isLoading,
    error,
  } = useEmployees({
    page,
    limit: 20,
    ...searchParams,
    sortBy,
    sortOrder,
  });

  const { data: managersData, isLoading: managersLoading } = useManagers();


  // Employees and managers
  const allEmployees: Employee[] = employeesData?.employees || [];
  const filteredEmployees: Employee[] = allEmployees.filter((employee: Employee) => {
    if (user?.role === 'MANAGER' && user?.employee?.id === employee.id) {
      return false;
    }
    if ((user?.role === 'EMPLOYEE' || user?.role === 'MANAGER') && !employee.managerId) {
      return false;
    }
    return true;
  });

  // Memoized department-to-manager map for fast lookup
  const departmentManagerMap = useMemo(() => {
    const map = new Map<string, Employee>();
    getManagers(allEmployees).forEach(emp => {
      if (emp.department) {
        map.set(normalizeDept(emp.department), emp);
      }
    });
    return map;
  }, [allEmployees]);

  const departments = getDepartments(allEmployees);
  const departmentsWithManagers = new Set<string>(Array.from(departmentManagerMap.keys()));
  const availableDepartmentsForManager = departments.filter(dep => !departmentsWithManagers.has(dep));
  const isDuplicateDepartment = customDepartment && departments.includes(normalizeDept(customDepartment));

  // Managers in selected department for add form
  const managersInSelectedDepartment = (managersData?.employees || []).filter(
    (mgr: Employee) => normalizeDept(mgr.department) === normalizeDept(selectedDepartmentForAdd || '')
  );
  const noManagersExist = (managersData?.employees || []).length === 0;
  
  // CEO from all managers
  const ceoEmployee = (managersData?.employees || []).find(isCEO);

  // Get user permissions
  const permissions = getUserPermissions(user?.role || 'EMPLOYEE');

  // Helper function to determine if current user can view specific employee's salary
  const canViewEmployeeSalary = (employee: Employee): boolean => {
    if (!permissions.canViewSalaries) return false;
    if (user?.role === 'ADMIN') return true;
    if (user?.role === 'MANAGER') {
      if (employee.id === user.employee?.id) return true;
      const isSubordinate = (emp: Employee, managerId: string): boolean => {
        if (!emp.manager) return false;
        if (emp.manager.id === managerId) return true;
        // Type guard: emp.manager is Employee
        return isSubordinate(emp.manager as Employee, managerId);
      };
      return user.employee?.id ? isSubordinate(employee, user.employee.id) : false;
    }
    return false;
  };

  // Mutations
  const addEmployeeMutation = useAddEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
  const prefetchEmployee = usePrefetchEmployee();

  // Forms
  const {
  register,
  handleSubmit,
  reset,
  setValue,
  getValues,
  formState: { errors, isSubmitting },
  } = useForm<AddEmployeeFormData>({
    resolver: yupResolver(addEmployeeSchema),
    defaultValues: {
      department: user?.role === 'MANAGER' ? user.employee?.department : '',
      managerId: user?.role === 'MANAGER' ? user.employee?.id : '',
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<AddEmployeeFormData>({
    resolver: yupResolver(addEmployeeSchema),
  });

  // Helper function to format department names for display
  const formatDepartmentName = (dept: string): string => {
    // Display normalized department names in readable format
    return dept
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // Effect to prepopulate edit form when editingEmployee changes
  useEffect(() => {
    if (editingEmployee && showEditModal) {
      resetEdit({
        firstName: editingEmployee.firstName,
        lastName: editingEmployee.lastName,
        email: editingEmployee.email,
        employeeNumber: editingEmployee.employeeNumber,
        position: editingEmployee.position,
        department: editingEmployee.department,
        salary: editingEmployee.salary,
        birthDate: editingEmployee.birthDate ? new Date(editingEmployee.birthDate).toISOString().split('T')[0] : '',
        managerId: editingEmployee.managerId || '',
      });
    }
  }, [editingEmployee, showEditModal, resetEdit]);

  // Handle search button click
  const handleSearch = () => {
    setSearchParams({
      name: searchName || undefined,
      employeeNumber: searchEmployeeNumber || undefined,
      department: selectedDepartment || undefined,
    });
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchName('');
    setSearchEmployeeNumber('');
    setSelectedDepartment('');
    setSearchParams({});
  };

  // Clear department filter for non-admin users
  useEffect(() => {
    if (user?.role !== 'ADMIN' && selectedDepartment) {
      setSelectedDepartment('');
    }
  }, [user?.role, selectedDepartment]);
  // ...existing code up to the end of the main function...
  // Render block (restored)
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.role === 'ADMIN' ? 'Employees' : 'TeamSpace'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">Loading employee data...</p>
          </div>
        </div>
        <SearchSkeleton />
        <TableSkeleton rows={8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="text-red-500">
              <div className="text-xl font-medium mb-2">Error loading employees</div>
              <div className="text-sm">Please try refreshing the page</div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  const employees = filteredEmployees;
  const pagination = employeesData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {user?.role === 'ADMIN' ? 'Employees' : 'TeamSpace'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {user?.role === 'ADMIN' && 'Full administrative access: Create, view, edit, and delete all employees'}
            {user?.role === 'MANAGER' && 'Team management: View and edit your team members'}
            {user?.role === 'EMPLOYEE' && 'Team directory: Connect with your colleagues and team members'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          {permissions.canCreateEmployees && (
            <div className="flex flex-row space-x-3">
              <button 
                onClick={() => { setShowAddModal(true); setAddType('employee'); }}
                className="btn-primary inline-flex items-center space-x-2"
                disabled={departments.length === 0 || isLoading || !permissions.canCreateEmployees}
                title={departments.length === 0 ? 'No departments available' : undefined}
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Employee</span>
              </button>
              {/* Both ADMINs and MANAGERs can now add managers/sub-managers */}
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <button
                  onClick={() => { setShowAddModal(true); setAddType('manager'); }}
                  className="btn-secondary inline-flex items-center space-x-2"
                  disabled={isLoading || !permissions.canCreateEmployees}
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>{user?.role === 'ADMIN' ? 'Add Manager' : 'Add Sub-Manager'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="card mb-2">
        <div className="card-body flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              className="input-field"
              placeholder="Search by name..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
            <input
              type="text"
              className="input-field"
              placeholder="Employee number..."
              value={searchEmployeeNumber}
              onChange={e => setSearchEmployeeNumber(e.target.value)}
            />
            <select
              className="input-field"
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{formatDepartmentName(dep)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2 mt-2 md:mt-0">
            <button
              onClick={handleSearch}
              className="btn-primary inline-flex items-center justify-center space-x-2"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              <span>Search</span>
            </button>
            <button
              onClick={handleClearSearch}
              className="btn-secondary inline-flex items-center justify-center space-x-2"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>


      {/* Employee Table */}
      <VirtualEmployeeTable
        employees={employees}
        user={user}
        onEdit={emp => {
          prefetchEmployee(emp.id);
          setEditingEmployee(emp);
          setShowEditModal(true);
        }}
        onDelete={empId => {
          if (window.confirm('Are you sure you want to delete this employee?')) {
            deleteEmployeeMutation.mutateAsync(empId).then(() => {
              toast.success('Employee deleted successfully!');
            }).catch(err => {
              toast.error('Failed to delete employee');
            });
          }
        }}
      />

      {/* Pagination Controls */}
      {pagination && (
        <div className="flex justify-center items-center space-x-4 mt-4">
          <button
            className="btn-outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            className="btn-outline"
            disabled={!pagination.hasNextPage}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Add/Edit Modals (simplified, can be expanded) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{addType === 'manager' ? 'Add New Manager' : 'Add New Employee'}</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedDepartmentForAdd('');
                  reset({
                    department: user?.role === 'MANAGER' ? user.employee?.department : '',
                    managerId: user?.role === 'MANAGER' ? user.employee?.id : '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(data => {
              let payload = { ...data };
              
              // If adding a manager/sub-manager
              if (addType === 'manager') {
                // If managerId is explicitly provided (from form), use it
                // Otherwise, auto-assign based on user role
                if (!payload.managerId) {
                  if (user?.role === 'MANAGER' && user.employee?.id) {
                    // Managers add sub-managers under themselves
                    payload.managerId = user.employee.id;
                    payload.department = user.employee.department;
                  } else if (user?.role === 'ADMIN' && managersData?.employees) {
                    // Admins can assign to CEO or leave undefined for new top-level managers
                    const ceo = managersData.employees.find(isCEO);
                    payload.managerId = ceo ? ceo.id : undefined;
                  }
                }
              }
              
              // If adding an employee, auto-assign managerId
              if (addType === 'employee') {
                let dept = normalizeDept(payload.department);
                if (user?.role === 'MANAGER' && user.employee?.id) {
                  payload.managerId = user.employee.id;
                  payload.department = user.employee.department;
                  dept = normalizeDept(user.employee.department);
                } else if (user?.role === 'ADMIN') {
                  const deptManager = departmentManagerMap.get(dept);
                  if (deptManager) {
                    payload.managerId = deptManager.id;
                  }
                }
                // Prevent adding employee if no manager exists for department
                if (!payload.managerId) {
                  toast.error('No manager exists for the selected department. Please add a manager first.');
                  return;
                }
              }
              
              addEmployeeMutation.mutateAsync(payload).then(() => {
                toast.success(`${addType === 'manager' ? 'Manager' : 'Employee'} added successfully!`);
                setShowAddModal(false);
                reset();
              }).catch(err => {
                toast.error(handleApiError(err, `Failed to add ${addType}`));
              });
            })} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input {...register('firstName')} type="text" className={`input-field ${errors.firstName ? 'border-red-300' : ''}`} placeholder="Enter first name" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input {...register('lastName')} type="text" className={`input-field ${errors.lastName ? 'border-red-300' : ''}`} placeholder="Enter last name" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input {...register('email')} type="email" className={`input-field ${errors.email ? 'border-red-300' : ''}`} placeholder="Enter email address" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Number</label>
                  <input {...register('employeeNumber')} type="text" className={`input-field ${errors.employeeNumber ? 'border-red-300' : ''}`} placeholder="e.g., EMP-021" />
                  {errors.employeeNumber && <p className="text-red-500 text-xs mt-1">{errors.employeeNumber.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input {...register('position')} type="text" className={`input-field ${errors.position ? 'border-red-300' : ''}`} placeholder="Enter job position" />
                  {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  {addType === 'manager' && user?.role === 'MANAGER' ? (
                    <input type="text" className="input-field bg-gray-100" value={formatDepartmentName(normalizeDept(user.employee?.department || ''))} disabled {...register('department')} />
                  ) : addType === 'manager' && user?.role === 'ADMIN' ? (
                    <>
                      <input {...register('department', {
                        setValueAs: v => normalizeDept(v)
                      })} type="text" className={`input-field ${errors.department ? 'border-red-300' : ''}`} placeholder="Enter new department" />
                      {isDuplicateDepartment ? (
                        <p className="text-red-500 text-xs mt-1">Department already exists (case-insensitive).</p>
                      ) : null}
                    </>
                  ) : user?.role === 'MANAGER' ? (
                    <input type="text" className="input-field bg-gray-100" value={formatDepartmentName(normalizeDept(user.employee?.department || ''))} disabled {...register('department')} />
                  ) : (
                    <select {...register('department', {
                      setValueAs: v => normalizeDept(v),
                      onChange: (e) => {
                        setSelectedDepartmentForAdd(e.target.value);
                      }
                    })} className={`input-field ${errors.department ? 'border-red-300' : ''}`} onChange={(e) => setSelectedDepartmentForAdd(e.target.value)}> 
                      <option value="">Select Department</option>
                      {departments.map(dep => (
                        <option key={dep} value={dep}>{formatDepartmentName(dep)}</option>
                      ))}
                    </select>
                  )}
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                  <input {...register('salary')} type="number" min="0" step="1" className={`input-field ${errors.salary ? 'border-red-300' : ''}`} placeholder="Enter annual salary" />
                  {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                  <input {...register('birthDate')} type="date" className={`input-field ${errors.birthDate ? 'border-red-300' : ''}`} />
                  {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate.message}</p>}
                </div>
              </div>
              
              {/* Manager selection for adding employees as admin */}
              {addType === 'employee' && user?.role === 'ADMIN' && selectedDepartmentForAdd && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Manager
                  </label>
                  {managersInSelectedDepartment.length > 0 ? (
                    <select {...register('managerId')} className="input-field">
                      <option value="">Select a manager in {formatDepartmentName(selectedDepartmentForAdd)}</option>
                      {managersInSelectedDepartment.map((manager: Employee) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.firstName} {manager.lastName} - {manager.position}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-yellow-800">
                        No managers found in {formatDepartmentName(selectedDepartmentForAdd)}. Please add a manager to this department first.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Manager selection for new managers (optional for admins, auto-assigned for managers) */}
              {addType === 'manager' && user?.role === 'ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reports To
                  </label>
                  <select {...register('managerId')} className="input-field">
                    <option value="">{ceoEmployee ? 'Select who this manager reports to' : 'No Manager (Top Level)'}</option>
                    {ceoEmployee && (
                      <option key={ceoEmployee.id} value={ceoEmployee.id}>
                        {ceoEmployee.firstName} {ceoEmployee.lastName} - {ceoEmployee.position} (CEO)
                      </option>
                    )}
                    {managersData?.employees?.filter((m: Employee) => !isCEO(m)).map((manager: Employee) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName} - {manager.position}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {ceoEmployee 
                      ? 'Select CEO for department head, or another manager for a sub-manager role'
                      : 'Leave empty to create the first top-level manager (CEO)'}
                  </p>
                </div>
              )}
              {addType === 'manager' && user?.role === 'MANAGER' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> This sub-manager will report to you and work in your department ({formatDepartmentName(user.employee?.department || '')}).
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedDepartmentForAdd('');
                    reset();
                  }}
                  className="btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={addEmployeeMutation.isPending}
                >
                  {addEmployeeMutation.isPending ? (addType === 'manager' ? 'Adding Manager...' : 'Adding...') : (addType === 'manager' ? 'Add Manager' : 'Add Employee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Employee</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEmployee(null);
                  resetEdit();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit(data => {
              updateEmployeeMutation.mutateAsync({ ...data, id: editingEmployee.id }).then(() => {
                toast.success('Employee updated successfully!');
                setShowEditModal(false);
                setEditingEmployee(null);
                resetEdit();
              }).catch(err => {
                toast.error('Failed to update employee');
              });
            })} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input {...registerEdit('firstName')} type="text" className={`input-field ${editErrors.firstName ? 'border-red-300' : ''}`} placeholder="Enter first name" />
                  {editErrors.firstName && <p className="text-red-500 text-xs mt-1">{editErrors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input {...registerEdit('lastName')} type="text" className={`input-field ${editErrors.lastName ? 'border-red-300' : ''}`} placeholder="Enter last name" />
                  {editErrors.lastName && <p className="text-red-500 text-xs mt-1">{editErrors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input {...registerEdit('email')} type="email" className={`input-field ${editErrors.email ? 'border-red-300' : ''}`} placeholder="Enter email address" />
                  {editErrors.email && <p className="text-red-500 text-xs mt-1">{editErrors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Number</label>
                  <input {...registerEdit('employeeNumber')} type="text" className={`input-field ${editErrors.employeeNumber ? 'border-red-300' : ''}`} placeholder="e.g., EMP-021" />
                  {editErrors.employeeNumber && <p className="text-red-500 text-xs mt-1">{editErrors.employeeNumber.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input {...registerEdit('position')} type="text" className={`input-field ${editErrors.position ? 'border-red-300' : ''}`} placeholder="Enter job position" />
                  {editErrors.position && <p className="text-red-500 text-xs mt-1">{editErrors.position.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select {...registerEdit('department')} className={`input-field ${editErrors.department ? 'border-red-300' : ''}`}> 
                    <option value="">Select Department</option>
                    {departments.map(dep => (
                      <option key={dep} value={dep}>{formatDepartmentName(dep)}</option>
                    ))}
                  </select>
                  {editErrors.department && <p className="text-red-500 text-xs mt-1">{editErrors.department.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                  <input {...registerEdit('salary')} type="number" min="0" step="1" className={`input-field ${editErrors.salary ? 'border-red-300' : ''}`} placeholder="Enter annual salary" />
                  {editErrors.salary && <p className="text-red-500 text-xs mt-1">{editErrors.salary.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                  <input {...registerEdit('birthDate')} type="date" className={`input-field ${editErrors.birthDate ? 'border-red-300' : ''}`} />
                  {editErrors.birthDate && <p className="text-red-500 text-xs mt-1">{editErrors.birthDate.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager (Optional)</label>
                <select {...registerEdit('managerId')} className="input-field">
                  <option value="">Select a manager</option>
                  {managersData?.employees?.map((manager: Employee) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName} - {manager.position}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEmployee(null);
                    resetEdit();
                  }}
                  className="btn-outline"
                  disabled={isEditSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updateEmployeeMutation.isPending}
                >
                  {updateEmployeeMutation.isPending ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}