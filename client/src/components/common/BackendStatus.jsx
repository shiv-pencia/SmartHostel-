
import { useState } from "react";

import {
    checkBackendHealth,
} from "../../api/health.api.js";

function BackendStatus() {
    const [status, setStatus] = useState("idle");

    const [message, setMessage] = useState(
        "Backend connection has not been tested."
    );

    const handleCheckConnection = async () => {
        setStatus("loading");
        setMessage("Checking backend connection...");

        try {
            const result = await checkBackendHealth();

            if (!result.success) {
                throw new Error(
                    "Backend returned an unsuccessful response"
                );
            }

            setStatus("success");
            setMessage(result.message);

        } catch (error) {
            setStatus("error");

            setMessage(
                error.message || "Connection failed"
            );
        }
    };

    return (
        <section className="feature-card">
            <h3>Backend Connection</h3>

            <p>
                Test the connection between the
                React frontend and Express API.
            </p>

            <div style={{ marginTop: "20px" }}>
                <button
                    type="button"
                    className="button button-primary"
                    onClick={handleCheckConnection}
                    disabled={status === "loading"}
                >
                    {status === "loading"
                        ? "Checking..."
                        : "Test Connection"}
                </button>
            </div>

            <p
                role="status"
                aria-live="polite"
                style={{ marginTop: "16px" }}
            >
                {message}
            </p>
        </section>
    );
}

export default BackendStatus;
