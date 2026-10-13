
import { Link } from "react-router";

import {
    ShieldCheck,
    CircleCheck,
    Database,
    ArrowUpRight,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth.js";

import {
    dashboardNavigation,
    roleLabels,
} from "../config/dashboardNavigation.js";

import DashboardCard from "../components/dashboard/DashboardCard.jsx";

const welcomeMessages = {
    admin: "Manage users, hostels, rooms and system operations.",
    student: "Access your hostel information and resident services.",
    warden: "Manage hostel residents and operational activities.",
    staff: "Review maintenance responsibilities and assigned work.",
};

function RoleDashboardPage() {
    const { user } = useAuth();

    const role = user.role;
    const roleName = roleLabels[role] ?? role;

    const modules = (
        dashboardNavigation[role] ?? []
    ).filter((item) => !item.end);

    return (
        <div className="dashboard-page-stack">
            <section className="dashboard-welcome">
                <div>
                    <p className="dashboard-section-label">
                        {roleName} Workspace
                    </p>

                    <h2>Welcome back, {user.name}!</h2>

                    <p>
                        {welcomeMessages[role] ??
                            "Welcome to Smart Hostel Management."}
                    </p>
                </div>
            </section>

            <section aria-label="Account overview">
                <div className="dashboard-cards-grid">
                    <DashboardCard
                        title="Account Status"
                        value={user.isActive ? "Active" : "Inactive"}
                        description="Your current account status"
                        icon={CircleCheck}
                    />

                    <DashboardCard
                        title="Your Role"
                        value={roleName}
                        description="Current access level"
                        icon={ShieldCheck}
                    />

                    <DashboardCard
                        title="Hostel Statistics"
                        value="Pending"
                        description="Live statistics will be connected later"
                        icon={Database}
                    />
                </div>
            </section>

            <section className="dashboard-module-section">
                <div className="dashboard-section-heading">
                    <div>
                        <h2>Workspace Modules</h2>

                        <p>
                            Explore the modules planned for your role.
                        </p>
                    </div>
                </div>

                <div className="dashboard-module-grid">
                    {modules.map((module) => {
                        const Icon = module.icon;

                        return (
                            <Link
                                key={module.path}
                                to={module.path}
                                className="dashboard-module-card"
                            >
                                <span className="dashboard-module-icon">
                                    <Icon
                                        size={22}
                                        strokeWidth={1.8}
                                        aria-hidden="true"
                                    />
                                </span>

                                <span className="dashboard-module-content">
                                    <strong>{module.label}</strong>

                                    <small>
                                        Module under development
                                    </small>
                                </span>

                                <ArrowUpRight
                                    size={18}
                                    className="dashboard-module-arrow"
                                    aria-hidden="true"
                                />
                            </Link>
                        );
                    })}
                </div>
            </section>

            <section className="dashboard-info-panel">
                <h3>System Development Status</h3>

                <p>
                    Authentication and user-management APIs have
                    been implemented. Other hostel operations
                    will be connected as we build their
                    backend and frontend modules.
                </p>
            </section>
        </div>
    );
}

export default RoleDashboardPage;
