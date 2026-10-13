# Smart Hostel — Frontend Client

The frontend web application for the **Smart Hostel Management System**, built with **React 19**, **Vite**, **React Router v8**, and **Axios**. It provides an intuitive, accessible, and responsive user interface for students, wardens, staff, and hostel administrators.

---

## Features

- **Modern Single Page Application (SPA)**: Powered by Vite for lightning-fast HMR and minimal production bundles.
- **Responsive Layout & Design System**: Custom Vanilla CSS design tokens with clean typography, polished glassmorphism card surfaces, and mobile-friendly navigation.
- **Student Authentication & Onboarding**:
  - **Login Page (`/login`)**: Client-side validation, live error highlighting, auto-clearing error states on input, and secure session establishment.
  - **Student Registration Page (`/register`)**: Strict validation rules matching backend security constraints (email format, 8+ char password bounds, confirm-password match, optional phone format validation).
- **Security & CSRF Protection**: Preconfigured Axios HTTP client automatically attaching the required `X-Requested-With: XMLHttpRequest` header to all mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`) with cookie credentials enabled (`withCredentials: true`).
- **Live Backend Health Monitor**: Dynamic status badge (`BackendStatus`) in the UI querying `/api/v1/health` with real-time connectivity feedback (Operational, Offline, or Checking).
- **Robust Error Handling**: Standardized Axios interceptors converting network timeouts, server responses, and validation error arrays into component-friendly exceptions.
- **Extensible Architecture**: Feature-sliced folder organization (`features/auth`, `features/rooms`, `features/hostels`, `features/allocations`) designed for rapid modular development.

---

## Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Component-based UI framework |
| **Vite 8** | Next-generation frontend build tooling and dev server |
| **React Router v8** | Declarative client-side routing |
| **Axios** | HTTP client with request/response interceptors |
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
│   │   │   └── BackendStatus.jsx # Real-time API connectivity monitor
│   │   └── ui/                   # Reusable UI primitives (buttons, inputs)
│   ├── features/                 # Modular domain feature slices
│   │   ├── auth/                 # Authentication & authorization feature
│   │   │   ├── api/              # Auth API calls (register, login, logout, me)
│   │   │   ├── components/       # LoginForm, RegisterForm
│   │   │   ├── pages/            # LoginPage, RegisterPage
│   │   │   └── styles/           # auth.css modular styling
│   │   ├── allocations/          # Room & bed allocations feature (scaffold)
│   │   ├── hostels/              # Hostel block management feature (scaffold)
│   │   ├── rooms/                # Room inventory feature (scaffold)
│   │   └── users/                # User directory feature (scaffold)
│   ├── layouts/                  # Layout wrappers
│   │   └── PublicLayout.jsx      # Top navigation, live status, and shared footer
│   ├── pages/                    # General standalone pages
│   │   ├── HomePage.jsx          # Landing page with feature showcase & role access
│   │   ├── ComingSoonPage.jsx    # Placeholder for upcoming modules
│   │   └── NotFoundPage.jsx      # 404 error page
│   ├── routes/                   # Routing configuration
│   │   └── AppRoutes.jsx         # Application route declarations
│   ├── styles/                   # Global style definitions
│   │   └── global.css            # CSS reset, typography, and color tokens
│   ├── App.jsx                   # Root application component
│   └── main.jsx                  # React DOM root entry point
├── .env                          # Local environment variables (git-ignored)
├── .env.example                  # Environment variable template
├── index.html                    # Single-page HTML entry point
├── vite.config.js                # Vite build and plugin configuration
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

---

## Application Routes

| Path | Component | Description |
| :--- | :--- | :--- |
| `/` | `HomePage` | Landing page featuring system overview, statistics, and role access cards |
| `/login` | `LoginPage` | Student & administrator login portal |
| `/register` | `RegisterPage` | Student registration and account creation |
| `*` | `NotFoundPage` | 404 page for unmatched routes |
