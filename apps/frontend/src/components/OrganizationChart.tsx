
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { OrganizationNode } from '../types';
import { 
  MagnifyingGlassIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  UserIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';

export default function OrganizationChart() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  // Only tree view is enabled

  const { data: hierarchy, isLoading } = useQuery<OrganizationNode>({
    queryKey: ['hierarchy'],
    queryFn: async () => {
      const response = await api.get('/api/employees/hierarchy/tree');
      return response.data.hierarchy as OrganizationNode;
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
  const searchInHierarchy = (node: OrganizationNode, term: string): boolean => {
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
      return node.children.some((child: OrganizationNode) => searchInHierarchy(child, term));
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

  // Get role-based styling for visual differentiation
  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return {
          bgGradient: 'from-red-500 to-pink-600',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          badgeColor: 'bg-red-100 text-red-800',
          icon: ShieldCheckIcon,
          roleLabel: 'Admin'
        };
      case 'MANAGER':
        return {
          bgGradient: 'from-blue-500 to-blue-600',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          badgeColor: 'bg-blue-100 text-blue-800',
          icon: UserGroupIcon,
          roleLabel: 'Manager'
        };
      default: // EMPLOYEE
        return {
          bgGradient: 'from-gray-400 to-gray-500',
          borderColor: 'border-gray-200',
          bgColor: 'bg-white',
          textColor: 'text-gray-700',
          badgeColor: 'bg-gray-100 text-gray-800',
          icon: UserIcon,
          roleLabel: 'Employee'
        };
    }
  };

  // Dynamic color system for unlimited hierarchy levels
  const getLevelColors = (level: number) => {
    const colorSets = [
      { bar: 'bg-blue-400', badge: 'bg-blue-100 text-blue-800' },
      { bar: 'bg-indigo-400', badge: 'bg-indigo-100 text-indigo-800' },
      { bar: 'bg-purple-400', badge: 'bg-purple-100 text-purple-800' },
      { bar: 'bg-pink-400', badge: 'bg-pink-100 text-pink-800' },
      { bar: 'bg-rose-400', badge: 'bg-rose-100 text-rose-800' },
      { bar: 'bg-orange-400', badge: 'bg-orange-100 text-orange-800' },
      { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-800' },
      { bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-800' },
      { bar: 'bg-lime-400', badge: 'bg-lime-100 text-lime-800' },
      { bar: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-800' },
      { bar: 'bg-teal-400', badge: 'bg-teal-100 text-teal-800' },
      { bar: 'bg-cyan-400', badge: 'bg-cyan-100 text-cyan-800' },
      { bar: 'bg-sky-400', badge: 'bg-sky-100 text-sky-800' },
      { bar: 'bg-violet-400', badge: 'bg-violet-100 text-violet-800' },
      { bar: 'bg-fuchsia-400', badge: 'bg-fuchsia-100 text-fuchsia-800' }
    ];
    
    // For levels beyond our color set, cycle through with opacity variations
    if (level <= colorSets.length) {
      return colorSets[level - 1];
    } else {
      const cycleIndex = (level - 1) % colorSets.length;
      const opacity = Math.max(0.3, 1 - Math.floor((level - 1) / colorSets.length) * 0.2);
      return {
        bar: `${colorSets[cycleIndex].bar} opacity-${Math.round(opacity * 100)}`,
        badge: colorSets[cycleIndex].badge
      };
    }
  };

  // Enhanced tree view with role-based visual differences
  const renderTreeNode = (node: OrganizationNode, level = 0) => {
    if (!searchInHierarchy(node, searchTerm)) return null;

    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indentLevel = level * 32; // Increased from 24px to 32px per level for better hierarchy
    const roleStyles = getRoleStyles(node.role);
    const RoleIcon = roleStyles.icon;
    const levelColors = getLevelColors(level);
    
    // Different card sizes based on role
    const getCardStyling = () => {
      if (node.role === 'ADMIN') {
        return 'p-4 border-2 shadow-lg';
      } else if (node.role === 'MANAGER') {
        return 'p-3 border-2 shadow-md';
      } else {
        return 'p-2 border shadow-sm';
      }
    };

    return (
      <div key={node.id} className="mb-2 relative">
        {/* Level indicator bar */}
        {level > 0 && (
          <div 
            className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${levelColors.bar}`}
            style={{ marginLeft: `${indentLevel - 4}px` }}
          />
        )}
        <div
          className={`flex items-center ${getCardStyling()} ${roleStyles.bgColor} rounded-lg ${roleStyles.borderColor} hover:shadow-lg transition-all duration-200 hover:scale-[1.01] relative`}
          style={{ marginLeft: level > 0 ? `${indentLevel}px` : '0px' }}
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


          {/* Employee Avatar with Role-based Sizing */}
          <div className="flex-shrink-0 mr-3">
            <div className={`${
              node.role === 'ADMIN' ? 'w-12 h-12' : 
              node.role === 'MANAGER' ? 'w-10 h-10' : 'w-8 h-8'
            } bg-gradient-to-br ${roleStyles.bgGradient} rounded-full flex items-center justify-center text-white font-semibold ${
              node.role === 'ADMIN' ? 'text-sm' : 
              node.role === 'MANAGER' ? 'text-sm' : 'text-xs'
            } shadow-lg`}>
              {node.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
          </div>

          {/* Employee Info with Role-based Typography */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={`${
                node.role === 'ADMIN' ? 'text-lg font-bold' : 
                node.role === 'MANAGER' ? 'text-base font-semibold' : 'text-sm font-medium'
              } ${roleStyles.textColor} truncate`}>{node.name}</h3>
              <RoleIcon className={`${
                node.role === 'ADMIN' ? 'h-5 w-5' : 'h-4 w-4'
              } ${roleStyles.textColor}`} />
              {level === 0 && <BuildingOfficeIcon className="h-5 w-5 text-amber-500" />}
            </div>
            <p className={`${
              node.role === 'ADMIN' ? 'text-sm font-medium' : 
              node.role === 'MANAGER' ? 'text-sm' : 'text-xs'
            } text-gray-600 truncate`}>{node.position}</p>
            <div className={`flex flex-col md:flex-row md:items-center md:space-x-3 mt-1 ${
              node.role === 'ADMIN' ? 'text-sm' : 'text-xs'
            } text-gray-500 space-y-1 md:space-y-0`}>
              <span>ID: {node.employeeNumber}</span>
              <span className="hidden md:inline">•</span>
              <span className="truncate">{node.email}</span>
            </div>
          </div>

          {/* Team Size Badge */}
          {hasChildren && (
            <div className="flex-shrink-0 ml-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleStyles.badgeColor}`}>
                <UserIcon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{node.children.length}</span>
                <span className="sm:hidden">{node.children.length}</span>
              </span>
            </div>
          )}
        </div>

        {/* Render Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {node.children.map((child: OrganizationNode) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Compact card view with role-based styling
  const renderCompactNode = (node: OrganizationNode) => {
    const roleStyles = getRoleStyles(node.role);
    const RoleIcon = roleStyles.icon;
    
    return (
      <div key={node.id} className={`${roleStyles.bgColor} rounded-lg border ${roleStyles.borderColor} p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}>
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${roleStyles.bgGradient} rounded-full flex items-center justify-center text-white font-semibold shadow-lg`}>
            {node.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className={`text-lg font-semibold ${roleStyles.textColor} truncate`}>{node.name}</h3>
              <RoleIcon className={`h-4 w-4 ${roleStyles.textColor}`} />
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm text-gray-600 truncate">{node.position}</p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${roleStyles.badgeColor}`}>
                {roleStyles.roleLabel}
              </span>
            </div>
            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
              <span>ID: {node.employeeNumber}</span>
              <span>•</span>
              <span className="truncate">{node.email}</span>
            </div>
          </div>
          {node.children && node.children.length > 0 && (
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${roleStyles.badgeColor}`}>
                <UserIcon className="h-3 w-3 mr-1" />
                {node.children.length} direct reports
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Get all nodes for compact view
  const getAllNodes = (node: OrganizationNode): OrganizationNode[] => {
    let nodes: OrganizationNode[] = [node];
    if (node.children) {
      node.children.forEach((child: OrganizationNode) => {
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
            
            {/* Only tree view, no toggle */}
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
              <div className="space-y-2">
                {renderTreeNode(hierarchy)}
              </div>
              
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
                <div className="text-2xl font-bold text-blue-600">
                  {allNodes.filter(n => n.role === 'MANAGER').length}
                </div>
                <div className="text-sm text-gray-500">Managers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {allNodes.filter(n => n.role === 'ADMIN').length}
                </div>
                <div className="text-sm text-gray-500">Admins</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}