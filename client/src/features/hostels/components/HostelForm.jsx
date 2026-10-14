
import { useState } from "react";

import {
    createHostel,
    updateHostel,
} from "../api/hostels.api.js";

const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "coed", label: "Co-ed" },
];

function HostelForm({
    hostel = null,
    wardens = [],
    wardensLoading = false,
    wardensError = "",
    onSaved,
    onCancel,
}) {
    const isEditing = Boolean(hostel);

    const [formData, setFormData] = useState({
        name: hostel?.name ?? "",
        code: hostel?.code ?? "",
        location: hostel?.location ?? "",
        genderPolicy: hostel?.genderPolicy ?? "coed",
        warden: hostel?.warden ?? "",
    });

    const [errors, setErrors] = useState({});
    const [requestError, setRequestError] = useState("");
    const [notice, setNotice] = useState("");
    const [saving, setSaving] = useState(false);

    /*
     * Input changes
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

        setRequestError("");
        setNotice("");
    };

    /*
     * Client-side validation
     */
    const validateForm = () => {
        const nextErrors = {};

        const name = formData.name.trim();
        const code = formData.code.trim().toUpperCase();
        const location = formData.location.trim();

        if (name.length < 2 || name.length > 120) {
            nextErrors.name =
                "Hostel name must have 2 to 120 characters";
        }

        if (!isEditing) {
            if (
                code.length < 2 ||
                code.length > 20 ||
                !/^[A-Z0-9][A-Z0-9-]*$/.test(code)
            ) {
                nextErrors.code =
                    "Use 2–20 letters, numbers or hyphens";
            }
        }

        if (
            location.length < 3 ||
            location.length > 200
        ) {
            nextErrors.location =
                "Location must have 3 to 200 characters";
        }

        if (
            !["male", "female", "coed"].includes(
                formData.genderPolicy
            )
        ) {
            nextErrors.genderPolicy =
                "Select a valid gender policy";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    /*
     * Form submission
     */
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving || !validateForm()) {
            return;
        }

        setSaving(true);
        setRequestError("");
        setNotice("");

        try {
            const values = {
                name: formData.name.trim(),
                location: formData.location.trim(),
                genderPolicy: formData.genderPolicy,
            };

            let savedHostel;

            if (isEditing) {
                /*
                 * Only send fields that have changed.
                 * The backend rejects an empty PATCH body.
                 */
                const changes = {};

                if (values.name !== hostel.name) {
                    changes.name = values.name;
                }

                if (values.location !== hostel.location) {
                    changes.location = values.location;
                }

                if (
                    values.genderPolicy !== hostel.genderPolicy
                ) {
                    changes.genderPolicy = values.genderPolicy;
                }

                if (
                    formData.warden !== (hostel.warden ?? "")
                ) {
                    changes.warden = formData.warden || null;
                }

                if (Object.keys(changes).length === 0) {
                    setNotice("No changes to save.");
                    return;
                }

                savedHostel = await updateHostel(
                    hostel.id,
                    changes
                );
            } else {
                const payload = {
                    ...values,
                    code: formData.code.trim().toUpperCase(),
                };

                if (formData.warden) {
                    payload.warden = formData.warden;
                }

                savedHostel = await createHostel(payload);
            }

            onSaved(savedHostel);
        } catch (error) {
            setRequestError(
                error.message || "Unable to save hostel"
            );

            const fieldErrors = {};

            for (const issue of error.details ?? []) {
                if (
                    typeof issue.field === "string" &&
                    !fieldErrors[issue.field]
                ) {
                    fieldErrors[issue.field] = issue.message;
                }
            }

            setErrors(fieldErrors);
        } finally {
            setSaving(false);
        }
    };

    const assignedWardenMissing =
        Boolean(formData.warden) &&
        !wardens.some(
            (warden) => warden.id === formData.warden
        );

    return (
        <section
            className="hostels-form-panel"
            aria-labelledby="hostel-form-title"
        >
            <div className="hostels-form-header">
                <div>
                    <p className="dashboard-section-label">
                        Hostel Administration
                    </p>

                    <h3 id="hostel-form-title">
                        {isEditing
                            ? `Edit ${hostel.name}`
                            : "Create New Hostel"}
                    </h3>
                </div>
            </div>

            {requestError && (
                <p
                    className="hostels-message is-error"
                    role="alert"
                >
                    {requestError}
                </p>
            )}

            {notice && (
                <p
                    className="hostels-message is-info"
                    role="status"
                >
                    {notice}
                </p>
            )}

            <form onSubmit={handleSubmit} noValidate>
                <div className="hostels-form-grid">
                    <div className="hostels-field">
                        <label htmlFor="hostel-name">
                            Hostel Name
                        </label>

                        <input
                            id="hostel-name"
                            name="name"
                            type="text"
                            placeholder="Disang Hostel"
                            maxLength={120}
                            value={formData.name}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.name)}
                            required
                        />

                        {errors.name && (
                            <p className="hostels-field-error" role="alert">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="hostels-field">
                        <label htmlFor="hostel-code">
                            Hostel Code
                        </label>

                        <input
                            id="hostel-code"
                            name="code"
                            type="text"
                            placeholder="DIS"
                            maxLength={20}
                            value={formData.code}
                            onChange={handleChange}
                            readOnly={isEditing}
                            aria-invalid={Boolean(errors.code)}
                            required
                        />

                        {isEditing && (
                            <small>
                                Hostel code cannot be changed here.
                            </small>
                        )}

                        {errors.code && (
                            <p className="hostels-field-error" role="alert">
                                {errors.code}
                            </p>
                        )}
                    </div>

                    <div className="hostels-field">
                        <label htmlFor="hostel-location">
                            Location
                        </label>

                        <input
                            id="hostel-location"
                            name="location"
                            type="text"
                            placeholder="IIT Guwahati"
                            maxLength={200}
                            value={formData.location}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.location)}
                            required
                        />

                        {errors.location && (
                            <p className="hostels-field-error" role="alert">
                                {errors.location}
                            </p>
                        )}
                    </div>

                    <div className="hostels-field">
                        <label htmlFor="hostel-gender">
                            Gender Policy
                        </label>

                        <select
                            id="hostel-gender"
                            name="genderPolicy"
                            value={formData.genderPolicy}
                            onChange={handleChange}
                            required
                        >
                            {genderOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {errors.genderPolicy && (
                            <p className="hostels-field-error" role="alert">
                                {errors.genderPolicy}
                            </p>
                        )}
                    </div>

                    <div className="hostels-field hostels-field-wide">
                        <label htmlFor="hostel-warden">
                            Assigned Warden
                        </label>

                        <select
                            id="hostel-warden"
                            name="warden"
                            value={formData.warden}
                            onChange={handleChange}
                            disabled={wardensLoading}
                        >
                            <option value="">
                                No warden assigned
                            </option>

                            {assignedWardenMissing && (
                                <option value={formData.warden}>
                                    Previously assigned warden
                                </option>
                            )}

                            {wardens.map((warden) => (
                                <option
                                    key={warden.id}
                                    value={warden.id}
                                >
                                    {warden.name} — {warden.email}
                                </option>
                            ))}
                        </select>

                        <small>
                            Only active users with the warden role
                            are available for new assignments.
                        </small>

                        {wardensLoading && (
                            <small>Loading wardens...</small>
                        )}

                        {wardensError && (
                            <p className="hostels-field-error">
                                Unable to load warden options:
                                {" "}{wardensError}
                            </p>
                        )}

                        {errors.warden && (
                            <p className="hostels-field-error" role="alert">
                                {errors.warden}
                            </p>
                        )}
                    </div>
                </div>

                <div className="hostels-form-actions">
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="button button-primary"
                        disabled={saving}
                    >
                        {saving
                            ? "Saving..."
                            : isEditing
                                ? "Save Changes"
                                : "Create Hostel"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default HostelForm;
