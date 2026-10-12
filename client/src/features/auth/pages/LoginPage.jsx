
import { Link, useLocation } from "react-router";

import LoginForm from "../components/LoginForm.jsx";
import "../styles/auth.css";

function LoginPage() {
    const location = useLocation();

    const registrationSuccess =
        location.state?.registrationSuccess === true;

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-heading">
                    <p className="eyebrow">
                        SMART HOSTEL
                    </p>

                    <h1>Welcome back</h1>

                    <p>
                        Sign in to access your hostel account.
                    </p>
                </div>

                {registrationSuccess && (
                    <div className="form-success" role="status">
                        Account created successfully.
                        You can now log in.
                    </div>
                )}

                <LoginForm />

                <p className="auth-footer">
                    Don't have an account?{" "}
                    <Link to="/register">
                        Register as Student
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
