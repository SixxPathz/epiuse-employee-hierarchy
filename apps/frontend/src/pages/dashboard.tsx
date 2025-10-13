import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import DashboardStats from '../components/DashboardStats';
import PasswordChangeModal from '../components/PasswordChangeModal';
import { DashboardCardSkeleton } from '../components/Skeletons';
import { useCurrentUser, useDashboardStats, usePrefetchEmployees } from '../hooks/useEmployees';
import { User } from '../types';

export default function Dashboard() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [localUser, setLocalUser] = useState<User | null>(null);
  const router = useRouter();
  
  // Load user from localStorage immediately for header display
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setLocalUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);
  
  // Enhanced React Query hooks
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser({
    retry: (failureCount, error: any) => {
      // Don't retry if it's an auth error
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 1;
    }
  });
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats({
    enabled: !!user, // Only fetch stats if user is loaded
  });
  const prefetchEmployees = usePrefetchEmployees();

  // Update local user when React Query user loads
  useEffect(() => {
    if (user) {
      setLocalUser(user);
      // Update localStorage with fresh data
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  // Prefetch employees data for better navigation experience
  useEffect(() => {
    prefetchEmployees({ page: 1, limit: 10 });
  }, [prefetchEmployees]);

  useEffect(() => {
    // Check if user needs authentication
    if (userError) {
      router.push('/auth/login');
      return;
    }

    // Check if user must change password (first login) - use React Query user data
    if (user?.mustChangePassword) {
      setIsFirstLogin(true);
      setShowPasswordModal(true);
    }
  }, [user, userError, router]);

  // Listen for profile updates - This will be handled by React Query automatically
  // Remove the manual event listener as React Query will handle cache invalidation

  const handlePasswordModalClose = () => {
    // If user has changed password (mustChangePassword is now false), allow closing
    if (!isFirstLogin || (user && !user.mustChangePassword)) {
      setShowPasswordModal(false);
      setIsFirstLogin(false); // Reset first login state
    }
    // If it's first login and password hasn't been changed, don't allow closing
  };

  const handlePasswordChanged = () => {
    // Called when password is successfully changed - React Query will handle cache updates
    setIsFirstLogin(false);
    setShowPasswordModal(false);
  };

  const getRoleSpecificMessage = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Manage your organization\'s hierarchy and employee data with EPI-USE Nexus';
      case 'MANAGER':
        return 'Oversee your team and manage your department with EPI-USE Nexus';
      case 'EMPLOYEE':
        return 'Access your personal information and connect with your team';
      default:
        return 'Welcome to EPI-USE Nexus';
    }
  };

  // Use localUser for immediate header display, fallback to React Query user
  const displayUser = user || localUser;

  if (userLoading && !localUser) {
    return (
      <Layout user={displayUser}>
        <Head>
          <title>Dashboard - Loading...</title>
        </Head>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <DashboardCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-company-navy"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - EPI-USE Nexus</title>
      </Head>
      <Layout user={displayUser}>
        <div className="space-y-6">
          {/* Header */}
          <div className="card">
            <div className="card-body">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {displayUser.employee?.firstName || displayUser.email}
              </h1>
              <p className="text-gray-600 mt-2">
                {getRoleSpecificMessage(displayUser.role)}
              </p>
            </div>
          </div>

          {/* Dashboard Overview Content */}
          <div className="space-y-6">
            <DashboardStats user={displayUser} />
          </div>
        </div>
        
        {/* Password Change Modal */}
        <PasswordChangeModal
          isOpen={showPasswordModal}
          onClose={handlePasswordModalClose}
          isFirstLogin={isFirstLogin}
          onPasswordChanged={handlePasswordChanged}
        />
      </Layout>
    </>
  );
}