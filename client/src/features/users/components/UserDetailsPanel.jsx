
import {
    useEffect,
    useRef,
    useState,
} from "react";

import { X } from "lucide-react";

import {
    getUserById,
    updateUser,
    updateUserRole,
    updateUserStatus,
} from "../api/users.api.js";

const editableRoles = [
    { value: "student", label: "Student" },
    { value: "warden", label: "Warden" },
    { value: "staff", label: "Maintenance Staff" },
];

function UserDetailsPanel({
    userId,
    onClose,
    onChanged,
}) {
    const closeButtonRef = useRef(null);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [form, setForm] = useState({
        name: "",
        phone: "",
    });

    const [selectedRole, setSelectedRole] =
        useState("student");

    const [saving, setSaving] = useState("");
    const [confirmation, setConfirmation] = useState("");

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const isBusy = Boolean(saving);
    const isAdminAccount = user?.role === "admin";

    /*
     * Load selected user
     */
    useEffect(() => {
        const controller = new AbortController();

        const loadUser = async () => {
            setLoading(true);
            setLoadError("");

            try {
                const result = await getUserById(
                    userId,
                    controller.signal
                );

                if (controller.signal.aborted) return;

                setUser(result);

                setForm({
                    name: result.name ?? "",
                    phone: result.phone ?? "",
                });

                setSelectedRole(result.role);
            } catch (err) {
                if (controller.signal.aborted) return;

                setLoadError(
                    err.message || "Unable to load user"
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadUser();

        return () => controller.abort();
    }, [userId]);

    /*
     * Focus close button on opening.
     * Support Escape when not saving.
     */
    useEffect(() => {
        closeButtonRef.current?.focus();

        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !isBusy) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [onClose, isBusy]);

    /*
     * Update local state after a successful mutation
     */
    const applyUpdatedUser = (updatedUser, message) => {
        setUser(updatedUser);

        setForm({
            name: updatedUser.name ?? "",
            phone: updatedUser.phone ?? "",
        });

        setSelectedRole(updatedUser.role);
        setConfirmation("");
        setError("");
        setNotice(message);

        onChanged(updatedUser);
    };

    /*
     * Save name and phone
     */
    const handleSaveProfile = async (event) => {
        event.preventDefault();

        if (!user || isBusy) return;

        setError("");
        setNotice("");

        const name = form.name.trim();
        const phone = form.phone.trim();

        if (name.length < 2 || name.length > 100) {
            setError("Name must have 2 to 100 characters");
            return;
        }

        if (phone && !/^\+?[0-9]{10,15}$/.test(phone)) {
            setError("Enter a valid phone number");
            return;
        }

        const changes = {};

        if (name !== user.name) {
            changes.name = name;
        }

        if (phone !== (user.phone ?? "")) {
            changes.phone = phone || null;
        }

        if (Object.keys(changes).length === 0) {
            setNotice("No profile changes to save.");
            return;
        }

        setSaving("profile");

        try {
            const updated = await updateUser(
                user.id,
                changes
            );

            applyUpdatedUser(
                updated,
                "Profile updated successfully."
            );
        } catch (err) {
            setError(
                err.message || "Unable to update profile"
            );
        } finally {
            setSaving("");
        }
    };

    /*
     * Save selected role after confirmation
     */
    const handleChangeRole = async () => {
        if (
            !user ||
            isBusy ||
            isAdminAccount ||
            selectedRole === user.role
        ) {
            return;
        }

        if (confirmation !== "role") {
            setError("");
            setNotice("");
            setConfirmation("role");
            return;
        }

        setSaving("role");
        setError("");
        setNotice("");

        try {
            const updated = await updateUserRole(
                user.id,
                selectedRole
            );

            applyUpdatedUser(
                updated,
                "User role updated successfully."
            );
        } catch (err) {
            setError(
                err.message || "Unable to change user role"
            );
        } finally {
            setSaving("");
            setConfirmation("");
        }
    };

    /*
     * Activate/deactivate after confirmation
     */
    const handleToggleStatus = async () => {
        if (!user || isBusy || isAdminAccount) return;

        if (confirmation !== "status") {
            setError("");
            setNotice("");
            setConfirmation("status");
            return;
        }

        setSaving("status");
        setError("");
        setNotice("");

        try {
            const updated = await updateUserStatus(
                user.id,
                !user.isActive
            );

            applyUpdatedUser(
                updated,
                updated.isActive
                    ? "Account activated successfully."
                    : "Account deactivated successfully."
            );
        } catch (err) {
            setError(
                err.message || "Unable to change account status"
            );
        } finally {
            setSaving("");
            setConfirmation("");
        }
    };

    return (
        <div className="users-modal-root">
            <button
                type="button"
                className="users-modal-backdrop"
                aria-label="Close user details"
                onClick={onClose}
                disabled={isBusy}
            />

            <section
                className="users-detail-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-panel-title"
            >
                <div className="users-detail-header">
                    <div>
                        <p className="dashboard-section-label">
                            Account Management
                        </p>
                        <h2 id="user-panel-title">
                            User Details
                        </h2>
                    </div>

                    <button
                        ref={closeButtonRef}
                        type="button"
                        className="users-panel-close"
                        onClick={onClose}
                        disabled={isBusy}
                        aria-label="Close details"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <div className="users-detail-body">
                    {loading && (
                        <p role="status">Loading user details...</p>
                    )}

                    {!loading && loadError && (
                        <p className="users-message is-error" role="alert">
                            {loadError}
                        </p>
                    )}

                    {!loading && user && (
                        <>
                            <div className="users-detail-identity">
                                <span className="users-avatar is-large">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>

                                <div>
                                    <h3>{user.name}</h3>
                                    <p>{user.email}</p>
                                    <small>ID: {user.id}</small>
                                </div>
                            </div>

                            {error && (
                                <p
                                    className="users-message is-error"
                                    role="alert"
                                >
                                    {error}
                                </p>
                            )}

                            {notice && (
                                <p
                                    className="users-message is-success"
                                    role="status"
                                >
                                    {notice}
                                </p>
                            )}

                            <form
                                onSubmit={handleSaveProfile}
                                className="users-edit-form"
                            >
                                <h3>Basic Information</h3>

                                <label htmlFor="edit-user-name">
                                    Full name
                                </label>

                                <input
                                    id="edit-user-name"
                                    value={form.name}
                                    maxLength={100}
                                    onChange={(event) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            name: event.target.value,
                                        }))
                                    }
                                    disabled={isBusy}
                                    required
                                />

                                <label htmlFor="edit-user-phone">
                                    Phone number
                                </label>

                                <input
                                    id="edit-user-phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={(event) =>
                                        setForm((previous) => ({
                                            ...previous,
                                            phone: event.target.value,
                                        }))
                                    }
                                    disabled={isBusy}
                                    placeholder="Optional"
                                />

                                <button
                                    type="submit"
                                    className="button button-primary"
                                    disabled={isBusy}
                                >
                                    {saving === "profile"
                                        ? "Saving..."
                                        : "Save Profile"}
                                </button>
                            </form>

                            <div className="users-detail-section">
                                <h3>Role Management</h3>

                                {isAdminAccount ? (
                                    <p className="users-help-text">
                                        Administrator roles cannot be
                                        modified through this interface.
                                    </p>
                                ) : (
                                    <>
                                        <label htmlFor="edit-user-role">
                                            User role
                                        </label>

                                        <select
                                            id="edit-user-role"
                                            value={selectedRole}
                                            disabled={isBusy}
                                            onChange={(event) => {
                                                setSelectedRole(event.target.value);
                                                setConfirmation("");
                                            }}
                                        >
                                            {editableRoles.map((role) => (
                                                <option
                                                    key={role.value}
                                                    value={role.value}
                                                >
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>

                                        {confirmation === "role" && (
                                            <p className="users-confirm-text">
                                                Confirm changing this user's role
                                                to <strong>{selectedRole}</strong>.
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            className="button button-secondary"
                                            disabled={
                                                isBusy ||
                                                selectedRole === user.role
                                            }
                                            onClick={handleChangeRole}
                                        >
                                            {saving === "role"
                                                ? "Updating..."
                                                : confirmation === "role"
                                                    ? "Confirm Role Change"
                                                    : "Update Role"}
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="users-detail-section">
                                <h3>Account Status</h3>

                                <p>
                                    Current status:{" "}
                                    <strong>
                                        {user.isActive ? "Active" : "Inactive"}
                                    </strong>
                                </p>

                                {isAdminAccount ? (
                                    <p className="users-help-text">
                                        Administrator account status
                                        cannot be modified here.
                                    </p>
                                ) : (
                                    <>
                                        {confirmation === "status" && (
                                            <p className="users-confirm-text">
                                                Are you sure you want to{" "}
                                                {user.isActive
                                                    ? "deactivate"
                                                    : "activate"}{" "}
                                                this account?
                                            </p>
                                        )}

                                        <button
                                            type="button"
                                            className={
                                                user.isActive
                                                    ? "users-danger-button"
                                                    : "button button-primary"
                                            }
                                            disabled={isBusy}
                                            onClick={handleToggleStatus}
                                        >
                                            {saving === "status"
                                                ? "Updating..."
                                                : confirmation === "status"
                                                    ? "Confirm Status Change"
                                                    : user.isActive
                                                        ? "Deactivate Account"
                                                        : "Activate Account"}
                                        </button>
                                    </>
                                )}
                            </div>

                            {confirmation && !isBusy && (
                                <button
                                    type="button"
                                    className="users-cancel-action"
                                    onClick={() => setConfirmation("")}
                                >
                                    Cancel pending action
                                </button>
                            )}
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}

export default UserDetailsPanel;
