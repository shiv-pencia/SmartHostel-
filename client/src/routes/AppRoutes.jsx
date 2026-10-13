
import {
    Routes,
    Route,
    Navigate,
} from "react-router";

import PublicLayout from "../layouts/PublicLayout.jsx";
import DashboardLayout from "../layouts/DashboardLayout.jsx";

import HomePage from "../pages/HomePage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

import RoleDashboardPage from "../pages/RoleDashboardPage.jsx";
import ModulePlaceholderPage from "../pages/ModulePlaceholderPage.jsx";

import LoginPage from "../features/auth/pages/LoginPage.jsx";
import RegisterPage from "../features/auth/pages/RegisterPage.jsx";

import AdminUsersPage from "../features/users/pages/AdminUsersPage.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";
import GuestRoute from "./GuestRoute.jsx";

import { useAuth } from "../hooks/useAuth.js";
import { getRoleHome } from "../utils/rolePaths.js";

function DashboardRedirect() {
    const { user } = useAuth();

    return (
        <Navigate
            to={getRoleHome(user?.role)}
            replace
        />
    );
}

function AppRoutes() {
    return (
        <Routes>
            {/* Public website */}
            <Route element={<PublicLayout />}>
                <Route
                    index
                    element={<HomePage />}
                />

                <Route element={<GuestRoute />}>
                    <Route
                        path="login"
                        element={<LoginPage />}
                    />

                    <Route
                        path="register"
                        element={<RegisterPage />}
                    />
                </Route>
            </Route>

            {/* Protected application */}
            <Route element={<ProtectedRoute />}>
                <Route
                    path="dashboard"
                    element={<DashboardRedirect />}
                />

                {/* Administrator */}
                <Route
                    element={
                        <RoleRoute allowedRoles={["admin"]} />
                    }
                >
                    <Route
                        path="admin"
                        element={<DashboardLayout />}
                    >
                        <Route
                            index
                            element={<RoleDashboardPage />}
                        />

                        {/* REAL USER MANAGEMENT */}
                        <Route
                            path="users"
                            element={<AdminUsersPage />}
                        />

                        <Route
                            path="hostels"
                            element={
                                <ModulePlaceholderPage
                                    title="Hostel Management"
                                />
                            }
                        />

                        <Route
                            path="rooms"
                            element={
                                <ModulePlaceholderPage
                                    title="Room & Bed Management"
                                />
                            }
                        />

                        <Route
                            path="reports"
                            element={
                                <ModulePlaceholderPage
                                    title="Reports & Analytics"
                                />
                            }
                        />

                        <Route
                            path="*"
                            element={<NotFoundPage />}
                        />
                    </Route>
                </Route>

                {/* Student */}
                <Route
                    element={
                        <RoleRoute allowedRoles={["student"]} />
                    }
                >
                    <Route
                        path="student"
                        element={<DashboardLayout />}
                    >
                        <Route
                            index
                            element={<RoleDashboardPage />}
                        />

                        <Route
                            path="allocation"
                            element={
                                <ModulePlaceholderPage
                                    title="My Allocation"
                                />
                            }
                        />

                        <Route
                            path="complaints"
                            element={
                                <ModulePlaceholderPage
                                    title="My Complaints"
                                />
                            }
                        />

                        <Route
                            path="notices"
                            element={
                                <ModulePlaceholderPage
                                    title="Hostel Notices"
                                />
                            }
                        />
                    </Route>
                </Route>

                {/* Warden */}
                <Route
                    element={
                        <RoleRoute allowedRoles={["warden"]} />
                    }
                >
                    <Route
                        path="warden"
                        element={<DashboardLayout />}
                    >
                        <Route
                            index
                            element={<RoleDashboardPage />}
                        />

                        <Route
                            path="rooms"
                            element={
                                <ModulePlaceholderPage
                                    title="Room Management"
                                />
                            }
                        />

                        <Route
                            path="visitors"
                            element={
                                <ModulePlaceholderPage
                                    title="Visitor Management"
                                />
                            }
                        />

                        <Route
                            path="complaints"
                            element={
                                <ModulePlaceholderPage
                                    title="Complaint Management"
                                />
                            }
                        />
                    </Route>
                </Route>

                {/* Maintenance staff */}
                <Route
                    element={
                        <RoleRoute allowedRoles={["staff"]} />
                    }
                >
                    <Route
                        path="staff"
                        element={<DashboardLayout />}
                    >
                        <Route
                            index
                            element={<RoleDashboardPage />}
                        />

                        <Route
                            path="tasks"
                            element={
                                <ModulePlaceholderPage
                                    title="Assigned Tasks"
                                />
                            }
                        />

                        <Route
                            path="maintenance"
                            element={
                                <ModulePlaceholderPage
                                    title="Maintenance Records"
                                />
                            }
                        />
                    </Route>
                </Route>
            </Route>

            {/* Unknown frontend routes */}
            <Route
                path="*"
                element={<NotFoundPage />}
            />
        </Routes>
    );
}

export default AppRoutes;
