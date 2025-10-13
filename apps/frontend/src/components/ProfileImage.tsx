import { useState, useEffect } from 'react';
import { generateGravatarUrl, getProfilePictureUrl } from '../utils/helpers';

interface ProfileImageProps {
  user: any;
  size?: number;
  className?: string;
  alt?: string;
}

export default function ProfileImage({ 
  user, 
  size = 40, 
  className = "rounded-full object-cover", 
  alt = "Profile picture" 
}: ProfileImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(user);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      setCurrentUser(event.detail);
      setHasError(false); // Reset error state when profile updates
      setIsLoading(true); // Show loading while new image loads
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  // Update current user when prop changes
  useEffect(() => {
    // Only update if the user actually changed (different email or profile picture)
    if (!currentUser || 
        currentUser.email !== user?.email || 
        currentUser.employee?.profilePicture !== user?.employee?.profilePicture) {
      setCurrentUser(user);
      setHasError(false);
      setIsLoading(true);
    }
  }, [user, currentUser]);

  // Safety check - ensure we have a valid user
  if (!currentUser || !currentUser.email) {
    return (
      <div 
        className={`bg-gray-300 animate-pulse ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    );
  }

  // Always use uploaded picture if available, otherwise Gravatar
  const primaryImageUrl = getProfilePictureUrl(currentUser.employee, currentUser.email, size);
  const fallbackImageUrl = generateGravatarUrl(currentUser.email, size);



  const handleError = () => {
    if (!hasError) {
      setHasError(true);
    }
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative">
      <img
        src={hasError ? fallbackImageUrl : primaryImageUrl}
        alt={alt}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`,
          display: isLoading ? 'none' : 'block'
        }}
      />
      {isLoading && (
        <div 
          className={`bg-gray-200 animate-pulse ${className}`}
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      )}
    </div>
  );
}