
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
import AdminHostelsPage from "../features/hostels/pages/AdminHostelsPage.jsx";
import AdminRoomsPage from "../features/rooms/pages/AdminRoomsPage.jsx";
import AdminAllocationsPage from "../features/allocations/pages/AdminAllocationsPage.jsx";
import StudentAllocationPage from "../features/allocations/pages/StudentAllocationPage.jsx";

import StudentComplaintsPage from "../features/complaints/pages/StudentComplaintsPage.jsx";
import AdminComplaintsPage from "../features/complaints/pages/AdminComplaintsPage.jsx";
import StaffTasksPage from "../features/complaints/pages/StaffTasksPage.jsx";

import AdminReportsPage from "../features/reports/pages/AdminReportsPage.jsx";

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
            {/* Public pages */}
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

            {/* Authenticated application */}
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

                        <Route
                            path="users"
                            element={<AdminUsersPage />}
                        />

                        <Route
                            path="hostels"
                            element={<AdminHostelsPage />}
                        />

                        <Route
                            path="rooms"
                            element={<AdminRoomsPage />}
                        />

                        <Route
                            path="allocations"
                            element={<AdminAllocationsPage />}
                        />

                        <Route
                            path="complaints"
                            element={<AdminComplaintsPage />}
                        />

                        {/* Operations & Inventory reporting */}
                        <Route
                            path="reports"
                            element={<AdminReportsPage />}
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
                            element={<StudentAllocationPage />}
                        />

                        <Route
                            path="complaints"
                            element={<StudentComplaintsPage />}
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
                            element={<AdminComplaintsPage />}
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
                            element={<StaffTasksPage />}
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

            {/* Unknown routes */}
            <Route
                path="*"
                element={<NotFoundPage />}
            />
        </Routes>
    );
}

export default AppRoutes;
