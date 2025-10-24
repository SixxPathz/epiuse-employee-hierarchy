
<div align="center">
  <img src="apps/frontend/public/logo.png" alt="EPI-USE Logo" width="120"/>
</div>

# EPI-USE Employee Hierarchy Platform – User Guide

## Getting Started

### **Accessing the Application**
1. **Open the App:** Navigate to https://epiuse-employee-hierarchy.vercel.app/
2. **Login:** Enter your email and password credentials

### **Demo Login Accounts**
- **Admin/CEO:**
  - Email: `thabo.mthembu@epiuse.com`
  - Password: `securepassword123`

- **Manager:**
  - Email: `sipho.ngcobo@epiuse.com`
  - Password: `securepassword123`

- **Employee:**
  - Email: `kagiso.morake@epiuse.com`
  - Password: `securepassword123`

### **Password Reset**
- Click "Forgot Password" on the login screen
- Enter your email address to receive a reset link
- Check your email and follow the secure reset process

---

## Dashboard Overview

The dashboard provides role-specific insights and quick access to key features:

### **Admin Dashboard**
- **Organizational Metrics**: Total employees, department distribution, management ratios
- **Quick Actions**: Add employees, create managers, export data
- **System Overview**: Company-wide statistics and trends

**Screenshot Placeholder:** *Admin dashboard showing organizational metrics cards, department distribution chart, and quick action buttons*

### **Manager Dashboard**
- **Team Metrics**: Direct reports, indirect reports, total team size
- **Department Analytics**: Team performance and organizational structure
- **Management Tools**: Quick access to add employees and sub-managers

**Screenshot Placeholder:** *Manager dashboard displaying team metrics, direct/indirect reports count, and management action buttons*

### **Employee Dashboard**
- **Personal Overview**: Your profile information and team connections
- **Organizational View**: Company structure and colleague directory
- **Profile Management**: Update personal information and settings

**Screenshot Placeholder:** *Employee dashboard with personal profile summary and team directory access*

---

## Employee Management

### **Viewing Employees**
- **Search & Filter**: Multi-criteria search by name, employee number, department
- **Sorting Options**: Sort by any column (name, position, salary, etc.)
- **Role-Based Visibility**: See employees based on your access level
- **Pagination**: Navigate through large employee lists efficiently

**Screenshot Placeholder:** *Employee table showing search filters, sortable columns, and pagination controls*

### **Adding Employees** *(Admin & Manager)*

#### **For Administrators:**
1. Click "Add Employee" button
2. Fill in employee details (name, email, employee number, position, salary, birth date)
3. **Select Department**: Choose from existing departments
4. **Assign Manager**: Select from available managers in the chosen department
5. Submit to create the employee

**Screenshot Placeholder:** *Admin add employee form showing all fields including department selection and manager assignment dropdown*

#### **For Managers:**
1. Click "Add Employee" button
2. Fill in employee details
3. **Department**: Auto-filled with your department (locked)
4. **Manager Selection**: Choose to assign the employee to:
   - **Yourself** (default option)
   - **Other managers** in your department
5. Submit to create the employee

**Screenshot Placeholder:** *Manager add employee form with department field locked and manager selection dropdown showing "You" and other department managers*

### **Adding Managers/Sub-Managers**

#### **For Administrators:**
1. Click "Add Manager" button
2. Fill in manager details
3. **Reports To**: Select who this manager reports to:
   - **CEO**: Creates a department head
   - **Other Manager**: Creates a sub-manager
4. **Department**: Auto-fills based on supervisor selection

**Screenshot Placeholder:** *Admin add manager form with "Reports To" dropdown showing CEO and other manager options*

#### **For Managers:**
1. Click "Add Sub-Manager" button
2. Fill in sub-manager details
3. **Department**: Auto-filled and locked to your department
4. **Reports To**: Automatically set to you
5. Sub-manager will have management privileges within your department

**Screenshot Placeholder:** *Manager add sub-manager form with department field locked and informational message about reporting structure*

### **Editing Employees**
- Click the edit icon next to any employee you have permission to modify
- **Manager Reassignment**: Managers can now reassign employees to other managers within their department
- Update any field including salary, position, department, and manager assignment
- Changes are validated and saved immediately

**Screenshot Placeholder:** *Edit employee modal showing all editable fields with manager reassignment dropdown for managers*

### **Deleting Employees**
- Click the delete icon (if you have permission)
- **Protection**: Cannot delete managers who have subordinates
- **CEO Protection**: Cannot delete the only CEO in the organization
- Confirmation required before permanent deletion

---

## Organization Chart

### **Interactive Hierarchy View**
- **Visual Tree**: Complete organizational structure displayed as an interactive tree
- **Node Details**: Click any employee node to view detailed information
- **Navigation**: Zoom, pan, and navigate through large organizational structures
- **Real-time Updates**: Chart reflects current organizational structure

**Screenshot Placeholder:** *Interactive organization chart showing hierarchical tree structure with CEO at top and departments branching below*

### **Features**
- **Unlimited Depth**: Supports complex multi-level hierarchies
- **Department Grouping**: Visual indication of departmental boundaries
- **Role Indicators**: Different visual styles for Admins, Managers, and Employees

**Screenshot Placeholder:** *Close-up view of org chart nodes showing different visual styles for different roles and clickable employee details*

---

## Profile Management

### **Personal Profile**
- **View Information**: See your complete employee profile
- **Edit Details**: Update personal information (name, contact details)
- **Profile Picture**: 
  - **Gravatar**: Automatic avatar based on email address
  - **Custom Upload**: Upload your own profile picture
  - **Remove Picture**: Revert to Gravatar default

**Screenshot Placeholder:** *Profile page showing user information, profile picture options, and edit profile form*

### **Password Management**
- **Change Password**: Update your login password securely
- **Security Requirements**: Minimum 6 characters with validation
- **Forced Changes**: New users must change default passwords

**Screenshot Placeholder:** *Password change modal with current password, new password, and confirm password fields*

---

## Data Export *(Admin & Manager)*

### **Export Options**
- **CSV Format**: Spreadsheet-compatible employee data
- **JSON Format**: Structured data for system integration
- **Filtered Exports**: Export based on current search/filter criteria

**Screenshot Placeholder:** *Data export page showing format selection (CSV/JSON) and export button with preview of data to be exported*

### **Available Data**
- **Admin**: Full access to all employee data including salaries
- **Manager**: Team data within their departmental hierarchy
- **Security**: Sensitive data filtered based on permissions

---

## Settings *(Admin Only)*

### **System Configuration**
- **Company Information**: Update organizational details
- **User Management**: Manage system-wide user settings
- **Security Settings**: Configure authentication and access controls

**Screenshot Placeholder:** *Settings page showing company information form, user management options, and security configuration panels*

---

## Role-Based Features

### **Admin (CEO/System Administrator)**
- **Full System Access**: Manage entire organization
- **Cross-Department Operations**: Create, edit, delete employees anywhere
- **Manager Assignment**: Create department heads and assign reporting structures
- **Data Export**: Full organizational data in CSV/JSON formats
- **Salary Visibility**: View all employee salaries and compensation
- **System Settings**: Access to configuration and administrative tools
- **Flexible Assignment**: Assign employees to any manager in selected departments

### **Manager (Department Heads/Team Leads)**
- **Department Management**: Full control within your department
- **Flexible Employee Assignment**: Assign employees to yourself OR other managers in your department
- **Sub-Manager Creation**: Create and manage sub-managers under your supervision
- **Team Analytics**: View comprehensive team metrics and performance data
- **Employee Editing**: Update information for all employees in your hierarchy
- **Manager Reassignment**: Reassign employees between managers within your department
- **Team Data Export**: Export data for your team and subordinates
- **Salary Access**: View salaries for your direct and indirect reports

### **Employee (Standard Users)**
- **Profile Management**: Update your personal information and password
- **Organizational View**: Access to company org chart and colleague directory
- **Team Directory**: View information about colleagues and team members
- **Limited Access**: View public information while maintaining privacy

---

## Latest Features

### **Enhanced Manager Assignment System**
- **Intra-Department Flexibility**: Managers can assign employees to other managers within their department
- **Visual Indicators**: Clear "(You)" labels and helpful text guide assignment decisions
- **Smart Validation**: System prevents invalid cross-department assignments
- **Improved UX**: Dropdown selections with contextual information

### **Advanced Department Management**
- **Auto-Population**: Department fields intelligently fill based on context
- **Locked Fields**: Appropriate fields are locked to prevent invalid changes
- **Visual Feedback**: Clear indicators show departmental relationships

### **Enhanced Security**
- **Department Boundaries**: Strict enforcement of departmental access controls
- **Role Validation**: Backend validation ensures proper permission enforcement
- **Audit Trail**: Complete tracking of organizational changes

---

## Logout

Click the "Sign Out" button in the navigation menu to securely log out of the application.

---

## Tips for Success

1. **Use Search Effectively**: Combine name, employee number, and department filters for precise results
2. **Leverage Manager Assignment**: Take advantage of flexible assignment options for better team organization
3. **Regular Profile Updates**: Keep your profile information current for better team communication
4. **Explore the Org Chart**: Use the interactive chart to understand organizational relationships
5. **Export Data Regularly**: Managers and admins should export team data for backup and analysis

---
