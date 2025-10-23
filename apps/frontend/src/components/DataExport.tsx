import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  DocumentArrowDownIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ChartBarIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { User } from '../types';
import { getUserPermissions } from '../utils/permissions';

interface DataExportProps {
  user: User;
}

export default function DataExport({ user }: DataExportProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const permissions = getUserPermissions(user.role);

  // Export statistics removed per request

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Export employees as CSV
  const exportEmployeesMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/api/export/employees/csv', {
        responseType: 'blob'
      });
      return response;
    },
    onSuccess: (response) => {
      const filename = response.headers['content-disposition']
        ?.match(/filename="(.+)"/)?.[1] || 'employees_export.csv';
      downloadFile(response.data, filename);
      toast.success(`✅ Employee data successfully exported to ${filename}. Check your downloads folder.`, { duration: 5000 });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(`❌ Failed to export employee data: ${errorMessage || 'Please try again or contact support.'}`, { duration: 5000 });
    },
    onSettled: () => {
      setIsExporting(null);
    }
  });

  // Export hierarchy as JSON
  const exportHierarchyMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/api/export/hierarchy/json', {
        responseType: 'blob'
      });
      return response;
    },
    onSuccess: (response) => {
      const filename = response.headers['content-disposition']
        ?.match(/filename="(.+)"/)?.[1] || 'organization_hierarchy.json';
      downloadFile(response.data, filename);
      toast.success(`✅ Organization hierarchy successfully exported to ${filename}. Check your downloads folder.`, { duration: 5000 });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || error.message;
      toast.error(`❌ Failed to export hierarchy data: ${errorMessage || 'Please try again or contact support.'}`, { duration: 5000 });
    },
    onSettled: () => {
      setIsExporting(null);
    }
  });

  const handleExport = (type: string) => {
    setIsExporting(type);
    
    switch (type) {
      case 'employees':
        exportEmployeesMutation.mutate();
        break;
      case 'hierarchy':
        exportHierarchyMutation.mutate();
        break;
    }
  };

  if (!permissions.canViewEmployees) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Restricted</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to export data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Statistics removed */}

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Employee Data Export */}
        <div className="card">
          <div className="card-body text-center">
            <TableCellsIcon className="mx-auto h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              Export complete employee database including personal information, positions, and hierarchy relationships.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Format: CSV</p>
              <p className="text-xs text-gray-500">Includes: All employee fields, manager relationships</p>
            </div>
            <button
              onClick={() => handleExport('employees')}
              disabled={isExporting === 'employees'}
              className="mt-4 btn-primary w-full disabled:opacity-50"
            >
              {isExporting === 'employees' ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span>Export CSV</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Organization Hierarchy Export */}
        <div className="card">
          <div className="card-body text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Organization Hierarchy</h3>
            <p className="text-sm text-gray-600 mb-4">
              Export the complete organizational structure as a hierarchical tree with all reporting relationships.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Format: JSON</p>
              <p className="text-xs text-gray-500">Includes: Nested hierarchy, all relationships</p>
            </div>
            <button
              onClick={() => handleExport('hierarchy')}
              disabled={isExporting === 'hierarchy'}
              className="mt-4 btn-primary w-full disabled:opacity-50"
            >
              {isExporting === 'hierarchy' ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span>Export JSON</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Export Information */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">Export Information</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Data Formats</h4>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• <strong>CSV:</strong> Compatible with Excel, Google Sheets, and other spreadsheet applications</li>
                <li>• <strong>JSON:</strong> Structured data format suitable for technical analysis and system integration</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Data Security</h4>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• All exports respect role-based permissions</li>
                <li>• Manager exports include only subordinate employee data</li>
                <li>• Exported files contain timestamp and user information</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Best Practices</h4>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>• Store exported files securely</li>
                <li>• Use appropriate filters for large employee exports</li>
                <li>• Verify data integrity after export</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}