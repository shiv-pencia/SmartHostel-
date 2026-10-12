
import { Link } from "react-router";

import BackendStatus from "../components/common/BackendStatus.jsx";

const features = [
    {
        title: "Hostel Management",
        description:
            "Manage hostels, rooms, beds and availability.",
    },
    {
        title: "Student Allocation",
        description:
            "Track room assignments and hostel occupancy.",
    },
    {
        title: "Complaints",
        description:
            "Submit complaints and monitor maintenance progress.",
    },
    {
        title: "Visitors & Attendance",
        description:
            "Manage visitor records and student attendance.",
    },
];

function HomePage() {
    return (
        <div className="container">
            <section className="hero">
                <p className="eyebrow">
                    SMART HOSTEL MANAGEMENT
                </p>

                <h1>
                    A smarter way to manage
                    <span> hostel life.</span>
                </h1>

                <p className="hero-description">
                    One platform for student accommodation,
                    hostel administration, maintenance,
                    and resident services.
                </p>

                <div className="hero-actions">
                    <Link
                        to="/login"
                        className="button button-primary"
                    >
                        Login
                    </Link>

                    <Link
                        to="/register"
                        className="button button-secondary"
                    >
                        Register as Student
                    </Link>
                </div>
            </section>

            <section className="features-section">
                <h2>System Modules</h2>

                <p className="section-description">
                    Features of our Smart Hostel
                    Management System.
                </p>

                <div className="feature-grid">
                    {features.map((feature) => (
                        <article
                            key={feature.title}
                            className="feature-card"
                        >
                            <h3>{feature.title}</h3>

                            <p>{feature.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section
                className="features-section"
                aria-label="API connectivity"
            >
                <h2>System Connectivity</h2>

                <p className="section-description">
                    Verify that the React frontend can
                    communicate with our Express backend.
                </p>

                <div style={{ maxWidth: "550px", marginTop: "24px" }}>
                    <BackendStatus />
                </div>
            </section>
        </div>
    );
}

export default HomePage;
