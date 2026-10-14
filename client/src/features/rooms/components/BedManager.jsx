
import { useEffect, useState } from "react";

import {
    BedDouble,
    Plus,
    RefreshCw,
    X,
} from "lucide-react";

import {
    listBedsByRoom,
    createBed,
    updateBed,
    updateBedStatus,
} from "../api/beds.api.js";

const bedStatuses = [
    { value: "usable", label: "Usable" },
    { value: "maintenance", label: "Maintenance" },
    { value: "inactive", label: "Inactive" },
];

function BedManager({
    room,
    hostelName,
    hostelActive,
    onClose,
    onChanged,
}) {
    const [roomDetails, setRoomDetails] = useState(room);
    const [beds, setBeds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const [newBedNumber, setNewBedNumber] = useState("");
    const [busyAction, setBusyAction] = useState("");
    const [actionError, setActionError] = useState("");
    const [notice, setNotice] = useState("");

    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState("");

    const [statusDrafts, setStatusDrafts] = useState({});

    const refreshBeds = () => {
        setReloadKey((previous) => previous + 1);
    };

    /*
     * Load Room + Beds
     */
    useEffect(() => {
        const controller = new AbortController();

        const loadBeds = async () => {
            setLoading(true);
            setLoadError("");

            try {
                const result = await listBedsByRoom(
                    room.id,
                    controller.signal
                );

                if (controller.signal.aborted) return;

                setRoomDetails(result.room);
                setBeds(result.beds);

                setStatusDrafts(
                    Object.fromEntries(
                        result.beds.map((bed) => [
                            bed.id,
                            bed.operationalStatus,
                        ])
                    )
                );
            } catch (error) {
                if (!controller.signal.aborted) {
                    setLoadError(
                        error.message || "Unable to load beds"
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadBeds();

        return () => controller.abort();
    }, [room.id, reloadKey]);

    const remainingSlots = Math.max(
        0,
        roomDetails.capacity - roomDetails.bedCount
    );

    const canCreateBed =
        roomDetails.status === "active" &&
        hostelActive &&
        remainingSlots > 0;

    const validateBedNumber = (value) => {
        return (
            value.length >= 1 &&
            value.length <= 15 &&
            /^[A-Z0-9][A-Z0-9-]*$/.test(value)
        );
    };

    /*
     * Add bed
     */
    const handleCreateBed = async (event) => {
        event.preventDefault();

        if (busyAction || !canCreateBed) return;

        const bedNumber =
            newBedNumber.trim().toUpperCase();

        if (!validateBedNumber(bedNumber)) {
            setActionError(
                "Bed number must have 1–15 letters, numbers or hyphens"
            );
            return;
        }

        setBusyAction("create");
        setActionError("");
        setNotice("");

        try {
            await createBed(room.id, { bedNumber });

            setNewBedNumber("");
            setNotice(`Bed ${bedNumber} created successfully.`);

            refreshBeds();
            onChanged();
        } catch (error) {
            setActionError(
                error.message || "Unable to create bed"
            );
        } finally {
            setBusyAction("");
        }
    };

    /*
     * Start renaming
     */
    const startRename = (bed) => {
        setRenamingId(bed.id);
        setRenameValue(bed.bedNumber);
        setActionError("");
        setNotice("");
    };

    /*
     * Save bed number
     */
    const handleRename = async (event) => {
        event.preventDefault();

        if (!renamingId || busyAction) return;

        const bedNumber =
            renameValue.trim().toUpperCase();

        if (!validateBedNumber(bedNumber)) {
            setActionError("Enter a valid bed number");
            return;
        }

        const currentBed = beds.find(
            (bed) => bed.id === renamingId
        );

        if (currentBed?.bedNumber === bedNumber) {
            setRenamingId(null);
            return;
        }

        setBusyAction("rename");
        setActionError("");
        setNotice("");

        try {
            await updateBed(renamingId, { bedNumber });

            setRenamingId(null);
            setNotice("Bed number updated successfully.");

            refreshBeds();
            onChanged();
        } catch (error) {
            setActionError(
                error.message || "Unable to rename bed"
            );
        } finally {
            setBusyAction("");
        }
    };

    /*
     * Save operational status
     */
    const handleSaveStatus = async (bed) => {
        if (busyAction) return;

        const newStatus = statusDrafts[bed.id];

        if (
            !newStatus ||
            newStatus === bed.operationalStatus
        ) {
            return;
        }

        setBusyAction(`status-${bed.id}`);
        setActionError("");
        setNotice("");

        try {
            await updateBedStatus(bed.id, newStatus);

            setNotice(
                `Bed ${bed.bedNumber} status updated successfully.`
            );

            refreshBeds();
            onChanged();
        } catch (error) {
            setActionError(
                error.message || "Unable to update bed status"
            );
        } finally {
            setBusyAction("");
        }
    };

    return (
        <section
            className="rooms-panel"
            aria-labelledby="beds-panel-title"
        >
            <div className="rooms-panel-heading">
                <div>
                    <p className="dashboard-section-label">
                        {hostelName}
                    </p>

                    <h3 id="beds-panel-title">
                        Manage Beds — Room {roomDetails.roomNumber}
                    </h3>
                </div>

                <button
                    type="button"
                    className="rooms-icon-button"
                    onClick={onClose}
                    disabled={Boolean(busyAction)}
                    aria-label="Close bed manager"
                >
                    <X size={21} aria-hidden="true" />
                </button>
            </div>

            <div className="rooms-bed-summary">
                <div>
                    <span>Capacity</span>
                    <strong>{roomDetails.capacity}</strong>
                </div>

                <div>
                    <span>Provisioned Beds</span>
                    <strong>{roomDetails.bedCount}</strong>
                </div>

                <div>
                    <span>Unprovisioned Slots</span>
                    <strong>{remainingSlots}</strong>
                </div>
            </div>

            {actionError && (
                <p className="rooms-message is-error" role="alert">
                    {actionError}
                </p>
            )}

            {notice && (
                <p className="rooms-message is-success" role="status">
                    {notice}
                </p>
            )}

            <form
                className="rooms-add-bed-form"
                onSubmit={handleCreateBed}
            >
                <div className="rooms-field">
                    <label htmlFor="new-bed-number">
                        New Bed Number
                    </label>

                    <input
                        id="new-bed-number"
                        value={newBedNumber}
                        placeholder="B1"
                        maxLength={15}
                        onChange={(event) =>
                            setNewBedNumber(event.target.value)
                        }
                        disabled={Boolean(busyAction) || loading}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="button button-primary"
                    disabled={
                        Boolean(busyAction) ||
                        loading ||
                        !canCreateBed
                    }
                >
                    <Plus size={17} aria-hidden="true" />
                    {busyAction === "create"
                        ? "Creating..."
                        : "Add Bed"}
                </button>
            </form>

            {!canCreateBed && !loading && (
                <p className="rooms-help">
                    {remainingSlots === 0
                        ? "Room capacity has been fully provisioned."
                        : "Beds can only be added to active rooms in active hostels."}
                </p>
            )}

            <div className="rooms-bed-list-header">
                <h4>Bed Inventory</h4>

                <button
                    type="button"
                    className="button button-secondary"
                    onClick={refreshBeds}
                    disabled={loading || Boolean(busyAction)}
                >
                    <RefreshCw size={16} aria-hidden="true" />
                    Refresh
                </button>
            </div>

            {loadError && (
                <p className="rooms-message is-error" role="alert">
                    {loadError}
                </p>
            )}

            {loading ? (
                <p className="rooms-loading" role="status">
                    Loading beds...
                </p>
            ) : !loadError && beds.length === 0 ? (
                <p className="rooms-empty">
                    No beds have been provisioned in this room.
                </p>
            ) : !loadError ? (
                <div className="rooms-table-scroll">
                    <table className="rooms-table rooms-bed-table">
                        <thead>
                            <tr>
                                <th scope="col">Bed</th>
                                <th scope="col">Operational Status</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {beds.map((bed) => (
                                <tr key={bed.id}>
                                    <td>
                                        <span className="rooms-bed-name">
                                            <BedDouble
                                                size={17}
                                                aria-hidden="true"
                                            />
                                            {bed.bedNumber}
                                        </span>
                                    </td>

                                    <td>
                                        <label
                                            htmlFor={`bed-status-${bed.id}`}
                                            className="rooms-visually-hidden"
                                        >
                                            Status for bed {bed.bedNumber}
                                        </label>

                                        <select
                                            id={`bed-status-${bed.id}`}
                                            value={
                                                statusDrafts[bed.id] ??
                                                bed.operationalStatus
                                            }
                                            onChange={(event) =>
                                                setStatusDrafts((previous) => ({
                                                    ...previous,
                                                    [bed.id]: event.target.value,
                                                }))
                                            }
                                            disabled={Boolean(busyAction)}
                                        >
                                            {bedStatuses.map((status) => (
                                                <option
                                                    key={status.value}
                                                    value={status.value}
                                                >
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td>
                                        <div className="rooms-actions">
                                            <button
                                                type="button"
                                                disabled={
                                                    Boolean(busyAction) ||
                                                    statusDrafts[bed.id] ===
                                                    bed.operationalStatus
                                                }
                                                onClick={() => handleSaveStatus(bed)}
                                            >
                                                Save Status
                                            </button>

                                            <button
                                                type="button"
                                                disabled={Boolean(busyAction)}
                                                onClick={() => startRename(bed)}
                                            >
                                                Rename
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

            {renamingId && (
                <form
                    className="rooms-rename-form"
                    onSubmit={handleRename}
                >
                    <div className="rooms-field">
                        <label htmlFor="rename-bed-number">
                            Rename Bed
                        </label>

                        <input
                            id="rename-bed-number"
                            value={renameValue}
                            maxLength={15}
                            onChange={(event) =>
                                setRenameValue(event.target.value)
                            }
                            disabled={Boolean(busyAction)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="button button-primary"
                        disabled={Boolean(busyAction)}
                    >
                        Save Name
                    </button>

                    <button
                        type="button"
                        className="button button-secondary"
                        disabled={Boolean(busyAction)}
                        onClick={() => setRenamingId(null)}
                    >
                        Cancel
                    </button>
                </form>
            )}

            <p className="rooms-help">
                Operational status describes the physical bed.
                Student occupancy and vacancy will be managed
                through allocations in Phase 5.
            </p>
        </section>
    );
}

export default BedManager;
