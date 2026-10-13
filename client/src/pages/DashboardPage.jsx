
import { useState } from "react";
import { useNavigate } from "react-router";

import { useAuth } from "../hooks/useAuth.js";

function DashboardPage({ title }) {
    const navigate = useNavigate();

    const { user, logout } = useAuth();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [error, setError] = useState("");

    const handleLogout = async () => {
        if (isLoggingOut) {
            return;
        }

        setIsLoggingOut(true);
        setError("");

        try {
            await logout();

            navigate("/login", {
                replace: true,
            });
        } catch (err) {
            setError(
                err.message || "Logout failed. Please try again."
            );
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <main className="container">
            <section className="simple-page">
                <p className="eyebrow">
                    SMART HOSTEL MANAGEMENT
                </p>

                <h1>{title}</h1>

                <p>
                    Welcome, <strong>{user.name}</strong>!
                </p>

                <div className="feature-card">
                    <h3>Your Account</h3>

                    <p>
                        <strong>Name:</strong> {user.name}
                    </p>

                    <p>
                        <strong>Email:</strong> {user.email}
                    </p>

                    <p>
                        <strong>Role:</strong> {user.role}
                    </p>
                </div>

                <p>
                    Your dashboard layout and hostel features
                    will be added in the next phases.
                </p>

                {error && (
                    <p role="alert" style={{ color: "#b91c1c" }}>
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    className="button button-primary"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
            </section>
        </main>
    );
}

export default DashboardPage;
