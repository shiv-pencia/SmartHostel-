
import { useState } from "react";
import { useNavigate } from "react-router";

import {
    registerStudent,
} from "../api/auth.api.js";

const initialForm = {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
};

function RegisterForm() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    /*
     * Handle input updates
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
            ...(name === "password"
                ? { confirmPassword: "" }
                : {}),
        }));

        setServerError("");
    };

    /*
     * Validate registration form
     */
    const validateForm = () => {
        const nextErrors = {};

        const name = formData.name.trim();
        const email = formData.email.trim();
        const phone = formData.phone.trim();

        if (name.length < 2 || name.length > 100) {
            nextErrors.name =
                "Name must have 2 to 100 characters";
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            nextErrors.email = "Enter a valid email address";
        }

        if (formData.password.length < 8) {
            nextErrors.password =
                "Password must have at least 8 characters";
        } else if (
            new TextEncoder().encode(formData.password).length > 72
        ) {
            nextErrors.password =
                "Password cannot exceed 72 bytes";
        }

        if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
            nextErrors.phone =
                "Phone must contain 10 to 15 digits";
        }

        if (!formData.confirmPassword) {
            nextErrors.confirmPassword =
                "Please confirm your password";
        } else if (
            formData.confirmPassword !== formData.password
        ) {
            nextErrors.confirmPassword =
                "Passwords do not match";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    /*
     * Register student
     */
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (isSubmitting || !validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setServerError("");

        try {
            const payload = {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            };

            if (formData.phone.trim()) {
                payload.phone = formData.phone.trim();
            }

            await registerStudent(payload);

            navigate("/login", {
                replace: true,
                state: {
                    registrationSuccess: true,
                },
            });

        } catch (error) {
            setServerError(
                error.message ||
                "Registration failed. Please try again."
            );

            if (Array.isArray(error.details)) {
                const fieldErrors = {};

                for (const issue of error.details) {
                    if (
                        Object.hasOwn(initialForm, issue.field) &&
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
                <label htmlFor="register-name">
                    Full name
                </label>

                <input
                    id="register-name"
                    name="name"
                    type="text"
                    placeholder="Rahul Sharma"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.name)}
                    required
                />

                {errors.name && (
                    <p className="field-error" role="alert">
                        {errors.name}
                    </p>
                )}
            </div>

            <div className="form-field">
                <label htmlFor="register-email">
                    Email address
                </label>

                <input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="rahul@example.com"
                    autoComplete="email"
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
                <label htmlFor="register-phone">
                    Phone number (optional)
                </label>

                <input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    placeholder="9876543210"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.phone)}
                />

                {errors.phone && (
                    <p className="field-error" role="alert">
                        {errors.phone}
                    </p>
                )}
            </div>

            <div className="form-field">
                <label htmlFor="register-password">
                    Password
                </label>

                <input
                    id="register-password"
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
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

            <div className="form-field">
                <label htmlFor="register-confirm-password">
                    Confirm password
                </label>

                <input
                    id="register-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.confirmPassword)}
                    required
                />

                {errors.confirmPassword && (
                    <p className="field-error" role="alert">
                        {errors.confirmPassword}
                    </p>
                )}
            </div>

            <button
                type="submit"
                className="button button-primary auth-submit"
                disabled={isSubmitting}
            >
                {isSubmitting
                    ? "Creating account..."
                    : "Create Account"}
            </button>
        </form>
    );
}

export default RegisterForm;
