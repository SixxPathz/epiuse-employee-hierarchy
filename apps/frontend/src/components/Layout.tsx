import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  UsersIcon,
  UserIcon,
  ChartBarIcon,
  CogIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentChartBarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { getUserPermissions } from '../utils/permissions';
import { User } from '../types';
import { generateGravatarUrl, getProfilePictureUrl } from '../utils/helpers';
import ProfileImage from './ProfileImage';
import { useLogout } from '../hooks/useEmployees';

interface LayoutProps {
  children: ReactNode;
  user: User | null | undefined;
}

export default function Layout({ children, user: initialUser }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(initialUser || null);
  const router = useRouter();
  const logout = useLogout();

  // Early return for loading state when user is explicitly null (not undefined during loading)
  if (initialUser === null) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex flex-col lg:flex-row min-h-screen">
          <div className="lg:w-64 bg-white shadow-sm border-r border-gray-200">
            <div className="h-16 flex items-center px-4 border-b border-gray-200">
              <div className="animate-pulse flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-6 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // If we're still loading (undefined), show a basic layout without user-specific content
  if (initialUser === undefined) {
    return (
      <div className="h-screen flex overflow-hidden bg-gray-50">
        {/* Desktop sidebar - loading state */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="sidebar h-0 flex-1">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4 mb-6">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-1">
                      <img 
                        src="/logo.png" 
                        alt="EPI-USE Logo" 
                        className="h-10 w-auto mr-1"
                      />
                      <span className="text-2xl font-bold text-epi-navy">Nexus</span>
                    </div>
                    <div className="text-center">
                      <h1 className="text-sm font-semibold text-epi-navy">EPI-USE Employee Portal</h1>
                    </div>
                  </div>
                </div>
                <nav className="px-2 space-y-1">
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-10 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          {/* Page header - loading state */}
          <div className="header">
            <div className="flex-1">
              <div className="animate-pulse h-6 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="ml-4 flex items-center space-x-4">
              <div className="animate-pulse flex items-center space-x-3">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="hidden md:block space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="animate-pulse h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>

          {/* Main content area */}
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    );
  }



  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      setUser(event.detail);
    };

    // Listen for profile updates from anywhere in the app
    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);

    // Also update when localStorage changes
    const handleStorageChange = () => {
      const updatedUserData = localStorage.getItem('user');
      if (updatedUserData) {
        try {
          const parsedUser = JSON.parse(updatedUserData);
          setUser(parsedUser);
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Update user when initialUser prop changes
  useEffect(() => {
    // Always update if we have a valid initialUser
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  // Ensure we have a user before rendering the main layout
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-company-navy"></div>
      </div>
    );
  }

  // Get user permissions for navigation filtering
  const permissions = getUserPermissions(user.role || 'EMPLOYEE');

  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, requiredPermission: null },
    { 
      name: user.role === 'ADMIN' ? 'Employees' : 'TeamSpace', 
      href: '/employees', 
      icon: UsersIcon, 
      requiredPermission: 'canViewEmployees' 
    },
    { name: 'Organization Chart', href: '/org-chart', icon: ChartBarIcon, requiredPermission: 'canViewEmployees' },
    { name: 'Profile', href: '/profile', icon: UserIcon, requiredPermission: null },
    { name: 'Settings', href: '/settings', icon: CogIcon, requiredPermission: null, roles: ['ADMIN'] },
  ];

  // Filter navigation based on permissions and roles
  const navigation = allNavigation.filter(item => {
    // Check role-based access (backward compatibility)
    if (item.roles && !item.roles.includes(user.role)) {
      return false;
    }
    
    // Check permission-based access
    if (item.requiredPermission) {
      return permissions[item.requiredPermission as keyof typeof permissions];
    }
    
    return true;
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4 mb-6">
                <div className="flex flex-col items-center space-y-2">
                  {/* Logo and Nexus side by side to spell EPI-USE Nexus */}
                  <div className="flex items-center space-x-1">
                    <img 
                      src="/logo.png" 
                      alt="EPI-USE Logo" 
                      className="h-10 w-auto mr-1"
                    />
                    <span className="text-2xl font-bold text-epi-navy">Nexus</span>
                  </div>
                  {/* Portal name underneath */}
                  <div className="text-center">
                    <h1 className="text-sm font-semibold text-epi-navy">EPI-USE Employee Portal</h1>
                  </div>
                </div>
              </div>
              <nav className="px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="sidebar h-0 flex-1">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 mb-6">
                <div className="flex flex-col items-center space-y-2">
                  {/* Logo and Nexus side by side to spell EPI-USE Nexus */}
                  <div className="flex items-center space-x-1">
                    <img 
                      src="/logo.png" 
                      alt="EPI-USE Logo" 
                      className="h-10 w-auto mr-1"
                    />
                    <span className="text-2xl font-bold text-epi-navy">Nexus</span>
                  </div>
                  {/* Portal name underneath */}
                  <div className="text-center">
                    <h1 className="text-sm font-semibold text-epi-navy">EPI-USE Employee Portal</h1>
                  </div>
                </div>
              </div>
              <nav className="px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-900 focus:outline-none"
              onClick={() => setSidebarOpen(true)}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-epi-navy">EPI-USE Nexus</h1>
            <div className="w-6" />
          </div>
        </div>

        {/* Page header */}
        <div className="header">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {navigation.find(item => item.href === router.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          <div className="ml-4 flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <ProfileImage 
                user={user}
                size={32}
                className="h-8 w-8 rounded-full object-cover"
                alt="User avatar"
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {user.employee?.firstName && user.employee?.lastName 
                    ? `${user.employee.firstName} ${user.employee.lastName}`
                    : user.email
                  }
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  {user.employee?.position && (
                    <span className="text-xs text-gray-400">• {user.employee.position}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-outline text-xs flex items-center"
            >
              <ArrowRightOnRectangleIcon className="h-3 w-3 mr-1" />
              Sign out
            </button>
          </div>
        </div>

        {/* Main content area */}
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}