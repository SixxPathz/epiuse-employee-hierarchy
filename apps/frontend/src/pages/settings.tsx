import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import DataExport from '../components/DataExport';
import { User } from '../types';
import { 
  KeyIcon,
  CogIcon,
  DocumentArrowDownIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const router = useRouter();

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

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      setUser(event.detail);
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-company-navy"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }



  // Only show settings for ADMIN users
  if (user.role !== 'ADMIN') {
    return (
      <>
        <Head>
          <title>Settings - EPI-USE Nexus</title>
          <meta name="description" content="Configure your system settings" />
        </Head>
        <Layout user={user}>
          <div className="space-y-6">
            <div className="card">
              <div className="card-body text-center">
                <h2 className="text-xl font-semibold text-gray-900">Access Restricted</h2>
                <p className="text-gray-600 mt-2">
                  Only administrators can access system settings.
                </p>
              </div>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Settings - EPI-USE Nexus</title>
        <meta name="description" content="Configure your system settings" />
      </Head>
      <Layout user={user}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
            <p className="text-gray-600">Configure your organization's system preferences.</p>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('general')}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'general'
                    ? 'border-company-navy text-company-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CogIcon className="mr-2 h-5 w-5" />
                General
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'export'
                    ? 'border-company-navy text-company-navy'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DocumentArrowDownIcon className="mr-2 h-5 w-5" />
                Data Export
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
                </div>
                <div className="card-body space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-blue-800">EPI-USE South Africa</h4>
                        <div className="text-sm text-blue-700 mt-1 space-y-1">
                          <p><strong>Currency:</strong> South African Rand (ZAR)</p>
                          <p><strong>Timezone:</strong> Africa/Johannesburg (SAST)</p>
                          <p><strong>Language:</strong> English (South Africa)</p>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          Company details are managed by system administrators and cannot be modified.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          )}

          {activeTab === 'export' && (
            <DataExport user={user} />
          )}
        </div>
      </Layout>
    </>
  );
}