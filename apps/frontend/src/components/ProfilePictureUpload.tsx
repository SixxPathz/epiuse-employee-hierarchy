import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  PhotoIcon,
  TrashIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { User } from '../types';
import { generateGravatarUrl, getProfilePictureUrl } from '../utils/helpers';

interface ProfilePictureUploadProps {
  user: User;
  onUpdate?: () => void;
}

export default function ProfilePictureUpload({ user, onUpdate }: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      setCurrentUser(event.detail);
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  // Update current user when prop changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // All users can upload profile pictures
  const canUploadPicture = true;

  // Get current profile picture URL - prioritize uploaded pictures over Gravatar
  const currentProfilePicture = getProfilePictureUrl(currentUser.employee, currentUser.email, 200);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await api.post('/upload/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Profile picture updated successfully!');
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      console.log('📤 Upload response data:', data);
      
      // Update user data in localStorage immediately with the new profile picture URL
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.employee) {
        console.log('👤 Before update - employee data:', currentUser.employee);
        currentUser.employee.profilePicture = data.profilePicture;
        console.log('👤 After update - employee data:', currentUser.employee);
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Dispatch event to update all components immediately
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
          detail: currentUser 
        }));
      }
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Don't call onUpdate to avoid server refetch that might override our data
      // The localStorage update and event dispatch should be sufficient
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload profile picture');
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/upload/profile-picture');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Profile picture removed successfully!');
      
      // Update user data in localStorage immediately
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.employee) {
        currentUser.employee.profilePicture = null;
        localStorage.setItem('user', JSON.stringify(currentUser));
        
        // Dispatch event to update all components immediately
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
          detail: currentUser 
        }));
      }
      
      queryClient.invalidateQueries({ queryKey: ['user'] });
      
      // Don't call onUpdate to avoid server refetch that might override our data
      // The localStorage update and event dispatch should be sufficient
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to remove profile picture');
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the file
    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const handleRemovePicture = () => {
    if (window.confirm('Are you sure you want to remove your profile picture?')) {
      deleteMutation.mutate();
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-6">
        {/* Profile Picture Display */}
        <div className="relative">
          <img
            src={previewUrl || currentProfilePicture}
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
            onError={(e) => {
              // Prevent infinite loop by checking current src
              const target = e.target as HTMLImageElement;
              const gravatarUrl = generateGravatarUrl(user.email, 200);
              if (target.src !== gravatarUrl) {
                target.src = gravatarUrl;
              }
            }}
          />
          
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <button
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="btn-primary inline-flex items-center space-x-2 disabled:opacity-50"
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
            </button>

            {currentUser.employee?.profilePicture && (
              <button
                onClick={handleRemovePicture}
                disabled={deleteMutation.isPending}
                className="btn-outline inline-flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Remove</span>
              </button>
            )}
          </div>

          <div className="mt-2 text-sm text-gray-500">
            <p>Upload a custom profile picture or keep using your Gravatar.</p>
            <p>Accepted formats: JPEG, PNG, GIF, WebP (max 5MB)</p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}