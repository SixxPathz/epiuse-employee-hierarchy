import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import {
  UserIcon,
  KeyIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import { User } from '../types';
import api from '../utils/api';
import { generateGravatarUrl, getProfilePictureUrl } from '../utils/helpers';
import ProfileImage from '../components/ProfileImage';
import { useCurrentUser } from '../hooks/useEmployees';

// Schema for admins - only admins can edit profile information
const profileSchemaAdmin = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  position: yup.string().required('Position is required'),
  birthDate: yup.string().required('Birth date is required'),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .required('New password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your new password'),
});

type ProfileFormDataAdmin = yup.InferType<typeof profileSchemaAdmin>;
type PasswordFormData = yup.InferType<typeof passwordSchema>;

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/auth/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Only Admins can edit profile information - everyone else has view-only access
  const canEditProfile = user?.role === 'ADMIN';

  // Choose the appropriate schema - only admins need validation schema
  const getSchema = () => {
    return profileSchemaAdmin; // Only admins use the form
  };

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormDataAdmin>({
    resolver: yupResolver(getSchema()),
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordSchema),
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      router.push('/auth/login');
      return;
    }
  }, [router]);

  // Populate form when user data is available
  useEffect(() => {
    if (user?.employee && user.role === 'ADMIN') {
      const formData = {
        firstName: user.employee.firstName || '',
        lastName: user.employee.lastName || '',
        email: user.email || '',
        position: user.employee.position || '',
        birthDate: user.employee.birthDate 
          ? new Date(user.employee.birthDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      };
      resetProfile(formData);
    }
  }, [user, resetProfile]);

  const onSubmitProfile = async (data: ProfileFormDataAdmin) => {
    if (!user?.employee || !canEditProfile) {
      toast.error('You do not have permission to edit profiles');
      return;
    }
    
    setIsUpdatingProfile(true);
    try {
      // Admins can update all fields
      const updateFields = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        position: data.position,
        birthDate: new Date(data.birthDate).toISOString(),
      };

  const response = await api.put(`/employees/${user.employee.id}`, updateFields);

      // Update user data in localStorage
      const updatedUser = {
        ...user,
        email: updateFields.email,
        employee: {
          ...user.employee,
          ...response.data.employee,
        },
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: updatedUser }));
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      toast.success('Password changed successfully!');
      resetPassword();
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfilePictureUpdate = async () => {
    // Refresh user data after profile picture update by fetching from server
    try {
      const token = localStorage.getItem('auth_token');
  if (!token || !user?.employee?.id) return;

      // Get the current user data from localStorage first (which has the latest profile picture)
  const currentUserData = localStorage.getItem('user');
  const currentUser = currentUserData ? JSON.parse(currentUserData) : user;

      // Fetch updated user data from server
  const response = await api.get(`/employees/${user.employee.id}`);
      const updatedEmployee = response.data.employee;

      // Update user object, but preserve the profile picture from localStorage if it's newer
      const updatedUser = {
        ...user,
        employee: {
          ...user.employee,
          ...updatedEmployee,
          // Keep the profile picture from current user data if it exists
          profilePicture: currentUser.employee?.profilePicture || updatedEmployee.profilePicture,
        },
      };
      
      // Update localStorage and local state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Force refresh of all profile pictures across the app by triggering a re-render
      // This ensures the new profile picture appears everywhere immediately
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
        detail: updatedUser 
      }));
      
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // Fallback: just refresh user data from localStorage and notify other components
      const updatedUserData = localStorage.getItem('user');
      if (updatedUserData) {
        const parsedUser = JSON.parse(updatedUserData);
        setUser(parsedUser);
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { detail: parsedUser }));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-company-navy"></div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ];

  return (
    <>
      <Head>
        <title>Profile - EPI-USE Nexus</title>
        <meta name="description" content="Manage your profile and account settings" />
      </Head>
  <Layout user={user}>
        <div className="space-y-6">
          {/* Header */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {user.employee?.firstName && user.employee?.lastName
                      ? `${user.employee.firstName} ${user.employee.lastName}`
                      : user.email
                    }
                  </h1>
                  <p className="text-gray-600">{user.employee?.position}</p>
                  <p className="text-sm text-gray-500">Employee ID: {user.employee?.employeeNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-company-navy text-company-navy'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="mr-2 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Picture */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Profile Picture</h3>
                  <p className="text-sm text-gray-600">Update your profile picture</p>
                </div>
                <div className="card-body">
                  <ProfilePictureUpload user={user} onUpdate={handleProfilePictureUpdate} />
                </div>
              </div>

              {/* Profile Information */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold">Profile Information</h3>
                  <p className="text-sm text-gray-600">
                    {canEditProfile 
                      ? 'Update profile information as system administrator'
                      : 'View your personal information'
                    }
                  </p>
                </div>
                <div className="card-body">
                  {canEditProfile ? (
                    // Admin edit form
                    <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">First Name</label>
                          <input
                            {...registerProfile('firstName')}
                            type="text"
                            className={`input-field ${profileErrors.firstName ? 'border-red-300' : ''}`}
                          />
                          {profileErrors.firstName && (
                            <p className="text-red-500 text-xs mt-1">{profileErrors.firstName.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="form-label">Last Name</label>
                          <input
                            {...registerProfile('lastName')}
                            type="text"
                            className={`input-field ${profileErrors.lastName ? 'border-red-300' : ''}`}
                          />
                          {profileErrors.lastName && (
                            <p className="text-red-500 text-xs mt-1">{profileErrors.lastName.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Email</label>
                        <input
                          {...registerProfile('email')}
                          type="email"
                          className={`input-field ${profileErrors.email ? 'border-red-300' : ''}`}
                        />
                        {profileErrors.email && (
                          <p className="text-red-500 text-xs mt-1">{profileErrors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Position</label>
                        <input
                          {...registerProfile('position')}
                          type="text"
                          className={`input-field ${profileErrors.position ? 'border-red-300' : ''}`}
                        />
                        {profileErrors.position && (
                          <p className="text-red-500 text-xs mt-1">{profileErrors.position.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="form-label">Birth Date</label>
                        <input
                          {...registerProfile('birthDate')}
                          type="date"
                          className={`input-field ${profileErrors.birthDate ? 'border-red-300' : ''}`}
                        />
                        {profileErrors.birthDate && (
                          <p className="text-red-500 text-xs mt-1">{profileErrors.birthDate.message}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="btn-primary w-full disabled:opacity-50"
                      >
                        {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                      </button>

                      <div className="bg-purple-50 border-purple-200 border rounded-md p-3">
                        <p className="text-sm text-purple-800">
                          <strong>System Administrator Access:</strong> You have full access to update all profile information.
                        </p>
                      </div>
                    </form>
                  ) : (
                    // View-only for managers and employees
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="form-label">First Name</label>
                          <input
                            type="text"
                            value={user?.employee?.firstName || ''}
                            disabled
                            className="input-field bg-gray-50 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="form-label">Last Name</label>
                          <input
                            type="text"
                            value={user?.employee?.lastName || ''}
                            disabled
                            className="input-field bg-gray-50 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="input-field bg-gray-50 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="form-label">Position</label>
                        <input
                          type="text"
                          value={user?.employee?.position || ''}
                          disabled
                          className="input-field bg-gray-50 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="form-label">Employee Number</label>
                        <input
                          type="text"
                          value={user?.employee?.employeeNumber || ''}
                          disabled
                          className="input-field bg-gray-50 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="form-label">Birth Date</label>
                        <input
                          type="date"
                          value={user?.employee?.birthDate ? new Date(user.employee.birthDate).toISOString().split('T')[0] : ''}
                          disabled
                          className="input-field bg-gray-50 cursor-not-allowed"
                        />
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Profile Information:</strong> This information is managed by your system administrator. 
                          {user?.role === 'EMPLOYEE' && ' Employees request edits from Managers, and Managers request edits from Admins.'}
                          {user?.role === 'MANAGER' && ' As a Manager, you can request edits from system Administrators.'}
                          {' '}Please contact your system administrator or submit a request through your organization's IT portal.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card max-w-md">
              <div className="card-header">
                <h3 className="text-lg font-semibold">Change Password</h3>
                <p className="text-sm text-gray-600">Update your account password</p>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                  <div>
                    <label className="form-label">Current Password</label>
                    <input
                      {...registerPassword('currentPassword')}
                      type="password"
                      className={`input-field ${passwordErrors.currentPassword ? 'border-red-300' : ''}`}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">New Password</label>
                    <input
                      {...registerPassword('newPassword')}
                      type="password"
                      className={`input-field ${passwordErrors.newPassword ? 'border-red-300' : ''}`}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Confirm New Password</label>
                    <input
                      {...registerPassword('confirmPassword')}
                      type="password"
                      className={`input-field ${passwordErrors.confirmPassword ? 'border-red-300' : ''}`}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}