
<div align="center">
  <img src="apps/frontend/public/logo.png" alt="EPI-USE Logo" width="120"/>
</div>
# EPI-USE Employee Hierarchy Platform – User Guide

## Accessing the App

1. **Open the App:**  
  Go to this URL: https://epiuse-employee-hierarchy.vercel.app/

2. **Login:**  
   Enter your email and password.

   ### Example Login Accounts

   - **Admin:**
     - Email: thabo.mthembu@epiuse.com
     - Password: securepassword123

   - **Manager:**
     - Email: sipho.ngcobo@epiuse.com
     - Password: securepassword123

   - **Employee:**
     - Email: kagiso.morake@epiuse.com
     - Password: securepassword123

   ![Login Screen](apps/frontend/public/demo/login.png)

3. **Forgot Password:**  
   Click "Forgot Password" to reset via email if needed.
   ![Forgot Password](apps/frontend/public/demo/forgot-password.png)

---

## Dashboard

- After login, you land on the dashboard.
- See organization stats, quick actions, and navigation.
- Example:  
  ![Dashboard](apps/frontend/public/demo/dashboard.png)

---

## Employees Page

- View all employees.
- Sort and filter by name, position, department, etc.
- Search for employees.
- Add, edit, or delete employees (if permitted).
- Example:  
  ![Employee Table](apps/frontend/public/demo/employees-table.png)

---

## Organization Chart

- Visualize the reporting structure as a tree.
- Click nodes to view employee details.
- Example:  
  ![Org Chart](apps/frontend/public/demo/org-chart.png)

---

## Profile

- View and update your personal info.
- Change your password.
- Upload or remove your profile picture, or use Gravatar(defaut).
- Example:  
  ![Profile Page](apps/frontend/public/demo/profile.png)
  

---

## Data Export (Admins)

- Export employee data as CSV or JSON.
- Example:  
  ![Data Export](apps/frontend/public/demo/data-export.png)

---

## Settings (Admins)

- Company info

---

## Logout

- Click "Sign out" log out.

---

## Role-Based Features

- **Admin:** Full access to all features, including employee CRUD, data export, and settings.
- **Manager:** Can view and manage direct reports, see department stats, and update employee profiles.
- **Employee:** Can view their own profile, see the org chart, and connect with team members.
