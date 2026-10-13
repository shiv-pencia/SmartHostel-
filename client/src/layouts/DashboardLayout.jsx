
import { useState } from "react";
import { Outlet } from "react-router";

import Sidebar from "../components/dashboard/Sidebar.jsx";
import Topbar from "../components/dashboard/Topbar.jsx";

import { useAuth } from "../hooks/useAuth.js";

import "../styles/dashboard.css";

function DashboardLayout() {
    const { user } = useAuth();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const openSidebar = () => {
        setSidebarOpen(true);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="dashboard-shell">
            {sidebarOpen && (
                <button
                    type="button"
                    className="dashboard-sidebar-backdrop"
                    aria-label="Close navigation"
                    onClick={closeSidebar}
                />
            )}

            <Sidebar
                role={user.role}
                isOpen={sidebarOpen}
                onClose={closeSidebar}
            />

            <div className="dashboard-main">
                <Topbar onOpenMenu={openSidebar} />

                <main
                    id="dashboard-content"
                    className="dashboard-content"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DashboardLayout;
