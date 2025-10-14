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
  // State hooks
  const [addType, setAddType] = useState<'employee' | 'manager'>('employee');
  const [customDepartment, setCustomDepartment] = useState('');
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchEmployeeNumber, setSearchEmployeeNumber] = useState('');
  const [searchPosition, setSearchPosition] = useState('');
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
  const departmentSet = new Set<string>();
  allEmployees.forEach(emp => {
    if (emp.department) departmentSet.add(emp.department);
  });
  const departments = Array.from(departmentSet);
  const departmentsWithManagers = new Set<string>(
    allEmployees.filter(emp => emp.position.toLowerCase().includes('manager')).map(emp => emp.department)
  );
  const availableDepartmentsForManager = departments.filter(dep => !departmentsWithManagers.has(dep));
  const isDuplicateDepartment = customDepartment && departments.includes(customDepartment.trim());

  // Managers in selected department
  const managersInSelectedDepartment = (managersData?.employees || []).filter(
    (mgr: Employee) => mgr.department === (showCustomDepartment ? customDepartment : (addType === 'manager' ? undefined : (selectedDepartment || '')))
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
    return dept
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
            <>
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
            </>
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
            <input
              type="text"
              className="input-field"
              placeholder="Position..."
              value={searchPosition}
              onChange={e => setSearchPosition(e.target.value)}
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
              addEmployeeMutation.mutateAsync(data).then(() => {
                toast.success('Employee added successfully!');
                setShowAddModal(false);
                reset();
              }).catch(err => {
                toast.error('Failed to add employee');
              });
            })} className="space-y-4">
              {/* ...form fields as before... */}
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
              {/* ...form fields as before... */}
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