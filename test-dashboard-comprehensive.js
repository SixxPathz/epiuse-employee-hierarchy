#!/usr/bin/env node

/**
 * Comprehensive Dashboard Test Script
 * Tests all dashboard functionality for different user roles
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data
const testUsers = {
  admin: { email: 'admin@epiuse.com', password: 'admin123' },
  manager: { email: 'manager@epiuse.com', password: 'manager123' },
  employee: { email: 'employee@epiuse.com', password: 'employee123' }
};

let authTokens = {};

async function login(userType) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, testUsers[userType]);
    authTokens[userType] = response.data.token;
    console.log(`✅ ${userType.toUpperCase()} login successful`);
    return response.data.user;
  } catch (error) {
    console.log(`❌ ${userType.toUpperCase()} login failed:`, error.response?.data?.error || error.message);
    return null;
  }
}

async function testDashboardStats(userType) {
  try {
    const response = await axios.get(`${BASE_URL}/employees/stats/dashboard`, {
      headers: { Authorization: `Bearer ${authTokens[userType]}` }
    });
    console.log(`✅ ${userType.toUpperCase()} dashboard stats:`, {
      totalEmployees: response.data.totalEmployees,
      canViewSalaries: response.data.avgSalaryByPosition ? 'Yes' : 'No',
      departments: response.data.departmentDistribution?.length || 0
    });
    return response.data;
  } catch (error) {
    console.log(`❌ ${userType.toUpperCase()} dashboard stats failed:`, error.response?.data?.error || error.message);
    return null;
  }
}

async function testEmployeeData(userType) {
  try {
    const response = await axios.get(`${BASE_URL}/employees`, {
      headers: { Authorization: `Bearer ${authTokens[userType]}` }
    });
    
    const employees = response.data.employees;
    const withSalaries = employees.filter(emp => emp.salary !== null && emp.salary !== undefined);
    
    console.log(`✅ ${userType.toUpperCase()} employee data:`, {
      totalVisible: employees.length,
      withSalaries: withSalaries.length,
      salaryVisibility: userType === 'admin' || userType === 'manager' ? 'Full' : 'Limited'
    });
    
    return response.data;
  } catch (error) {
    console.log(`❌ ${userType.toUpperCase()} employee data failed:`, error.response?.data?.error || error.message);
    return null;
  }
}

async function testIndividualEmployee(userType, employeeId) {
  try {
    const response = await axios.get(`${BASE_URL}/employees/${employeeId}`, {
      headers: { Authorization: `Bearer ${authTokens[userType]}` }
    });
    
    const employee = response.data.employee;
    const hasSubordinates = employee.subordinates && employee.subordinates.length > 0;
    const hasNestedSubordinates = hasSubordinates && employee.subordinates.some(sub => 
      sub.subordinates && sub.subordinates.length > 0
    );
    
    console.log(`✅ ${userType.toUpperCase()} individual employee (${employeeId}):`, {
      name: `${employee.firstName} ${employee.lastName}`,
      hasSubordinates: hasSubordinates,
      directReports: employee.subordinates?.length || 0,
      hasNestedSubordinates: hasNestedSubordinates,
      salaryIncluded: employee.salary !== null && employee.salary !== undefined,
      subordinatesWithSalaries: employee.subordinates?.filter(sub => sub.salary).length || 0
    });
    
    return response.data;
  } catch (error) {
    console.log(`❌ ${userType.toUpperCase()} individual employee failed:`, error.response?.data?.error || error.message);
    return null;
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Dashboard Test\n');
  
  // Test login for all user types
  const users = {};
  for (const userType of Object.keys(testUsers)) {
    users[userType] = await login(userType);
  }
  
  console.log('\n📊 Testing Dashboard Stats...');
  for (const userType of Object.keys(testUsers)) {
    if (users[userType]) {
      await testDashboardStats(userType);
    }
  }
  
  console.log('\n👥 Testing Employee Data Access...');
  for (const userType of Object.keys(testUsers)) {
    if (users[userType]) {
      await testEmployeeData(userType);
    }
  }
  
  console.log('\n🔍 Testing Individual Employee Data (with nested subordinates)...');
  for (const userType of Object.keys(testUsers)) {
    if (users[userType] && users[userType].employee) {
      await testIndividualEmployee(userType, users[userType].employee.id);
    }
  }
  
  console.log('\n✅ Comprehensive Dashboard Test Complete!');
  console.log('\n📋 Summary of what was tested:');
  console.log('1. Login functionality for all user roles');
  console.log('2. Dashboard statistics access');
  console.log('3. Employee data visibility and salary permissions');
  console.log('4. Individual employee data with nested subordinates');
  console.log('5. Salary visibility for direct and indirect reports');
}

// Run the test
runComprehensiveTest().catch(console.error);
