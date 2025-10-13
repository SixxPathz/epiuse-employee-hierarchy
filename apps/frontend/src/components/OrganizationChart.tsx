
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  UserIcon,
  BuildingOfficeIcon 
} from '@heroicons/react/24/outline';
import api from '../utils/api';

export default function OrganizationChart() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'tree' | 'compact'>('tree');

  const { data: hierarchy, isLoading } = useQuery({
    queryKey: ['hierarchy'],
    queryFn: async () => {
      const response = await api.get('/employees/hierarchy/tree');
      return response.data.hierarchy;
    },
  });

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Search function to filter nodes
  const searchInHierarchy = (node: any, term: string): boolean => {
    if (!term) return true;
    
    const searchStr = term.toLowerCase();
    const matches = 
      node.name.toLowerCase().includes(searchStr) ||
      node.position.toLowerCase().includes(searchStr) ||
      node.email.toLowerCase().includes(searchStr) ||
      node.employeeNumber.toLowerCase().includes(searchStr);
    
    if (matches) return true;
    
    // Check if any children match
    if (node.children) {
      return node.children.some((child: any) => searchInHierarchy(child, term));
    }
    
    return false;
  };

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

  // Enhanced tree view with better styling and interactivity
  const renderTreeNode = (node: any, level = 0) => {
    if (!searchInHierarchy(node, searchTerm)) return null;
    
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indentLevel = level * 24; // 24px per level

    return (
      <div key={node.id} className="mb-2">
        <div 
          className="flex items-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
          style={{ marginLeft: `${indentLevel}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              onClick={() => toggleNode(node.id)}
              className="mr-2 p-1 rounded hover:bg-gray-100 flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRightIcon className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
          
          {/* Connection Line */}
          {level > 0 && (
            <div className="absolute w-6 h-px bg-gray-300" style={{ left: `${indentLevel - 12}px` }} />
          )}
          
          {/* Employee Avatar */}
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {node.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
          </div>
          
          {/* Employee Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{node.name}</h3>
              {level === 0 && <BuildingOfficeIcon className="h-4 w-4 text-amber-500" />}
            </div>
            <p className="text-xs text-gray-600 truncate">{node.position}</p>
            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
              <span>ID: {node.employeeNumber}</span>
              <span>•</span>
              <span className="truncate">{node.email}</span>
            </div>
          </div>
          
          {/* Team Size Badge */}
          {hasChildren && (
            <div className="flex-shrink-0 ml-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <UserIcon className="h-3 w-3 mr-1" />
                {node.children.length}
              </span>
            </div>
          )}
        </div>
        
        {/* Render Children */}
        {hasChildren && (isExpanded || !searchTerm) && (
          <div className="mt-2">
            {node.children.map((child: any) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Compact card view for better overview
  const renderCompactNode = (node: any) => (
    <div key={node.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {node.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{node.name}</h3>
          <p className="text-sm text-gray-600 truncate">{node.position}</p>
          <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
            <span>ID: {node.employeeNumber}</span>
            <span>•</span>
            <span className="truncate">{node.email}</span>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <UserIcon className="h-3 w-3 mr-1" />
              {node.children.length} direct reports
            </span>
          </div>
        )}
      </div>
    </div>
  );

  // Get all nodes for compact view
  const getAllNodes = (node: any): any[] => {
    let nodes = [node];
    if (node.children) {
      node.children.forEach((child: any) => {
        nodes.push(...getAllNodes(child));
      });
    }
    return nodes;
  };

  const allNodes = hierarchy ? getAllNodes(hierarchy) : [];
  const filteredNodes = allNodes.filter(node => searchInHierarchy(node, searchTerm));

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Organization Chart</h2>
              <p className="text-gray-600">Interactive company hierarchy with search</p>
            </div>
            
            {/* View Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setView('tree')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'tree' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Tree View
              </button>
              <button
                onClick={() => setView('compact')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  view === 'compact' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                List View
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees by name, position, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="card-body">
          {hierarchy ? (
            <div className="min-h-96">
              {view === 'tree' ? (
                <div className="space-y-2">
                  {renderTreeNode(hierarchy)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredNodes.map(node => renderCompactNode(node))}
                </div>
              )}
              
              {searchTerm && filteredNodes.length === 0 && (
                <div className="text-center py-12">
                  <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search terms
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No organizational data available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Contact your administrator to set up the organizational structure
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Statistics Card */}
      {hierarchy && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{allNodes.length}</div>
                <div className="text-sm text-gray-500">Total Employees</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {allNodes.filter(n => n.children && n.children.length > 0).length}
                </div>
                <div className="text-sm text-gray-500">Managers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.max(...allNodes.map(n => getAllNodes(n).length - 1))}
                </div>
                <div className="text-sm text-gray-500">Max Team Size</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}