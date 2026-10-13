
import { useState } from "react";
import {
    useNavigate,
    useLocation,
} from "react-router";

import { useAuth } from "../../../hooks/useAuth.js";
import { getRoleHome } from "../../../utils/rolePaths.js";

function LoginForm() {
    const navigate = useNavigate();
    const location = useLocation();

    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    /*
     * Handle input changes
     */
    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));

        setServerError("");
    };

    /*
     * Validate form
     */
    const validateForm = () => {
        const nextErrors = {};

        const email = formData.email.trim();

        if (!email) {
            nextErrors.email = "Email is required";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            nextErrors.email = "Enter a valid email address";
        }

        if (!formData.password) {
            nextErrors.password = "Password is required";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    /*
     * Submit login request
     */
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isSubmitting || !validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setServerError("");

        try {
            // Calls Axios through AuthProvider
            const user = await login({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });

            // Redirect to the appropriate dashboard
            const roleHome = getRoleHome(user.role);
            const requestedPath = location.state?.from;

            // Allow an internal intended destination
            const destination =
                typeof requestedPath === "string" &&
                    requestedPath.startsWith("/") &&
                    !requestedPath.startsWith("//")
                    ? requestedPath
                    : roleHome;

            navigate(destination, {
                replace: true,
            });

        } catch (error) {
            setServerError(
                error.message || "Login failed. Please try again."
            );

            if (Array.isArray(error.details)) {
                const fieldErrors = {};

                for (const issue of error.details) {
                    if (
                        ["email", "password"].includes(issue.field) &&
                        !fieldErrors[issue.field]
                    ) {
                        fieldErrors[issue.field] = issue.message;
                    }
                }

                setErrors(fieldErrors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
        >
            {serverError && (
                <div className="form-alert" role="alert">
                    {serverError}
                </div>
            )}

            <div className="form-field">
                <label htmlFor="login-email">
                    Email address
                </label>

                <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="student@example.com"
                    autoComplete="username"
                    value={formData.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.email)}
                    required
                />

                {errors.email && (
                    <p className="field-error" role="alert">
                        {errors.email}
                    </p>
                )}
            </div>

            <div className="form-field">
                <label htmlFor="login-password">
                    Password
                </label>

                <input
                    id="login-password"
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.password)}
                    required
                />

                {errors.password && (
                    <p className="field-error" role="alert">
                        {errors.password}
                    </p>
                )}
            </div>

            <button
                type="submit"
                className="button button-primary auth-submit"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
        </form>
    );
}

export default LoginForm;
