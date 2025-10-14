import { useState, useEffect } from 'react';
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
import { Employee, User } from '../types';
// Removed unused helper imports; virtual table handles row rendering
import { TableSkeleton, SearchSkeleton } from './Skeletons';
import { VirtualEmployeeTable } from './VirtualEmployeeTable';
import {
  useInfiniteEmployees,
  useManagers,
  useAddEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  usePrefetchEmployee,
} from '../hooks/useEmployees';

const addEmployeeSchema = yup.object({
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

type AddEmployeeFormData = yup.InferType<typeof addEmployeeSchema>;

interface EmployeeTableProps {
  user?: User;
}

export default function EmployeeTable({ user }: EmployeeTableProps) {
  // For Add Manager and Add Department features
  const [addType, setAddType] = useState<'employee' | 'manager'>('employee');
  const [customDepartment, setCustomDepartment] = useState('');
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  // Multi-field search state
  const [searchName, setSearchName] = useState('');
  const [searchEmployeeNumber, setSearchEmployeeNumber] = useState('');
  const [searchPosition, setSearchPosition] = useState('');

  const [selectedDepartment, setSelectedDepartment] = useState('');
  // Infinite scroll replaces classic pagination
  const [sortBy, setSortBy] = useState('firstName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  // Virtual scrolling is now the default and only mode

  const prefetchEmployee = usePrefetchEmployee();

  // Helper function to format department names for display
  const formatDepartmentName = (dept: string): string => {
    return dept
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Search params state - now controlled by search button
  const [searchParams, setSearchParams] = useState({});
  
  // Handle search button click
  const handleSearch = () => {
    setSearchParams({
      name: searchName || undefined,
      employeeNumber: searchEmployeeNumber || undefined,
      position: searchPosition || undefined,
      department: selectedDepartment || undefined,
    });
  };

  // Clear search function
  const handleClearSearch = () => {
    setSearchName('');
    setSearchEmployeeNumber('');
    setSearchPosition('');
    setSelectedDepartment('');
    setSearchParams({});
  };

  // Query key will change with department filter; no manual page reset needed

  // Clear department filter for non-admin users
  useEffect(() => {
    if (user?.role !== 'ADMIN' && selectedDepartment) {
      setSelectedDepartment('');
    }
  }, [user?.role, selectedDepartment]);

  // Get user permissions
  const permissions = getUserPermissions(user?.role || 'EMPLOYEE');

  // Helper function to determine if current user can view specific employee's salary
  const canViewEmployeeSalary = (employee: Employee) => {
    if (!permissions.canViewSalaries) return false;
    if (user?.role === 'ADMIN') return true;
    
    if (user?.role === 'MANAGER') {
      // Managers can only view their own salary and subordinates' salaries
      // Not peers or superiors
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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddEmployeeFormData>({
    resolver: yupResolver(addEmployeeSchema),
    defaultValues: {
      department: user?.role === 'MANAGER' ? user.employee?.department : '',
      managerId: user?.role === 'MANAGER' ? user.employee?.id : '',
    },
  });

  // Edit form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm<AddEmployeeFormData>({
    resolver: yupResolver(addEmployeeSchema),
  });

  // Infinite employees for virtual scrolling
  const {
    data: employeesPages,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteEmployees({
    limit: 50,
    ...searchParams,
    sortBy,
    sortOrder,
  });

  // Fetch potential managers for the dropdown
  const { data: managersData, isLoading: managersLoading } = useManagers();

  // Enhanced mutations with optimistic updates
  const addEmployeeMutation = useAddEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  // Filter out current user from employee list if they're a manager
  // Also filter out CEO for employees and managers  
  const allEmployees = (employeesPages?.pages || []).flatMap((p: any) => p.employees || []);
  const filteredEmployees = allEmployees.filter((employee: Employee) => {
    // For managers, exclude themselves from the employee list
    if (user?.role === 'MANAGER' && user?.employee?.id === employee.id) {
      return false;
    }
    
    // For employees and managers, exclude CEO (employee with no manager)
    if ((user?.role === 'EMPLOYEE' || user?.role === 'MANAGER') && !employee.managerId) {
      return false;
    }
    
    return true;
  });

  // Virtual scrolling is always enabled; no toggle behavior required

  // Enhanced mutation handlers with better error handling
  const handleAddEmployee = async (data: AddEmployeeFormData) => {
    try {
      // For managers, enforce their department and set them as the manager
      const employeeData = { ...data };
      if (user?.role === 'MANAGER' && user.employee) {
        employeeData.department = user.employee.department;
        employeeData.managerId = user.employee.id;
      }
      
      await addEmployeeMutation.mutateAsync(employeeData);
      toast.success('Employee added successfully!');
      setShowAddModal(false);
      reset({
        department: user?.role === 'MANAGER' ? user.employee?.department : '',
        managerId: user?.role === 'MANAGER' ? user.employee?.id : '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add employee');
    }
  };

  const handleUpdateEmployee = async (data: AddEmployeeFormData) => {
    if (!editingEmployee) return;
    
    try {
      await updateEmployeeMutation.mutateAsync({ ...data, id: editingEmployee.id });
      toast.success('Employee updated successfully!');
      setShowEditModal(false);
      setEditingEmployee(null);
      resetEdit();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update employee');
    }
  };

  const handleSort = (column: string) => {
    // Prevent sorting by position
    if (column === 'position') {
      return;
    }
    
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // PROFESSIONAL MANAGEMENT SYSTEM: Centralized permission checks
  const canAddEmployee = permissions.canCreateEmployees;
  const canEditEmployee = permissions.canEditEmployees;
  const canDeleteEmployee = permissions.canDeleteEmployees;
  const canViewEmployees = permissions.canViewEmployees;

  const handleDelete = async (employeeId: string) => {
    if (!canDeleteEmployee) {
      toast.error('You do not have permission to delete employees.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployeeMutation.mutateAsync(employeeId);
        toast.success('Employee deleted successfully!');
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Failed to delete employee');
      }
    }
  };

  const handleEdit = (employee: Employee) => {
    if (!canEditEmployee) {
      toast.error('You do not have permission to edit employees.');
      return;
    }
    
    // Prefetch employee data for better UX
    prefetchEmployee(employee.id);
    
    setEditingEmployee(employee);
    setShowEditModal(true);
    
    // Populate form with employee data
    setValueEdit('firstName', employee.firstName);
    setValueEdit('lastName', employee.lastName);
    setValueEdit('email', employee.email || '');
    setValueEdit('employeeNumber', employee.employeeNumber);
    setValueEdit('position', employee.position);
    setValueEdit('department', employee.department || '');
    setValueEdit('salary', employee.salary);
    setValueEdit('birthDate', employee.birthDate ? new Date(employee.birthDate).toISOString().split('T')[0] : '');
    setValueEdit('managerId', employee.managerId || '');
  };

  // Enhanced loading states with skeletons
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
          {canAddEmployee && (
            <>
              <button 
                onClick={() => { setShowAddModal(true); setAddType('employee'); }}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Employee</span>
              </button>
              {user?.role === 'ADMIN' && (
                <>
                  <button
                    onClick={() => { setShowAddModal(true); setAddType('manager'); }}
                    className="btn-secondary inline-flex items-center space-x-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add Manager</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Multi-field Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Name Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field pl-10"
              />
            </div>
            {/* Employee Number */}
            <div>
              <input
                type="text"
                placeholder="Employee Number"
                value={searchEmployeeNumber}
                onChange={(e) => setSearchEmployeeNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field"
              />
            </div>
            {/* Position */}
            <div>
              <input
                type="text"
                placeholder="Position"
                value={searchPosition}
                onChange={(e) => setSearchPosition(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="input-field"
              />
            </div>

            {/* Department Filter - Only show for admins who can see all employees */}
            {user?.role === 'ADMIN' && (
              <div>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Departments</option>
                  <option value="management">Management</option>
                  <option value="technology">Technology</option>
                  <option value="human-resources">Human Resources</option>
                  <option value="sales">Sales</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
            )}
          </div>
          
          {/* Search Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
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

      {/* Virtual Table with infinite scroll */}
      <VirtualEmployeeTable
        employees={employees}
        user={user}
        onEdit={handleEdit}
        onDelete={handleDelete}
        height={600}
        hasMore={!!hasNextPage}
        isLoadingMore={!!isFetchingNextPage}
        loadMore={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
      />

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Employee</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
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

            <form onSubmit={handleSubmit(handleAddEmployee)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className={`input-field ${errors.firstName ? 'border-red-300' : ''}`}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className={`input-field ${errors.lastName ? 'border-red-300' : ''}`}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Number
                  </label>
                  <input
                    {...register('employeeNumber')}
                    type="text"
                    className={`input-field ${errors.employeeNumber ? 'border-red-300' : ''}`}
                    placeholder="e.g., EMP-021"
                  />
                  {errors.employeeNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.employeeNumber.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    {...register('position')}
                    type="text"
                    className={`input-field ${errors.position ? 'border-red-300' : ''}`}
                    placeholder={addType === 'manager' ? 'Manager Position' : 'Enter job position'}
                    value={addType === 'manager' ? 'Manager' : undefined}
                    readOnly={addType === 'manager'}
                  />
                  {errors.position && (
                    <p className="text-red-500 text-xs mt-1">{errors.position.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                    {user?.role === 'MANAGER' && (
                      <span className="text-sm text-gray-500 ml-1">(Auto-assigned to your department)</span>
                    )}
                  </label>
                  <select
                    {...register('department')}
                    className={`input-field ${errors.department ? 'border-red-300' : ''}`}
                    disabled={user?.role === 'MANAGER'}
                    value={user?.role === 'MANAGER' ? user.employee?.department : undefined}
                    onChange={e => {
                      if (e.target.value === 'other') {
                        setShowCustomDepartment(true);
                      } else {
                        setShowCustomDepartment(false);
                        setCustomDepartment('');
                      }
                    }}
                  >
                    <option value="">Select Department</option>
                    <option value="management">Management</option>
                    <option value="technology">Technology</option>
                    <option value="human-resources">Human Resources</option>
                    <option value="sales">Sales</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other...</option>
                  </select>
                  {showCustomDepartment && (
                    <input
                      type="text"
                      className="input-field mt-2"
                      placeholder="Enter new department"
                      value={customDepartment}
                      onChange={e => setCustomDepartment(e.target.value)}
                    />
                  )}
                  {errors.department && (
                    <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {permissions.canViewSalaries && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Salary (ZAR)
                    </label>
                    <input
                      {...register('salary')}
                      type="number"
                      min="0"
                      step="1000"
                      className={`input-field ${errors.salary ? 'border-red-300' : ''}`}
                      placeholder="Enter annual salary"
                    />
                    {errors.salary && (
                      <p className="text-red-500 text-xs mt-1">{errors.salary.message}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date
                  </label>
                  <input
                    {...register('birthDate')}
                    type="date"
                    className={`input-field ${errors.birthDate ? 'border-red-300' : ''}`}
                  />
                  {errors.birthDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.birthDate.message}</p>
                  )}
                </div>
              </div>

              {/* Manager Selection - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager {user?.role === 'ADMIN' ? '(Optional)' : ''}
                  {user?.role === 'MANAGER' && (
                    <span className="text-sm text-gray-500 ml-1">(Auto-assigned to you)</span>
                  )}
                </label>
                <select
                  {...register('managerId')}
                  className="input-field"
                  disabled={user?.role === 'MANAGER'}
                  value={user?.role === 'MANAGER' ? user.employee?.id : undefined}
                >
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
                    setShowAddModal(false);
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
                  {addEmployeeMutation.isPending ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
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

            <form onSubmit={handleSubmitEdit(handleUpdateEmployee)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    {...registerEdit('firstName')}
                    type="text"
                    className={`input-field ${editErrors.firstName ? 'border-red-300' : ''}`}
                    placeholder="Enter first name"
                  />
                  {editErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    {...registerEdit('lastName')}
                    type="text"
                    className={`input-field ${editErrors.lastName ? 'border-red-300' : ''}`}
                    placeholder="Enter last name"
                  />
                  {editErrors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  {...registerEdit('email')}
                  type="email"
                  className={`input-field ${editErrors.email ? 'border-red-300' : ''}`}
                  placeholder="Enter email address"
                />
                {editErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{editErrors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Number
                  </label>
                  <input
                    {...registerEdit('employeeNumber')}
                    type="text"
                    className={`input-field ${editErrors.employeeNumber ? 'border-red-300' : ''}`}
                    placeholder="Enter employee number"
                  />
                  {editErrors.employeeNumber && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.employeeNumber.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    {...registerEdit('position')}
                    type="text"
                    className={`input-field ${editErrors.position ? 'border-red-300' : ''}`}
                    placeholder="Enter position"
                  />
                  {editErrors.position && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.position.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    {...registerEdit('department')}
                    className={`input-field ${editErrors.department ? 'border-red-300' : ''}`}
                  >
                    <option value="">Select Department</option>
                    <option value="management">Management</option>
                    <option value="technology">Technology</option>
                    <option value="human-resources">Human Resources</option>
                    <option value="sales">Sales</option>
                    <option value="marketing">Marketing</option>
                  </select>
                  {editErrors.department && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.department.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Salary
                  </label>
                  <input
                    {...registerEdit('salary')}
                    type="number"
                    step="0.01"
                    className={`input-field ${editErrors.salary ? 'border-red-300' : ''}`}
                    placeholder="Enter salary"
                  />
                  {editErrors.salary && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.salary.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date
                  </label>
                  <input
                    {...registerEdit('birthDate')}
                    type="date"
                    className={`input-field ${editErrors.birthDate ? 'border-red-300' : ''}`}
                  />
                  {editErrors.birthDate && (
                    <p className="text-red-500 text-xs mt-1">{editErrors.birthDate.message}</p>
                  )}
                </div>
              </div>

              {/* Manager Selection - Full Width */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager (Optional)
                </label>
                <select
                  {...registerEdit('managerId')}
                  className="input-field"
                >
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