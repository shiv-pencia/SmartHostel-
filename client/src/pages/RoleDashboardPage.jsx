import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
    ShieldCheck,
    CircleCheck,
    BedDouble,
    MessageSquareWarning,
    Users,
    ArrowUpRight,
    Building2,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth.js";
import {
    dashboardNavigation,
    roleLabels,
} from "../config/dashboardNavigation.js";

import DashboardCard from "../components/dashboard/DashboardCard.jsx";
import { getDashboardOverview } from "../features/reports/api/reports.api.js";

const welcomeMessages = {
    admin: "Manage users, hostels, rooms, allocations, and operational analytics.",
    student: "Access your room allocation, submit complaints, and view notices.",
    warden: "Monitor hostel residents, room vacancies, and maintenance complaints.",
    staff: "Review assigned maintenance tasks and report repair status.",
};

function RoleDashboardPage() {
    const { user } = useAuth();
    const [overview, setOverview] = useState(null);
    const [loadingOverview, setLoadingOverview] = useState(true);

    const role = user?.role;
    const roleName = roleLabels[role] ?? role;

    const modules = (
        dashboardNavigation[role] ?? []
    ).filter((item) => !item.end);

    useEffect(() => {
        const controller = new AbortController();

        const fetchOverview = async () => {
            try {
                const data = await getDashboardOverview(controller.signal);
                setOverview(data);
            } catch (err) {
                // Ignore cancellation or graceful fallback
            } finally {
                setLoadingOverview(false);
            }
        };

        fetchOverview();

        return () => controller.abort();
    }, []);

    const isAdminOrWarden = role === "admin" || role === "warden";

    return (
        <div className="dashboard-page-stack">
            <section className="dashboard-welcome">
                <div>
                    <p className="dashboard-section-label">
                        {roleName} Workspace
                    </p>

                    <h2>Welcome back, {user?.name}!</h2>

                    <p>
                        {welcomeMessages[role] ??
                            "Welcome to Smart Hostel Management."}
                    </p>
                </div>
            </section>

            <section aria-label="Account and operations overview">
                <div className="dashboard-cards-grid">
                    <DashboardCard
                        title="Account Status"
                        value={user?.isActive ? "Active" : "Inactive"}
                        description="Your verified account status"
                        icon={CircleCheck}
                    />

                    {isAdminOrWarden ? (
                        <>
                            <DashboardCard
                                title="Hostel Occupancy"
                                value={
                                    loadingOverview
                                        ? "Loading..."
                                        : `${overview?.occupancy?.occupancyRate ?? 0}%`
                                }
                                description={
                                    overview
                                        ? `${overview.occupancy.occupiedBeds} of ${overview.occupancy.usableBeds} beds occupied`
                                        : "Live occupancy calculation"
                                }
                                icon={BedDouble}
                            />

                            <DashboardCard
                                title="Pending Grievances"
                                value={
                                    loadingOverview
                                        ? "Loading..."
                                        : `${overview?.complaints?.open ?? 0}`
                                }
                                description={
                                    overview
                                        ? `${overview.complaints.urgent ?? 0} urgent priority`
                                        : "Action required"
                                }
                                icon={MessageSquareWarning}
                            />

                            <DashboardCard
                                title="Student Residents"
                                value={
                                    loadingOverview
                                        ? "Loading..."
                                        : `${overview?.students?.allocated ?? 0}`
                                }
                                description={
                                    overview
                                        ? `${overview.students.total} registered students`
                                        : "Active allocations"
                                }
                                icon={Users}
                            />
                        </>
                    ) : role === "staff" ? (
                        <>
                            <DashboardCard
                                title="Your Role"
                                value={roleName}
                                description="Maintenance and operations access"
                                icon={ShieldCheck}
                            />

                            <DashboardCard
                                title="Pending Work Orders"
                                value={
                                    loadingOverview
                                        ? "Loading..."
                                        : `${overview?.complaints?.open ?? 0}`
                                }
                                description="Grievances awaiting resolution"
                                icon={MessageSquareWarning}
                            />
                        </>
                    ) : (
                        <>
                            <DashboardCard
                                title="Your Role"
                                value={roleName}
                                description="Hostel resident access"
                                icon={ShieldCheck}
                            />

                            <DashboardCard
                                title="Hostel Operations"
                                value="Online"
                                description="Portal operational 24/7"
                                icon={Building2}
                            />
                        </>
                    )}
                </div>
            </section>

            {/* Quick module links */}
            <section className="dashboard-module-section">
                <div className="dashboard-section-heading">
                    <div>
                        <h2>Workspace Modules</h2>
                        <p>Quick access to features available for your role.</p>
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
                                    <small>Access module</small>
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

            {/* System Status info */}
            <section className="dashboard-info-panel">
                <h3>Smart Hostel Operational Intelligence</h3>
                <p>
                    Student room and bed allocations, grievance complaint workflows,
                    and occupancy analytics telemetry are active and synchronized with
                    real-time database consistency.
                </p>
            </section>
        </div>
    );
}

export default RoleDashboardPage;
