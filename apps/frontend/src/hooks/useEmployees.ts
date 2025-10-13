import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useInfiniteQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { Employee, User } from '../types';

interface EmployeesResponse {
  employees: Employee[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ManagersResponse {
  employees: Employee[];
}

interface DashboardStatsResponse {
  totalEmployees: number;
  averageSalary: number;
  totalManagers: number;
  managementRatio: number;
}

interface HierarchyTreeResponse {
  tree: any; // Define proper type based on your tree structure
}

// Query Keys - Centralized for better cache management
export const queryKeys = {
  employees: ['employees'] as const,
  employeesList: (params: Record<string, any>) => [...queryKeys.employees, 'list', params] as const,
  employeesInfinite: (params: Record<string, any>) => [...queryKeys.employees, 'infinite', params] as const,
  employee: (id: string) => [...queryKeys.employees, 'detail', id] as const,
  managers: ['managers'] as const,
  hierarchy: ['hierarchy'] as const,
  hierarchyTree: ['hierarchy', 'tree'] as const,
  dashboard: ['dashboard'] as const,
  dashboardStats: ['dashboard', 'stats'] as const,
  user: ['user'] as const,
  currentUser: ['user', 'current'] as const,
};

// Enhanced Employee List Hook with better caching
interface EmployeeListParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  sortBy?: string;
  sortOrder?: string;
  managerOnly?: boolean;
}

export const useEmployees = (
  params: EmployeeListParams = {},
  options?: Partial<UseQueryOptions<EmployeesResponse>>
) => {
  return useQuery({
    queryKey: queryKeys.employeesList(params),
    queryFn: async (): Promise<EmployeesResponse> => {
      const response = await api.get('/employees', { params });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache retention
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });
};

// Infinite Employees Hook for infinite scrolling
export const useInfiniteEmployees = (
  params: Omit<EmployeeListParams, 'page'> = {},
  options?: Parameters<typeof useInfiniteQuery<EmployeesResponse>>[0]
) => {
  return useInfiniteQuery<EmployeesResponse>({
    queryKey: queryKeys.employeesInfinite(params),
    queryFn: async ({ pageParam = 1 }): Promise<EmployeesResponse> => {
      const response = await api.get('/employees', { params: { ...params, page: pageParam, limit: params.limit ?? 50 } });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasNextPage) {
        return (lastPage.pagination.currentPage || 1) + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...(options || {}),
  });
};

// Individual Employee Hook
export const useEmployee = (id: string, options?: Partial<UseQueryOptions<Employee>>) => {
  return useQuery({
    queryKey: queryKeys.employee(id),
    queryFn: async (): Promise<Employee> => {
      const response = await api.get(`/employees/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
};

// Managers List Hook
export const useManagers = (options?: Partial<UseQueryOptions<ManagersResponse>>) => {
  return useQuery({
    queryKey: queryKeys.managers,
    queryFn: async (): Promise<ManagersResponse> => {
      const response = await api.get('/employees', {
        params: {
          managerOnly: true,
          limit: 100
        }
      });
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - managers change less frequently
    gcTime: 15 * 60 * 1000,
    ...options,
  });
};

// Organization Hierarchy Hook
export const useHierarchyTree = (options?: Partial<UseQueryOptions<HierarchyTreeResponse>>) => {
  return useQuery({
    queryKey: queryKeys.hierarchyTree,
    queryFn: async (): Promise<HierarchyTreeResponse> => {
      const response = await api.get('/employees/hierarchy/tree');
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - hierarchy changes less frequently
    gcTime: 20 * 60 * 1000,
    ...options,
  });
};

// Dashboard Stats Hook
export const useDashboardStats = (options?: Partial<UseQueryOptions<DashboardStatsResponse>>) => {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: async (): Promise<DashboardStatsResponse> => {
      const response = await api.get('/employees/stats/dashboard');
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - stats should be relatively fresh
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true, // Refresh stats when user returns to window
    ...options,
  });
};

// Current User Hook
export const useCurrentUser = (options?: Partial<UseQueryOptions<User>>) => {
  return useQuery<User>({
    queryKey: queryKeys.currentUser,
    queryFn: async (): Promise<User> => {
      const response = await api.get('/auth/me');
      // Backend returns { user: {...} }, but be defensive in case it's already the user
      const user = (response.data && (response.data.user ?? response.data)) as User;
      return user;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - user data doesn't change often
    gcTime: 30 * 60 * 1000,
    retry: 1,
    onSuccess: (data: User) => {
      // Keep localStorage in sync so pages that read from it render instantly
      if (typeof window !== 'undefined' && data) {
        try {
          localStorage.setItem('user', JSON.stringify(data));
          window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: data }));
        } catch (e) {
          // no-op if storage fails
        }
      }
    },
    ...(options || {} as any),
  });
};

// Enhanced Mutations with optimistic updates
export const useAddEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/employees', {
        ...data,
        birthDate: new Date(data.birthDate).toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch employee queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.hierarchyTree });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { id, ...updateData } = data;
      const response = await api.put(`/employees/${id}`, {
        ...updateData,
        birthDate: new Date(updateData.birthDate).toISOString(),
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch employee queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.hierarchyTree });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`);
      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch employee queries
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.hierarchyTree });
    },
  });
};

// Prefetch functions for better UX
export const usePrefetchEmployee = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.employee(id),
      queryFn: async () => {
        const response = await api.get(`/employees/${id}`);
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};

export const usePrefetchEmployees = () => {
  const queryClient = useQueryClient();

  return (params: EmployeeListParams = {}) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.employeesList(params),
      queryFn: async () => {
        const response = await api.get('/employees', { params });
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};