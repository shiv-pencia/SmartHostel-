
import { Link } from "react-router";

import RegisterForm from "../components/RegisterForm.jsx";
import "../styles/auth.css";

function RegisterPage() {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-heading">
                    <p className="eyebrow">
                        SMART HOSTEL
                    </p>

                    <h1>Create your account</h1>

                    <p>
                        Register as a student to access hostel
                        services and accommodation information.
                    </p>
                </div>

                <RegisterForm />

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link to="/login">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;
