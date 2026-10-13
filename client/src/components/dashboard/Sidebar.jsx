
import { NavLink } from "react-router";
import { Building2, X } from "lucide-react";

import {
    dashboardNavigation,
    roleLabels,
} from "../../config/dashboardNavigation.js";

function Sidebar({
    role,
    isOpen,
    onClose,
}) {
    const navigationItems = dashboardNavigation[role] ?? [];

    return (
        <aside
            id="dashboard-sidebar"
            className={`dashboard-sidebar ${isOpen ? "is-open" : ""}`}
            aria-label="Dashboard sidebar"
        >
            <div className="dashboard-sidebar-header">
                <NavLink
                    to={`/${role}`}
                    className="dashboard-brand"
                    onClick={onClose}
                >
                    <span className="dashboard-brand-icon">
                        <Building2 size={22} aria-hidden="true" />
                    </span>

                    <span>
                        <strong>Smart Hostel</strong>
                        <small>Management System</small>
                    </span>
                </NavLink>

                <button
                    type="button"
                    className="dashboard-mobile-close"
                    aria-label="Close navigation"
                    onClick={onClose}
                >
                    <X size={21} aria-hidden="true" />
                </button>
            </div>

            <div className="dashboard-sidebar-content">
                <p className="dashboard-sidebar-caption">
                    {roleLabels[role] ?? "Dashboard"}
                </p>

                <nav aria-label="Dashboard navigation">
                    <ul className="dashboard-nav-list">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <li key={item.path}>
                                    <NavLink
                                        to={item.path}
                                        end={item.end ?? false}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            [
                                                "dashboard-nav-link",
                                                isActive ? "is-active" : "",
                                            ].join(" ")
                                        }
                                    >
                                        <Icon
                                            size={19}
                                            strokeWidth={1.8}
                                            aria-hidden="true"
                                        />

                                        <span>{item.label}</span>
                                    </NavLink>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>

            <div className="dashboard-sidebar-footer">
                <span className="dashboard-version">
                    Smart Hostel · v1
                </span>
            </div>
        </aside>
    );
}

export default Sidebar;
