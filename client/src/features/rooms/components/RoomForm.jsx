
import { useState } from "react";
import { Link } from "react-router";

import {
    createRoom,
    updateRoom,
} from "../api/rooms.api.js";

const roomTypes = [
    { value: "standard", label: "Standard" },
    { value: "accessible", label: "Accessible" },
];

function RoomForm({
    room = null,
    hostels = [],
    defaultHostelId = "",
    onSaved,
    onCancel,
}) {
    const isEditing = Boolean(room);

    const [formData, setFormData] = useState({
        hostel: room?.hostel ?? defaultHostelId,
        roomNumber: room?.roomNumber ?? "",
        floor: String(room?.floor ?? 0),
        capacity: String(room?.capacity ?? 1),
        roomType: room?.roomType ?? "standard",
    });

    const [errors, setErrors] = useState({});
    const [requestError, setRequestError] = useState("");
    const [notice, setNotice] = useState("");
    const [saving, setSaving] = useState(false);

    const activeHostels = hostels.filter(
        (hostel) => hostel.isActive
    );

    const currentHostel = hostels.find(
        (hostel) => hostel.id === formData.hostel
    );

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

    const validateForm = () => {
        const nextErrors = {};
        const roomNumber =
            formData.roomNumber.trim().toUpperCase();

        if (!isEditing) {
            if (!formData.hostel) {
                nextErrors.hostel = "Select a hostel";
            } else if (!currentHostel?.isActive) {
                nextErrors.hostel =
                    "New rooms require an active hostel";
            }
        }

        if (
            !roomNumber ||
            roomNumber.length > 20 ||
            !/^[A-Z0-9][A-Z0-9-]*$/.test(roomNumber)
        ) {
            nextErrors.roomNumber =
                "Use 1–20 letters, numbers or hyphens";
        }

        const floor = Number(formData.floor);

        if (
            formData.floor.trim() === "" ||
            !Number.isInteger(floor) ||
            floor < 0 ||
            floor > 100
        ) {
            nextErrors.floor =
                "Floor must be an integer from 0 to 100";
        }

        const capacity = Number(formData.capacity);

        if (
            formData.capacity.trim() === "" ||
            !Number.isInteger(capacity) ||
            capacity < 1 ||
            capacity > 20
        ) {
            nextErrors.capacity =
                "Capacity must be an integer from 1 to 20";
        } else if (
            isEditing &&
            capacity < room.bedCount
        ) {
            nextErrors.capacity =
                `Capacity cannot be below ${room.bedCount} ` +
                "already-provisioned beds";
        }

        if (
            !roomTypes.some(
                (item) => item.value === formData.roomType
            )
        ) {
            nextErrors.roomType = "Invalid room type";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (saving || !validateForm()) return;

        setSaving(true);
        setRequestError("");
        setNotice("");

        try {
            const values = {
                roomNumber:
                    formData.roomNumber.trim().toUpperCase(),
                floor: Number(formData.floor),
                capacity: Number(formData.capacity),
                roomType: formData.roomType,
            };

            let savedRoom;

            if (isEditing) {
                const changes = {};

                for (const field of Object.keys(values)) {
                    if (values[field] !== room[field]) {
                        changes[field] = values[field];
                    }
                }

                if (Object.keys(changes).length === 0) {
                    setNotice("No changes to save.");
                    return;
                }

                savedRoom = await updateRoom(
                    room.id,
                    changes
                );
            } else {
                savedRoom = await createRoom({
                    hostel: formData.hostel,
                    ...values,
                });
            }

            onSaved(savedRoom);
        } catch (error) {
            setRequestError(
                error.message || "Unable to save room"
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

    return (
        <section
            className="rooms-panel"
            aria-labelledby="room-form-title"
        >
            <div className="rooms-panel-heading">
                <div>
                    <p className="dashboard-section-label">
                        Room Inventory
                    </p>
                    <h3 id="room-form-title">
                        {isEditing
                            ? `Edit Room ${room.roomNumber}`
                            : "Create New Room"}
                    </h3>
                </div>
            </div>

            {requestError && (
                <p className="rooms-message is-error" role="alert">
                    {requestError}
                </p>
            )}

            {notice && (
                <p className="rooms-message is-info" role="status">
                    {notice}
                </p>
            )}

            {!isEditing && activeHostels.length === 0 && (
                <p className="rooms-message is-info">
                    An active hostel is required before creating
                    a room.{" "}
                    <Link to="/admin/hostels">
                        Manage hostels
                    </Link>
                </p>
            )}

            <form onSubmit={handleSubmit} noValidate>
                <div className="rooms-form-grid">
                    <div className="rooms-field">
                        <label htmlFor="room-hostel">
                            Hostel
                        </label>

                        {isEditing ? (
                            <input
                                id="room-hostel"
                                type="text"
                                value={
                                    currentHostel?.name ??
                                    "Hostel not found"
                                }
                                readOnly
                            />
                        ) : (
                            <select
                                id="room-hostel"
                                name="hostel"
                                value={formData.hostel}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select hostel</option>

                                {activeHostels.map((hostel) => (
                                    <option
                                        key={hostel.id}
                                        value={hostel.id}
                                    >
                                        {hostel.name} ({hostel.code})
                                    </option>
                                ))}
                            </select>
                        )}

                        {errors.hostel && (
                            <small className="rooms-field-error" role="alert">
                                {errors.hostel}
                            </small>
                        )}
                    </div>

                    <div className="rooms-field">
                        <label htmlFor="room-number">
                            Room Number
                        </label>

                        <input
                            id="room-number"
                            name="roomNumber"
                            value={formData.roomNumber}
                            onChange={handleChange}
                            maxLength={20}
                            placeholder="101"
                            required
                        />

                        {errors.roomNumber && (
                            <small className="rooms-field-error" role="alert">
                                {errors.roomNumber}
                            </small>
                        )}
                    </div>

                    <div className="rooms-field">
                        <label htmlFor="room-floor">
                            Floor
                        </label>

                        <input
                            id="room-floor"
                            name="floor"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={formData.floor}
                            onChange={handleChange}
                            required
                        />

                        {errors.floor && (
                            <small className="rooms-field-error" role="alert">
                                {errors.floor}
                            </small>
                        )}
                    </div>

                    <div className="rooms-field">
                        <label htmlFor="room-capacity">
                            Capacity
                        </label>

                        <input
                            id="room-capacity"
                            name="capacity"
                            type="number"
                            min="1"
                            max="20"
                            step="1"
                            value={formData.capacity}
                            onChange={handleChange}
                            required
                        />

                        {errors.capacity && (
                            <small className="rooms-field-error" role="alert">
                                {errors.capacity}
                            </small>
                        )}

                        {isEditing && (
                            <small className="rooms-help">
                                {room.bedCount} provisioned bed(s).
                                Capacity cannot go below this count.
                            </small>
                        )}
                    </div>

                    <div className="rooms-field rooms-field-wide">
                        <label htmlFor="room-type">
                            Room Type
                        </label>

                        <select
                            id="room-type"
                            name="roomType"
                            value={formData.roomType}
                            onChange={handleChange}
                        >
                            {roomTypes.map((type) => (
                                <option
                                    key={type.value}
                                    value={type.value}
                                >
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="rooms-form-actions">
                    <button
                        type="button"
                        className="button button-secondary"
                        disabled={saving}
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="button button-primary"
                        disabled={
                            saving ||
                            (!isEditing &&
                                activeHostels.length === 0)
                        }
                    >
                        {saving
                            ? "Saving..."
                            : isEditing
                                ? "Save Changes"
                                : "Create Room"}
                    </button>
                </div>
            </form>
        </section>
    );
}

export default RoomForm;
