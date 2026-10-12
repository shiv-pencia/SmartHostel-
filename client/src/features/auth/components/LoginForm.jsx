
import { useState } from "react";

import {
    loginUser,
} from "../api/auth.api.js";

function LoginForm() {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loggedInUser, setLoggedInUser] = useState(null);

    /*
     * Handle changes in input fields
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
     * Simple client-side validation
     */
    const validateForm = () => {
        const nextErrors = {};

        if (!formData.email.trim()) {
            nextErrors.email = "Email is required";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                formData.email.trim()
            )
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
     * Submit login form
     */
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isSubmitting || !validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setServerError("");
        setLoggedInUser(null);

        try {
            const user = await loginUser({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });

            setLoggedInUser(user);

            // No need to store JWT in localStorage.
            // Browser receives the HTTP-only cookie.

            setFormData((previous) => ({
                ...previous,
                password: "",
            }));

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

    /*
     * Display successful login
     */
    if (loggedInUser) {
        return (
            <div className="auth-success" role="status">
                <h2>Login successful</h2>

                <p>
                    Welcome, <strong>{loggedInUser.name}</strong>!
                </p>

                <p>
                    Role: <strong>{loggedInUser.role}</strong>
                </p>

                <p>
                    Your authentication cookie has been set.
                    Role-based dashboards will be connected
                    in Phase 3.6.
                </p>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="auth-form"
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
                    aria-describedby={
                        errors.email ? "login-email-error" : undefined
                    }
                    required
                />

                {errors.email && (
                    <p id="login-email-error" className="field-error">
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
                    aria-describedby={
                        errors.password
                            ? "login-password-error"
                            : undefined
                    }
                    required
                />

                {errors.password && (
                    <p
                        id="login-password-error"
                        className="field-error"
                    >
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
