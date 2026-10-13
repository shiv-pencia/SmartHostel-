# Smart Hostel — Frontend Client

The frontend web application for the **Smart Hostel Management System**, built with **React 19**, **Vite 8**, **React Router v8**, and **Axios**. It provides an intuitive, accessible, and responsive role-based portal for students, wardens, maintenance staff, and hostel administrators.

---

## Features

- **Modern Single Page Application (SPA)**: Powered by Vite 8 for lightning-fast HMR and minimal production bundles.
- **Global Authentication & Session State (`AuthProvider`)**:
  - Automatically restores user session on mount via `GET /api/v1/auth/me`.
  - Cookie-driven authentication lifecycle (`withCredentials: true`) eliminating insecure localStorage token storage.
  - Race-condition guard ensuring older responses never overwrite fresh authentication states.
- **Role-Based Access Control (RBAC) & Route Guards**:
  - **`ProtectedRoute`**: Requires an active session; preserves intended destination URLs for seamless post-login redirection.
  - **`RoleRoute`**: Enforces authorized roles (`student`, `warden`, `staff`, `admin`), preventing unauthorized privilege escalation.
  - **`GuestRoute`**: Protects `/login` and `/register`, redirecting logged-in users directly to their respective role home.
- **Responsive Dashboard System (`DashboardLayout`)**:
  - Dynamic, collapsible sidebar (`Sidebar`) populated from role-specific navigation manifests.
  - Topbar header (`Topbar`) with live session indicators (`SessionStatus`), user greeting, and secure logout.
  - Personalized `RoleDashboardPage` presenting actionable stats, module shortcuts, and recent operational metrics.
- **Admin User Management Portal (`AdminUsersPage`)**:
  - Searchable by user name and email.
  - Filterable by user role (`student`, `warden`, `staff`, `admin`) and account status (`active`, `inactive`).
  - Server-side paginated table with total record count and page indicators.
  - Slide-out details drawer (`UserDetailsPanel`) allowing direct status toggles and role modifications with server safety confirmations.
- **Student Authentication & Onboarding**:
  - **Login Page (`/login`)**: Client-side validation, live error highlighting, auto-clearing error states on input, and role-based redirect.
  - **Student Registration Page (`/register`)**: Strict validation rules matching backend security constraints (email format, 8+ char password bounds, confirm-password match, optional phone format validation).
- **Security & CSRF Protection**: Preconfigured Axios HTTP client automatically attaching the required `X-Requested-With: XMLHttpRequest` header to all mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Live Backend Health Monitor**: Dynamic status badge (`BackendStatus`) in the UI querying `/api/v1/health` with real-time connectivity feedback (Operational, Offline, or Checking).
- **Unit & Integration Test Suite**: Built with Vitest, React Testing Library, and Axios Mock Adapter, validating end-to-end authentication flows, route guards, user tables, search/filter interactions, status toggling, and role mutations.

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Component-based UI library (`react`, `react-dom`) |
| **Vite 8** | Next-generation frontend build tooling and dev server |
| **React Router v8** | Declarative client-side routing & route guards (`react-router`) |
| **Axios** | HTTP client with request/response interceptors & CSRF protection |
| **Lucide React** | Modern, accessible iconography (`lucide-react`) |
| **Vitest** | Native ESM unit and integration test runner (`vitest`) |
| **React Testing Library** | Component integration test utilities (`@testing-library/react`) |
| **Axios Mock Adapter** | HTTP network mocking for isolated integration testing |
| **ESLint** | Static code analysis with React hooks and refresh rules |

---

## Project Structure

```text
client/
├── public/                       # Static public assets & icons
│   ├── favicon.svg               # Application favicon
│   └── icons.svg                 # SVG sprite and iconography
├── src/
│   ├── api/                      # Core networking layer
│   │   ├── health.api.js         # Backend health ping API
│   │   └── httpClient.js         # Configured Axios instance with CSRF interceptors
│   ├── assets/                   # Image assets and graphics
│   │   └── hero.png              # Showcase hero illustration
│   ├── components/               # Shared reusable components
│   │   ├── common/
│   │   │   ├── BackendStatus.jsx # Real-time API connectivity monitor
│   │   │   └── SessionStatus.jsx # Active session & role status pill
│   │   ├── dashboard/            # Dashboard layout components
│   │   │   ├── DashboardCard.jsx # Metric & summary cards
│   │   │   ├── Sidebar.jsx       # Role-specific collapsible navigation drawer
│   │   │   └── Topbar.jsx        # Top application header with profile & logout
│   │   └── ui/                   # Reusable UI primitives
│   ├── config/                   # Client configurations
│   │   └── dashboardNavigation.js# Role navigation links and icons
│   ├── context/                  # Global React contexts
│   │   ├── AuthContext.js        # Auth context declaration
│   │   └── AuthProvider.jsx      # Session provider (cookie-driven)
│   ├── features/                 # Modular domain feature slices
│   │   ├── auth/                 # Authentication & authorization feature
│   │   │   ├── api/              # Auth API calls (register, login, logout, me)
│   │   │   ├── components/       # LoginForm, RegisterForm
│   │   │   ├── pages/            # LoginPage, RegisterPage
│   │   │   └── styles/           # auth.css modular styling
│   │   └── users/                # Admin user management feature
│   │       ├── api/              # users.api.js (queries, mutations)
│   │       ├── components/       # UserTable.jsx, UserDetailsPanel.jsx
│   │       ├── pages/            # AdminUsersPage.jsx
│   │       └── styles/           # users.css modular styling
│   ├── hooks/                    # Custom React hooks
│   │   └── useAuth.js            # Hook to consume AuthContext
│   ├── layouts/                  # Layout wrappers
│   │   ├── DashboardLayout.jsx   # Authenticated role dashboard shell
│   │   └── PublicLayout.jsx      # Top navigation, live status, and shared footer
│   ├── pages/                    # Standalone pages
│   │   ├── HomePage.jsx          # Landing page with feature showcase & role access
│   │   ├── RoleDashboardPage.jsx # Role-specific home view
│   │   ├── DashboardPage.jsx     # General dashboard landing
│   │   ├── ModulePlaceholderPage.jsx # Modular placeholder for upcoming modules
│   │   ├── ComingSoonPage.jsx    # Placeholder for upcoming modules
│   │   └── NotFoundPage.jsx      # 404 error page
│   ├── routes/                   # Routing configuration & guards
│   │   ├── AppRoutes.jsx         # Application route declarations
│   │   ├── ProtectedRoute.jsx    # Session verification guard
│   │   ├── RoleRoute.jsx         # Role-based access control guard
│   │   └── GuestRoute.jsx        # Guest-only guard
│   ├── styles/                   # Global style definitions
│   │   ├── global.css            # CSS reset, typography, and color tokens
│   │   └── dashboard.css         # Dashboard layout, sidebar, cards, and topbar styling
│   ├── test/                     # Integration test suite
│   │   ├── auth.integration.test.jsx # Authentication & routing tests
│   │   ├── users.integration.test.jsx# Admin user management tests
│   │   ├── mockBackend.js        # Mock HTTP responses & fixtures
│   │   └── setup.js              # Vitest setup & DOM cleanup
│   ├── utils/                    # Utility helpers
│   │   └── rolePaths.js          # Role path mappings and home route helpers
│   ├── App.jsx                   # Root application component with AuthProvider
│   └── main.jsx                  # React DOM root entry point
├── .env                          # Local environment variables (git-ignored)
├── .env.example                  # Environment variable template
├── index.html                    # Single-page HTML entry point
├── vite.config.js                # Vite build and plugin configuration
├── vitest.config.js              # Vitest test suite configuration
└── package.json                  # Dependencies and scripts
```

---

## Environment Variables

Copy `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:5001/api/v1` | Base URL of the backend API |

---

## Getting Started

### 1. Install Dependencies

From within the `client` directory:

```bash
npm install
```

### 2. Configure Environment

Ensure `client/.env` contains the correct backend URL:

```env
VITE_API_BASE_URL=http://localhost:5001/api/v1
```

### 3. Run the Development Server

```bash
npm run dev
```

The Vite dev server will start at:
```
http://localhost:5173
```

---

## Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| **`dev`** | `npm run dev` | Starts the Vite development server with HMR |
| **`build`** | `npm run build` | Compiles and optimizes assets into the `dist/` directory |
| **`preview`** | `npm run preview` | Locally serves the production build |
| **`lint`** | `npm run lint` | Runs ESLint to check for code quality and hook rules |
| **`test`** | `npm test` | Runs the full Vitest integration test suite once |
| **`test:watch`** | `npm run test:watch` | Runs Vitest in interactive watch mode |

---

## Application Routes

| Path | View Component | Access Guard | Description |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Public | Landing page featuring system overview, statistics, and role access portals |
| `/login` | `LoginPage` | Guest-only | Student & administrator login portal |
| `/register` | `RegisterPage` | Guest-only | Student registration and account creation |
| `/dashboard` | `DashboardRedirect` | Authenticated | Automatically redirects authenticated users to their role-specific home route |
| `/admin` | `RoleDashboardPage` | `admin` | Administrator overview with system statistics & management shortcuts |
| `/admin/users` | `AdminUsersPage` | `admin` | Full user management portal with search, filtering, status toggling, and role assignment |
| `/admin/hostels` | `ModulePlaceholderPage` | `admin` | Hostel block management module |
| `/admin/rooms` | `ModulePlaceholderPage` | `admin` | Room & bed inventory module |
| `/admin/reports` | `ModulePlaceholderPage` | `admin` | Reports & system analytics module |
| `/student` | `RoleDashboardPage` | `student` | Student overview with room info, complaint status, and quick links |
| `/student/allocation` | `ModulePlaceholderPage` | `student` | Room and bed allocation details module |
| `/student/complaints` | `ModulePlaceholderPage` | `student` | Maintenance complaint submission & tracking module |
| `/student/notices` | `ModulePlaceholderPage` | `student` | Hostel notice board module |
| `/warden` | `RoleDashboardPage` | `warden` | Warden overview with occupancy metrics, complaints, and visitor logs |
| `/warden/rooms` | `ModulePlaceholderPage` | `warden` | Room inspection and occupancy management module |
| `/warden/visitors` | `ModulePlaceholderPage` | `warden` | Visitor log and gate pass monitoring module |
| `/warden/complaints` | `ModulePlaceholderPage` | `warden` | Student complaint assignment and resolution module |
| `/staff` | `RoleDashboardPage` | `staff` | Maintenance staff overview with active repair tasks & workload |
| `/staff/tasks` | `ModulePlaceholderPage` | `staff` | Assigned maintenance work orders module |
| `/staff/maintenance` | `ModulePlaceholderPage` | `staff` | Maintenance history and completion logs module |
| `*` | `NotFoundPage` | Public | Custom 404 page with return-to-home navigation |
