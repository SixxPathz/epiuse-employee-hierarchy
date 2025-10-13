
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

export default function OrganizationChart() {
  const { data: hierarchy, isLoading } = useQuery({
    queryKey: ['hierarchy'],
    queryFn: async () => {
      const response = await api.get('/employees/hierarchy/tree');
      return response.data.hierarchy;
    },
  });

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const renderNode = (node: any, level = 0) => (
    <div key={node.id} className={`ml-${level * 8}`}>
      <div className="card mb-4 max-w-md">
        <div className="card-body">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold">
                  {node.name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{node.name}</h3>
              <p className="text-sm text-gray-600">{node.position}</p>
              <p className="text-xs text-gray-500">{node.email}</p>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-medium">ID:</span> {node.employeeNumber}
          </div>
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="ml-8 border-l-2 border-gray-200 pl-4">
          {node.children.map((child: any) => renderNode(child, level + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h2 className="text-2xl font-bold text-gray-900">Organization Chart</h2>
          <p className="text-gray-600">Company hierarchy</p>
        </div>
        <div className="card-body">
          {hierarchy ? (
            <div className="overflow-x-auto">
              {renderNode(hierarchy)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No organizational data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}