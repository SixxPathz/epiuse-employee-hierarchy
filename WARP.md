# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

EPI-USE Employee Hierarchy Platform - A cloud-hosted web application for managing employee hierarchy with full CRUD operations, reporting structure management, visual org chart, role-based permissions, and data export capabilities.

**Architecture**: Monorepo with separate Next.js frontend and Express.js backend
**Database**: PostgreSQL with Prisma ORM
**Deployment**: Vercel (frontend), Railway (backend)

---

## Development Commands

### Backend (apps/backend)

```powershell
# Development
cd apps/backend
npm run dev                    # Start dev server with hot reload (port 5000)

# Database
npm run prisma:generate        # Generate Prisma client after schema changes
npm run prisma:migrate         # Create and apply new migration
npm run seed:prod              # Seed database with sample data (production build)
npm run prisma:seed            # Seed database with sample data (development)

# Testing
npm test                       # Run Jest tests
npm run test:watch             # Run tests in watch mode

# Production
npm run build                  # Compile TypeScript to dist/
npm start                      # Run production server from dist/
```

### Frontend (apps/frontend)

```powershell
# Development
cd apps/frontend
npm run dev                    # Start Next.js dev server (port 3000)

# Testing
npm run test                   # Run Jest tests
npm run test:watch             # Run tests in watch mode
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run Playwright tests with UI

# Linting
npm run lint                   # Run Next.js ESLint

# Production
npm run build                  # Build Next.js for production
npm start                      # Start production server
```

---

## Architecture Deep Dive

### Authentication & Authorization Flow

**JWT-based authentication** with role-based access control:
- User logs in → Backend generates JWT with userId, email, role
- JWT stored in localStorage on frontend
- `authMiddleware` (backend) validates token and fetches fresh user data from database on each request
- **Critical**: Authorization decisions use database values, NOT token claims

**Role Hierarchy**:
- `ADMIN`: Full system access, can manage all employees and roles
- `MANAGER`: Can manage subordinates in their hierarchy (recursive), view salaries, export data
- `EMPLOYEE`: View-only access to department colleagues and management chain

**Permission System**: Centralized in `apps/backend/src/config/permissions.ts` and mirrored in `apps/frontend/src/utils/permissions.ts`. Both backend and frontend use the same permission logic through `getUserPermissions()` and `checkPermission()` functions.

### Database Schema (Prisma)

**User Model** (`users` table):
- Stores authentication credentials and role
- One-to-one relation with Employee via email
- `mustChangePassword` flag for forced password updates
- `resetToken` and `resetTokenExpiry` for password reset flow

**Employee Model** (`employees` table):
- Self-referential relation for manager/subordinate hierarchy (`managerId`)
- Unique constraints on `email` and `employeeNumber`
- `department` field links employees to departments (string, not enum)
- `profilePicture` stores uploaded image paths or Gravatar URLs

**Key Design Decision**: User and Employee are separate entities linked by email. This allows for authentication accounts without employee records (future admin-only accounts) and maintains clean separation of concerns.

### Hierarchical Data Queries

**Recursive Subordinate Lookup** (`getAllSubordinateIds` in `apps/backend/src/api/employees.ts`):
- Used extensively in MANAGER role queries
- Recursively fetches all direct and indirect reports
- Critical for enforcing hierarchical data isolation

**Management Chain Traversal**:
- EMPLOYEE role builds upward chain by following `managerId` references
- Used to show employees their managers and department context

### API Structure

All routes under `/api/` prefix with the following endpoints:

**`/api/auth`** (`apps/backend/src/api/auth.ts`):
- POST `/login` - Authenticate user
- POST `/register` - Create new user (admin only)
- POST `/forgot-password` - Request password reset
- POST `/reset-password` - Complete password reset
- POST `/change-password` - Force password change for new users

**`/api/employees`** (`apps/backend/src/api/employees.ts`):
- GET `/` - List employees (filtered by role hierarchy, supports pagination, search, sorting)
- GET `/:id` - Get single employee details
- POST `/` - Create new employee
- PUT `/:id` - Update employee
- DELETE `/:id` - Delete employee (validation prevents deleting managers with subordinates)

**`/api/upload`** (`apps/backend/src/api/upload.ts`):
- POST `/profile-picture` - Upload profile picture (Multer-based)

**`/api/export`** (`apps/backend/src/api/export.ts`):
- GET `/employees/csv` - Export employee data as CSV
- GET `/employees/json` - Export employee data as JSON

**`/api/admin`** (`apps/backend/src/api/seed.ts`):
- POST `/seed` - Trigger database seeding (admin only)

### Frontend Architecture

**Page Structure**:
- `/` - Landing/login redirect
- `/auth/login` - Login page
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset completion
- `/dashboard` - Main dashboard with stats
- `/employees` - Employee table with CRUD operations
- `/org-chart` - Visual hierarchy tree (using react-d3-tree)
- `/profile` - Current user profile
- `/settings` - User settings

**State Management**:
- React Query (`@tanstack/react-query`) for server state
- Custom hook `useEmployees` for employee data fetching
- LocalStorage for auth token and user data
- No global state management (Redux, Zustand) - React Query handles caching

**API Client** (`apps/frontend/src/utils/api.ts`):
- Axios instance with request interceptor to attach JWT
- Response interceptor for 401 handling (auto-redirect to login)
- Base URL from `NEXT_PUBLIC_API_URL` env var

**Key Components**:
- `Layout.tsx` - Main app layout with navigation
- `EmployeeTable.tsx` - Paginated employee list
- `OrganizationChart.tsx` - D3-based hierarchy visualization
- `ProfilePictureUpload.tsx` - Gravatar fallback + upload UI
- `DataExport.tsx` - CSV/JSON export UI

---

## Environment Configuration

### Backend (.env)

Required variables:
```
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
PORT=5000
NODE_ENV=development

# Optional (email for password reset)
EMAIL_USER=...
EMAIL_APP_PASSWORD=...
RESEND_API_KEY=...
```

### Frontend (.env.local)

Required variables:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Critical Patterns & Constraints

### Data Integrity Rules

1. **Self-Management Prevention**: Employees cannot be their own manager (validated in backend)
2. **Circular Hierarchy Prevention**: Manager assignment validates no circular references
3. **CEO Has No Manager**: Allow `managerId: null` for top-level employees
4. **Manager Deletion Validation**: Cannot delete employee who has subordinates
5. **Unique Constraints**: Email and employeeNumber must be unique across all employees

### Security Considerations

1. **Token Validation**: Always fetch fresh user data from database in `authMiddleware`, never trust token claims alone
2. **Role-Based Filtering**: MANAGER and EMPLOYEE roles have strict WHERE clauses limiting data access
3. **Rate Limiting**: 100 requests per 15 minutes per IP on all `/api/` routes
4. **CORS Configuration**: Whitelist specific domains (localhost, Vercel, Netlify) with credentials support
5. **Helmet.js**: Security headers applied globally

### Testing Approach

- Backend uses Jest with Supertest for API testing
- Frontend uses Jest with React Testing Library
- E2E tests use Playwright (configured but not extensively implemented)
- No specific test framework assumption - check package.json scripts

### Department System

Departments are **string fields**, not enums:
- Allows dynamic department creation without schema migrations
- Frontend has predefined list in `apps/frontend/src/utils/departments.ts`
- Backend accepts any string value for flexibility

### Gravatar Integration

Profile pictures default to Gravatar based on email MD5 hash. Upload functionality overrides with custom image stored in `uploads/` directory.

---

## Development Workflow

1. **Database Changes**: Edit `apps/backend/prisma/schema.prisma` → `npm run prisma:migrate` → `npm run prisma:generate`
2. **Seed Data**: Use `npm run prisma:seed` (dev) or `npm run seed:prod` (production build) to populate sample data
3. **API Changes**: Update route in `apps/backend/src/api/` → Update frontend API call in hooks/pages
4. **Permission Changes**: Update both `apps/backend/src/config/permissions.ts` AND `apps/frontend/src/utils/permissions.ts` to maintain consistency
5. **Type Safety**: Prisma generates TypeScript types - use `@prisma/client` imports on backend, manually define on frontend

---

## Deployment Architecture

**Frontend (Vercel)**:
- Builds Next.js static/SSR pages
- Proxies `/api/*` requests to Railway backend (via vercel.json rewrites)
- Environment variables set in Vercel dashboard

**Backend (Railway)**:
- Runs Express server on PORT from env
- Connects to Railway PostgreSQL database
- Prisma migrations run automatically via Railway build process
- PM2 ecosystem config included but not actively used in Railway deployment

---

## Common Pitfalls

1. **Prisma Client Generation**: Always run `prisma generate` after schema changes or in CI/CD pipelines
2. **Role Filtering Logic**: Don't modify employee query WHERE clauses without understanding hierarchical security model
3. **Token vs Database Role**: Authorization MUST use database role, not JWT claim
4. **Windows Path Handling**: Use path.join() for file paths (uploads, static files) to ensure cross-platform compatibility
5. **Manager Deletion**: Check for subordinates before deleting to maintain hierarchy integrity
