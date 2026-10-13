
import { Link } from "react-router";
import { Construction, ArrowLeft } from "lucide-react";

import { useAuth } from "../hooks/useAuth.js";
import { getRoleHome } from "../utils/rolePaths.js";

function ModulePlaceholderPage({ title }) {
    const { user } = useAuth();

    return (
        <section className="dashboard-placeholder">
            <span className="dashboard-placeholder-icon">
                <Construction size={30} aria-hidden="true" />
            </span>

            <p className="dashboard-section-label">
                Upcoming Module
            </p>

            <h2>{title}</h2>

            <p>
                This module is part of our Smart Hostel
                Management System. Its database, API and
                interface will be connected in a later phase.
            </p>

            <Link
                to={getRoleHome(user.role)}
                className="dashboard-back-link"
            >
                <ArrowLeft size={17} aria-hidden="true" />
                Back to dashboard
            </Link>
        </section>
    );
}

export default ModulePlaceholderPage;
