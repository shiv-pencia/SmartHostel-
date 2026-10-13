
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

import {
    LogOut,
    Menu,
    UserRound,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth.js";

import {
    dashboardNavigation,
    roleLabels,
} from "../../config/dashboardNavigation.js";

function Topbar({ onOpenMenu }) {
    const navigate = useNavigate();
    const location = useLocation();

    const { user, logout } = useAuth();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState("");

    const navigationItems =
        dashboardNavigation[user.role] ?? [];

    const currentPage = navigationItems.find(
        (item) => item.path === location.pathname
    );

    const pageTitle = currentPage?.label ?? "Dashboard";

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        setLogoutError("");

        try {
            await logout();

            navigate("/login", {
                replace: true,
            });
        } catch (error) {
            setLogoutError(
                error.message || "Unable to log out"
            );
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="dashboard-topbar">
            <div className="dashboard-topbar-content">
                <div className="dashboard-topbar-left">
                    <button
                        type="button"
                        className="dashboard-icon-button dashboard-menu-button"
                        onClick={onOpenMenu}
                        aria-label="Open navigation"
                        aria-controls="dashboard-sidebar"
                    >
                        <Menu size={22} aria-hidden="true" />
                    </button>

                    <div>
                        <p className="dashboard-topbar-eyebrow">
                            Smart Hostel Management
                        </p>

                        <h1>{pageTitle}</h1>
                    </div>
                </div>

                <div className="dashboard-topbar-actions">
                    <div className="dashboard-user-chip">
                        <span className="dashboard-user-avatar">
                            <UserRound size={19} aria-hidden="true" />
                        </span>

                        <span className="dashboard-user-details">
                            <strong>{user.name}</strong>

                            <small>
                                {roleLabels[user.role] ?? user.role}
                            </small>
                        </span>
                    </div>

                    <button
                        type="button"
                        className="dashboard-logout-button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                    >
                        <LogOut size={17} aria-hidden="true" />

                        <span>
                            {isLoggingOut ? "Logging out..." : "Logout"}
                        </span>
                    </button>
                </div>
            </div>

            {logoutError && (
                <p className="dashboard-topbar-error" role="alert">
                    {logoutError}
                </p>
            )}
        </header>
    );
}

export default Topbar;
