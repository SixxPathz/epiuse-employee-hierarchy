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
  // State hooks
  const [addType, setAddType] = useState<'employee' | 'manager'>('employee');
  const [customDepartment, setCustomDepartment] = useState('');
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchEmployeeNumber, setSearchEmployeeNumber] = useState('');
  // Removed searchPosition state (search by position is deprecated)
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [sortBy, setSortBy] = useState('firstName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [searchParams, setSearchParams] = useState({});

  // Data hooks
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

  const { data: managersData, isLoading: managersLoading } = useManagers();

  // Employees and managers
  const allEmployees = (employeesPages?.pages || []).flatMap((p: any) => p.employees || []);
  const filteredEmployees = allEmployees.filter((employee: Employee) => {
    if (user?.role === 'MANAGER' && user?.employee?.id === employee.id) {
      return false;
    }
    if ((user?.role === 'EMPLOYEE' || user?.role === 'MANAGER') && !employee.managerId) {
      return false;
    }
    return true;
  });

  // Departments
  // Normalize department names (case-insensitive, trimmed)
  const normalizeDept = (dept: string) => dept.trim().toLowerCase().replace(/\s+/g, '-');
  // Memoized department-to-manager map for fast lookup
  const departmentManagerMap = useMemo(() => {
    const map = new Map<string, Employee>();
    allEmployees.forEach(emp => {
      if (emp.department && (emp.position.toLowerCase().includes('manager') || emp.position.toLowerCase().includes('head of') || emp.position.toLowerCase().includes('director'))) {
        map.set(normalizeDept(emp.department), emp);
      }
    });
    return map;
  }, [allEmployees]);

  const departmentSet = new Set<string>();
  allEmployees.forEach(emp => {
    if (emp.department) departmentSet.add(normalizeDept(emp.department));
  });
  const departments = Array.from(departmentSet);
  const departmentsWithManagers = new Set<string>(Array.from(departmentManagerMap.keys()));
  const availableDepartmentsForManager = departments.filter(dep => !departmentsWithManagers.has(dep));
  const isDuplicateDepartment = customDepartment && departments.includes(normalizeDept(customDepartment));

  // Managers in selected department
  const managersInSelectedDepartment = (managersData?.employees || []).filter(
    (mgr: Employee) => normalizeDept(mgr.department) === normalizeDept(showCustomDepartment ? customDepartment : (addType === 'manager' ? '' : (selectedDepartment || '')))
  );
  const noManagersExist = (managersData?.employees || []).length === 0;

  // Get user permissions
  const permissions = getUserPermissions(user?.role || 'EMPLOYEE');

  // Helper function to determine if current user can view specific employee's salary
  const canViewEmployeeSalary = (employee: Employee) => {
    if (!permissions.canViewSalaries) return false;
    if (user?.role === 'ADMIN') return true;
    if (user?.role === 'MANAGER') {
      if (employee.id === user.employee?.id) return true;
      const isSubordinate = (emp: Employee, managerId: string): boolean => {
        if (!emp.manager) return false;
        if (emp.manager.id === managerId) return true;
        return isSubordinate(emp.manager as any, managerId);
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
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Employee</span>
              </button>
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => { setShowAddModal(true); setAddType('manager'); }}
                  className="btn-secondary inline-flex items-center space-x-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Add Manager</span>
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
        height={600}
        hasMore={!!hasNextPage}
        isLoadingMore={!!isFetchingNextPage}
        loadMore={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
      />

      {/* Add/Edit Modals (simplified, can be expanded) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{addType === 'manager' ? 'Add New Manager' : 'Add New Employee'}</h3>
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
            <form onSubmit={handleSubmit(data => {
              // If adding a manager, set managerId to CEO if found, else null
              let payload = { ...data };
              if (addType === 'manager') {
                if (managersData?.employees) {
                  const ceo = managersData.employees.find((emp: Employee) => emp.position.toLowerCase().includes('chief executive officer'));
                  payload.managerId = ceo ? ceo.id : undefined;
                } else {
                  payload.managerId = undefined;
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
                toast.success('Employee added successfully!');
                setShowAddModal(false);
                reset();
              }).catch(err => {
                toast.error('Failed to add employee');
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
                  {addType === 'manager' ? (
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
                      setValueAs: v => normalizeDept(v)
                    })} className={`input-field ${errors.department ? 'border-red-300' : ''}`}> 
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
                  <input {...register('salary')} type="number" min="0" step="1000" className={`input-field ${errors.salary ? 'border-red-300' : ''}`} placeholder="Enter annual salary" />
                  {errors.salary && <p className="text-red-500 text-xs mt-1">{errors.salary.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                  <input {...register('birthDate')} type="date" className={`input-field ${errors.birthDate ? 'border-red-300' : ''}`} />
                  {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate.message}</p>}
                </div>
              </div>
              <div>
                {/* Manager selection removed from Add Employee modal; auto-assign managerId based on department */}
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
                  <input {...registerEdit('salary')} type="number" min="0" step="1000" className={`input-field ${editErrors.salary ? 'border-red-300' : ''}`} placeholder="Enter annual salary" />
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