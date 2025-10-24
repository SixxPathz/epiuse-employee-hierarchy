import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PlusIcon,
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
import { isCEO, getManagers } from '../utils/roles';
import { addEmployeeSchema } from '../utils/validation';
import type { EmployeeFormData as AddEmployeeFormData, User } from '../types';
import type { Employee } from '../types';


interface EmployeeTableProps {
  user?: User;
}

export default function EmployeeTable({ user }: EmployeeTableProps) {
  // State hooks
  const [addType, setAddType] = useState<'employee' | 'manager'>('employee');
  const [searchName, setSearchName] = useState('');
  const [searchEmployeeNumber, setSearchEmployeeNumber] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDepartmentForAdd, setSelectedDepartmentForAdd] = useState(''); // Track department in add form
  const [selectedManagerIdForAdd, setSelectedManagerIdForAdd] = useState(''); // Track selected manager when adding manager
  const [selectedDepartmentForEdit, setSelectedDepartmentForEdit] = useState(''); // Track department in edit form
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

  const { data: managersData } = useManagers();


  // Employees and managers
  const allEmployees: Employee[] = employeesData?.employees || [];
  const filteredEmployees: Employee[] = allEmployees.filter((employee: Employee) => {
    if (user?.role === 'MANAGER' && user?.employee?.id === employee.id) {
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

  // Check for duplicate department names (case-insensitive)
  const isDuplicateDepartment = useMemo(() => {
    if (!selectedDepartmentForAdd) return false;
    const normalizedNewDept = normalizeDept(selectedDepartmentForAdd);
    return departments.some(dept => normalizeDept(dept) === normalizedNewDept);
  }, [selectedDepartmentForAdd, departments]);

  // Managers in selected department for add form
  const managersInSelectedDepartment = (managersData?.employees || []).filter(
    (mgr: Employee) => normalizeDept(mgr.department) === normalizeDept(selectedDepartmentForAdd || '')
  );
  
  // CEO from all managers
  const ceoEmployee = (managersData?.employees || []).find(isCEO);

  // Get user permissions
  const permissions = getUserPermissions(user?.role || 'EMPLOYEE');

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
  formState: { errors, isSubmitting },
  } = useForm<AddEmployeeFormData>({
    resolver: yupResolver(addEmployeeSchema),
    defaultValues: {
      department: user?.role === 'MANAGER' ? normalizeDept(user.employee?.department || '') : '',
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

  // Convert department slugs like 'human-resources' to 'Human Resources'
  // I use this everywhere to make department names readable for users
  const formatDepartmentName = (dept: string): string => {
    return dept
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  // When user clicks edit, populate the form with current employee data
  useEffect(() => {
    if (editingEmployee && showEditModal) {
      setSelectedDepartmentForEdit(editingEmployee.department || '');
      resetEdit({
        firstName: editingEmployee.firstName,
        lastName: editingEmployee.lastName,
        email: editingEmployee.email,
        employeeNumber: editingEmployee.employeeNumber,
        position: editingEmployee.position,
        department: normalizeDept(editingEmployee.department || ''),
        salary: editingEmployee.salary,
        birthDate: editingEmployee.birthDate ? new Date(editingEmployee.birthDate).toISOString().split('T')[0] : '',
        managerId: editingEmployee.managerId || '',
      });
    }
  }, [editingEmployee, showEditModal, resetEdit]);

  // Build search parameters and trigger employee fetch with filters
  const handleSearch = () => {
    setSearchParams({
      name: searchName || undefined,
      employeeNumber: searchEmployeeNumber || undefined,
      department: selectedDepartment || undefined,
    });
  };

  // Reset all search filters and go back to showing everyone
  const handleClearSearch = () => {
    setSearchName('');
    setSearchEmployeeNumber('');
    setSelectedDepartment('');
    setSearchParams({});
  };

  // Toggle between ascending/descending when clicking column headers
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // If clicking the same column, toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a different column, set new column and default to asc
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Managers and employees shouldn't see department filter - only admins can filter by department
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
        <div className="card-body">
          {/* Mobile: Stack vertically */}
          <div className="flex flex-col space-y-3 md:hidden">
            <input
              type="text"
              className="input-field w-full"
              placeholder="Search by name..."
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
            />
            <input
              type="text"
              className="input-field w-full"
              placeholder="Employee number..."
              value={searchEmployeeNumber}
              onChange={e => setSearchEmployeeNumber(e.target.value)}
            />
            <select
              className="input-field w-full"
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{formatDepartmentName(dep)}</option>
              ))}
            </select>
            <div className="flex space-x-2">
              <button
                onClick={handleSearch}
                className="btn-primary flex-1 inline-flex items-center justify-center space-x-2"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Search</span>
              </button>
              <button
                onClick={handleClearSearch}
                className="btn-secondary flex-1 inline-flex items-center justify-center space-x-2"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Desktop: Horizontal layout */}
          <div className="hidden md:flex md:items-center md:space-x-4">
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
            <div className="flex items-center space-x-2">
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
      </div>


      {/* Employee Table */}
      <VirtualEmployeeTable
        employees={employees}
        user={user}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onEdit={emp => {
          prefetchEmployee(emp.id);
          setEditingEmployee(emp);
          setShowEditModal(true);
        }}
        onDelete={empId => {
          const employeeToDelete = employees.find(e => e.id === empId);
          if (!employeeToDelete) return;
          
          const hasSubordinates = employeeToDelete.subordinates && employeeToDelete.subordinates.length > 0;
          const employeeName = `${employeeToDelete.firstName} ${employeeToDelete.lastName}`;
          
          let confirmMessage = `Are you sure you want to delete ${employeeName}?`;
          if (hasSubordinates && employeeToDelete.subordinates) {
            const subordinateCount = employeeToDelete.subordinates.length;
            confirmMessage = `Warning: ${employeeName} has ${subordinateCount} employee${subordinateCount > 1 ? 's' : ''} reporting to them.\n\nYou must reassign or remove these employees first before deleting this manager.`;
            toast.error(confirmMessage, { duration: 6000 });
            return;
          }
          
          if (window.confirm(confirmMessage + '\n\nThis action cannot be undone.')) {
            deleteEmployeeMutation.mutateAsync(empId).then(() => {
              toast.success(`${employeeName} has been successfully removed from the system.`);
            }).catch(err => {
              const errorMessage = err?.response?.data?.error || err?.message || 'Unable to delete employee';
              if (errorMessage.includes('subordinates') || errorMessage.includes('employees assigned')) {
                toast.error(`Cannot delete ${employeeName}: This manager has employees reporting to them. Please reassign subordinates first.`, { duration: 6000 });
              } else if (errorMessage.includes('CEO')) {
                toast.error('Cannot delete the CEO: The organization must always have a CEO.', { duration: 5000 });
              } else {
                toast.error(`Failed to delete ${employeeName}: ${errorMessage}`, { duration: 5000 });
              }
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="relative mx-auto p-4 sm:p-6 border max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{addType === 'manager' ? 'Add New Manager' : 'Add New Employee'}</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedDepartmentForAdd('');
                  setSelectedManagerIdForAdd('');
                  reset({
                    department: user?.role === 'MANAGER' ? normalizeDept(user.employee?.department || '') : '',
                    managerId: user?.role === 'MANAGER' ? user.employee?.id : '',
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(data => {
              const payload = { 
                ...data,
                isManager: addType === 'manager' // Explicitly set role based on button choice
              };
              
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
              
              // Different logic for managers vs admins when assigning new employees to managers
              if (addType === 'employee') {
                let dept = normalizeDept(payload.department);
                if (user?.role === 'MANAGER' && user.employee?.id) {
                  // For managers, use the selected managerId from the form or default to themselves
                  if (!payload.managerId) {
                    payload.managerId = user.employee.id;
                  }
                  payload.department = user.employee.department;
                  dept = normalizeDept(user.employee.department);
                } else if (user?.role === 'ADMIN') {
                  const deptManager = departmentManagerMap.get(dept);
                  if (deptManager) {
                    payload.managerId = deptManager.id;
                  }
                }
                // Can't add employees to departments without managers - business rule I enforce
                if (!payload.managerId) {
                  toast.error(`Cannot add employee to ${formatDepartmentName(dept)}: No manager exists in this department. Please add a manager first.`, { duration: 5000 });
                  return;
                }
              }
              
              addEmployeeMutation.mutateAsync(payload).then(() => {
                const name = `${data.firstName} ${data.lastName}`;
                if (addType === 'manager') {
                  toast.success(`${name} has been added as a ${data.position} in the ${formatDepartmentName(data.department)} department.`, { duration: 4000 });
                } else {
                  toast.success(`${name} has been successfully added to your team.`, { duration: 4000 });
                }
                setShowAddModal(false);
                reset();
              }).catch(err => {
                const errorMessage = err?.response?.data?.error || err?.message;
                if (errorMessage?.includes('already exists') || errorMessage?.includes('duplicate')) {
                  toast.error(`Cannot add employee: This email or employee number is already in use. Please use a different one.`, { duration: 5000 });
                } else if (errorMessage?.includes('validation')) {
                  toast.error(`Invalid data: Please check all fields and try again. ${errorMessage}`, { duration: 5000 });
                } else {
                  toast.error(`Failed to add ${data.firstName} ${data.lastName}: ${errorMessage || 'Please try again.'}`, { duration: 5000 });
                }
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
                    <>
                      <input 
                        type="text" 
                        className="input-field bg-gray-100" 
                        value={formatDepartmentName(normalizeDept(user.employee?.department || ''))} 
                        disabled 
                        readOnly
                      />
                      <input type="hidden" {...register('department')} />
                    </>
                  ) : addType === 'manager' && user?.role === 'ADMIN' && selectedManagerIdForAdd && selectedManagerIdForAdd === ceoEmployee?.id ? (
                    // CEO selected - allow new department
                    <>
                      <input {...register('department', {
                        setValueAs: v => normalizeDept(v)
                      })} type="text" className={`input-field ${errors.department ? 'border-red-300' : ''}`} placeholder="Enter new department" />
                      {isDuplicateDepartment ? (
                        <p className="text-red-500 text-xs mt-1">Department already exists (case-insensitive).</p>
                      ) : null}
                    </>
                  ) : addType === 'manager' && user?.role === 'ADMIN' && selectedManagerIdForAdd && selectedManagerIdForAdd !== ceoEmployee?.id ? (
                    // Other manager selected - prefill their department
                    <>
                      <input 
                        type="text" 
                        className="input-field bg-gray-100" 
                        value={formatDepartmentName(normalizeDept((managersData?.employees || []).find((m: Employee) => m.id === selectedManagerIdForAdd)?.department || ''))} 
                        disabled 
                        readOnly
                      />
                      <input type="hidden" {...register('department')} />
                    </>
                  ) : addType === 'manager' && user?.role === 'ADMIN' && !selectedManagerIdForAdd ? (
                    // No manager selected yet for new manager
                    <>
                      <input {...register('department', {
                        setValueAs: v => normalizeDept(v)
                      })} type="text" className={`input-field ${errors.department ? 'border-red-300' : ''}`} placeholder="Enter new department" />
                      {isDuplicateDepartment ? (
                        <p className="text-red-500 text-xs mt-1">Department already exists (case-insensitive).</p>
                      ) : null}
                    </>
                  ) : user?.role === 'MANAGER' ? (
                    <>
                      <input 
                        type="text" 
                        className="input-field bg-gray-100" 
                        value={formatDepartmentName(normalizeDept(user.employee?.department || ''))} 
                        disabled 
                        readOnly
                      />
                      <input type="hidden" {...register('department')} />
                    </>
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

              {/* Manager selection for adding employees as manager */}
              {addType === 'employee' && user?.role === 'MANAGER' && user.employee?.department && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign to Manager
                  </label>
                  {(managersData?.employees || []).filter((manager: Employee) => 
                    normalizeDept(manager.department) === normalizeDept(user.employee?.department || '')
                  ).length > 0 ? (
                    <select {...register('managerId')} className="input-field">
                      <option value="">Select a manager in your department</option>
                      {(managersData?.employees || []).filter((manager: Employee) => 
                        normalizeDept(manager.department) === normalizeDept(user.employee?.department || '')
                      ).map((manager: Employee) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.firstName} {manager.lastName} - {manager.position}
                          {manager.id === user.employee?.id ? ' (You)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-yellow-800">
                        No managers found in your department. The employee will be assigned to you by default.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    You can assign this employee to yourself or other managers within your department.
                  </p>
                </div>
              )}
              
              {/* Manager selection for new managers (optional for admins, auto-assigned for managers) */}
              {addType === 'manager' && user?.role === 'ADMIN' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reports To
                  </label>
                  <select 
                    {...register('managerId')} 
                    className="input-field"
                    onChange={(e) => {
                      setSelectedManagerIdForAdd(e.target.value);
                      // Auto-fill department when manager selected
                      if (e.target.value && e.target.value !== ceoEmployee?.id) {
                        const selectedManager = (managersData?.employees || []).find((m: Employee) => m.id === e.target.value);
                        if (selectedManager) {
                          setValue('department', selectedManager.department);
                        }
                      } else if (e.target.value === ceoEmployee?.id) {
                        // CEO selected - clear department so user can enter new one
                        setValue('department', '');
                      }
                    }}
                  >
                    <option value="">{ceoEmployee ? 'Select who this manager reports to' : 'No Manager (Top Level)'}</option>
                    {ceoEmployee && (
                      <option key={ceoEmployee.id} value={ceoEmployee.id}>
                        {ceoEmployee.firstName} {ceoEmployee.lastName} - {ceoEmployee.position} (CEO)
                      </option>
                    )}
                    {managersData?.employees?.filter((m: Employee) => !isCEO(m)).map((manager: Employee) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.firstName} {manager.lastName} - {manager.position} ({formatDepartmentName(manager.department)})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {ceoEmployee 
                      ? selectedManagerIdForAdd === ceoEmployee.id 
                        ? 'CEO selected: Enter a new department name for this department head'
                        : selectedManagerIdForAdd
                        ? 'This manager will work in the same department as their supervisor'
                        : 'Select CEO to create a department head, or another manager for a sub-manager'
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
                    setSelectedManagerIdForAdd('');
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="relative mx-auto p-4 sm:p-6 border max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Employee</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEmployee(null);
                  setSelectedDepartmentForEdit('');
                  resetEdit();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitEdit(data => {
              const employeeName = `${editingEmployee.firstName} ${editingEmployee.lastName}`;
              updateEmployeeMutation.mutateAsync({ ...data, id: editingEmployee.id }).then(() => {
                toast.success(`${data.firstName} ${data.lastName}'s information has been successfully updated.`, { duration: 4000 });
                setShowEditModal(false);
                setEditingEmployee(null);
                resetEdit();
              }).catch(err => {
                const errorMessage = err?.response?.data?.error || err?.message;
                if (errorMessage?.includes('already exists') || errorMessage?.includes('duplicate')) {
                  toast.error(`Cannot update ${employeeName}: This email or employee number is already in use by another employee.`, { duration: 5000 });
                } else if (errorMessage?.includes('not found')) {
                  toast.error(`Employee not found: ${employeeName} may have been deleted. Please refresh the page.`, { duration: 5000 });
                } else {
                  toast.error(`Failed to update ${employeeName}: ${errorMessage || 'Please try again.'}`, { duration: 5000 });
                }
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
                  {user?.role === 'MANAGER' ? (
                    <>
                      <>
                        <input 
                          type="text"
                          className={`input-field bg-gray-100 ${editErrors.department ? 'border-red-300' : ''}`}
                          value={formatDepartmentName(normalizeDept(editingEmployee?.department || ''))}
                          readOnly
                          placeholder="Department (locked for managers)"
                        />
                        <input type="hidden" {...registerEdit('department')} />
                      </>
                      <p className="text-xs text-gray-500 mt-1">Managers can only edit employees within their own department</p>
                    </>
                  ) : (
                    <select 
                      {...registerEdit('department')} 
                      className={`input-field ${editErrors.department ? 'border-red-300' : ''}`}
                      onChange={(e) => {
                        setSelectedDepartmentForEdit(e.target.value);
                        // Clear manager selection when department changes
                        setValueEdit('managerId', '');
                      }}
                    > 
                      <option value="">Select Department</option>
                      {departments.map(dep => (
                        <option key={dep} value={dep}>{formatDepartmentName(dep)}</option>
                      ))}
                    </select>
                  )}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager</label>
                {selectedDepartmentForEdit ? (
                  <>
                    <select {...registerEdit('managerId')} className="input-field">
                      <option value="">Select a manager in {formatDepartmentName(selectedDepartmentForEdit)}</option>
                      {(managersData?.employees || []).filter((manager: Employee) => {
                        // Filter managers by selected department and exclude self
                        const isInDepartment = normalizeDept(manager.department) === normalizeDept(selectedDepartmentForEdit);
                        const isNotSelf = manager.id !== editingEmployee?.id;
                        
                        // For managers, only show managers in their own department
                        if (user?.role === 'MANAGER') {
                          const isInCurrentUserDepartment = normalizeDept(manager.department) === normalizeDept(user.employee?.department || '');
                          return isInDepartment && isNotSelf && isInCurrentUserDepartment;
                        }
                        
                        // For admins, show all managers in the selected department
                        return isInDepartment && isNotSelf;
                      }).map((manager: Employee) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.firstName} {manager.lastName} - {manager.position}
                          {user?.role === 'MANAGER' && manager.id === user.employee?.id ? ' (You)' : ''}
                        </option>
                      ))}
                    </select>
                    {(managersData?.employees || []).filter((m: Employee) => {
                      const isInDepartment = normalizeDept(m.department) === normalizeDept(selectedDepartmentForEdit);
                      const isNotSelf = m.id !== editingEmployee?.id;
                      
                      if (user?.role === 'MANAGER') {
                        const isInCurrentUserDepartment = normalizeDept(m.department) === normalizeDept(user.employee?.department || '');
                        return isInDepartment && isNotSelf && isInCurrentUserDepartment;
                      }
                      
                      return isInDepartment && isNotSelf;
                    }).length === 0 && (
                      <p className="text-yellow-600 text-xs mt-1">
                        ⚠️ No managers available in this department. This employee will have no manager assigned.
                      </p>
                    )}
                    {user?.role === 'MANAGER' && (
                      <p className="text-xs text-gray-500 mt-1">
                        You can assign this employee to yourself or other managers within your department.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <select disabled className="input-field bg-gray-100">
                      <option value="">Select a department first</option>
                    </select>
                    <p className="text-gray-500 text-xs mt-1">
                      Please select a department to see available managers
                    </p>
                  </>
                )}
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