import crypto from 'crypto-js';

export const generateGravatarUrl = (email: string, size: number = 40): string => {
  // Handle undefined or null email
  if (!email || typeof email !== 'string') {
    // Return a default identicon for invalid emails
    const defaultHash = crypto.MD5('default@example.com').toString();
    return `https://www.gravatar.com/avatar/${defaultHash}?s=${size}&d=identicon`;
  }
  
  const hash = crypto.MD5(email.toLowerCase().trim()).toString();
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
};

export const getProfilePictureUrl = (employee: any, email: string, size: number = 40): string => {
  // Only use uploaded picture if it exists and is not null/empty
  if (employee?.profilePicture && employee.profilePicture.trim() !== '') {
    // Use the API base URL for serving static files (same as API calls)
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    let profilePath = employee.profilePicture;
    
    // Handle both old and new URL formats
    if (profilePath.startsWith('/api/')) {
      // Old format: /api/upload/profile-picture/filename.jpg
      const serverBaseUrl = apiBaseUrl.replace('/api', '');
      return `${serverBaseUrl}${profilePath}`;
    } else {
      // New format: /upload/profile-picture/filename.jpg
      const serverBaseUrl = apiBaseUrl.replace('/api', '');
      return `${serverBaseUrl}/api${profilePath}`;
    }
  }
  
  // Default to Gravatar in all other cases (this now handles undefined email safely)
  return generateGravatarUrl(email, size);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const getFullName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const classNames = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const downloadCSV = (data: any[], filename: string): void => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};