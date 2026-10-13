
import { useAuth } from "../../hooks/useAuth.js";

function SessionStatus() {
    const {
        status,
        sessionError,
        refreshSession,
    } = useAuth();

    if (status === "loading") {
        return (
            <main className="container">
                <section className="simple-page" role="status">
                    <h2>Checking your session...</h2>
                    <p>Please wait while we verify your login.</p>
                </section>
            </main>
        );
    }

    if (status === "error") {
        return (
            <main className="container">
                <section className="simple-page">
                    <h2>Unable to verify your session</h2>

                    <p role="alert">
                        {sessionError || "Please try again."}
                    </p>

                    <button
                        type="button"
                        className="button button-primary"
                        onClick={refreshSession}
                    >
                        Retry
                    </button>
                </section>
            </main>
        );
    }

    return null;
}

export default SessionStatus;
