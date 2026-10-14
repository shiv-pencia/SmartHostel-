
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Plus,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    BedDouble,
} from "lucide-react";

import { listHostels } from "../../hostels/api/hostels.api.js";

import {
    listRooms,
    updateRoomStatus,
} from "../api/rooms.api.js";

import RoomTable from "../components/RoomTable.jsx";
import RoomForm from "../components/RoomForm.jsx";
import BedManager from "../components/BedManager.jsx";

import "../styles/rooms.css";

const initialFilters = {
    page: 1,
    limit: 10,
    search: "",
    hostel: "",
    status: "",
    roomType: "",
};

function AdminRoomsPage() {
    const [hostels, setHostels] = useState([]);
    const [hostelsLoading, setHostelsLoading] =
        useState(true);
    const [hostelsError, setHostelsError] = useState("");
    const [hostelsReloadKey, setHostelsReloadKey] =
        useState(0);

    const [filters, setFilters] = useState(initialFilters);
    const [searchInput, setSearchInput] = useState("");

    const [rooms, setRooms] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    const [notice, setNotice] = useState("");

    // null = closed, "create" = create mode,
    // room object = edit mode
    const [formMode, setFormMode] = useState(null);

    // Selected room whose beds are being managed
    const [bedRoom, setBedRoom] = useState(null);

    // Room whose status is being edited
    const [statusRoom, setStatusRoom] = useState(null);
    const [statusDraft, setStatusDraft] = useState("active");
    const [statusError, setStatusError] = useState("");
    const [savingStatus, setSavingStatus] = useState(false);

    /*
     * Load all hostels for room selection.
     *
     * Hostel API is paginated, so fetch each page.
     */
    useEffect(() => {
        const controller = new AbortController();

        const loadAllHostels = async () => {
            setHostelsLoading(true);
            setHostelsError("");

            try {
                const allHostels = [];

                let page = 1;
                let totalPages = 1;

                while (page <= totalPages) {
                    const result = await listHostels(
                        {
                            page,
                            limit: 100,
                        },
                        controller.signal
                    );

                    if (controller.signal.aborted) return;

                    allHostels.push(...result.hostels);
                    totalPages = result.pagination.totalPages;
                    page += 1;
                }

                setHostels(allHostels);
            } catch (error) {
                if (!controller.signal.aborted) {
                    setHostels([]);
                    setHostelsError(
                        error.message || "Unable to load hostels"
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setHostelsLoading(false);
                }
            }
        };

        void loadAllHostels();

        return () => controller.abort();
    }, [hostelsReloadKey]);

    /*
     * Load rooms
     */
    useEffect(() => {
        const controller = new AbortController();

        const loadData = async () => {
            setLoading(true);
            setListError("");

            const query = {
                page: filters.page,
                limit: filters.limit,
            };

            for (const field of [
                "search",
                "hostel",
                "status",
                "roomType",
            ]) {
                if (filters[field]) {
                    query[field] = filters[field];
                }
            }

            try {
                const result = await listRooms(
                    query,
                    controller.signal
                );

                if (controller.signal.aborted) return;

                setRooms(result.rooms);
                setPagination(result.pagination);

                if (
                    result.pagination.totalPages > 0 &&
                    filters.page > result.pagination.totalPages
                ) {
                    setFilters((previous) => ({
                        ...previous,
                        page: result.pagination.totalPages,
                    }));
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setRooms([]);
                    setListError(
                        error.message || "Unable to load rooms"
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadData();

        return () => controller.abort();
    }, [filters, reloadKey]);

    const refreshRooms = useCallback(() => {
        setReloadKey((previous) => previous + 1);
    }, []);

    const handleSearch = (event) => {
        event.preventDefault();

        setFilters((previous) => ({
            ...previous,
            search: searchInput.trim(),
            page: 1,
        }));
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((previous) => ({
            ...previous,
            [name]:
                name === "limit" ? Number(value) : value,
            page: 1,
        }));
    };

    const resetFilters = () => {
        setSearchInput("");
        setFilters({ ...initialFilters });
    };

    /*
     * Open create/edit form
     */
    const openCreateForm = () => {
        setFormMode("create");
        setBedRoom(null);
        setStatusRoom(null);
        setNotice("");
    };

    const openEditForm = (room) => {
        setFormMode(room);
        setBedRoom(null);
        setStatusRoom(null);
        setNotice("");
    };

    const handleFormSaved = (savedRoom) => {
        setFormMode(null);

        setNotice(
            `Room ${savedRoom.roomNumber} saved successfully.`
        );

        refreshRooms();
    };

    /*
     * Open Bed Manager
     */
    const openBedManager = (room) => {
        setBedRoom(room);
        setFormMode(null);
        setStatusRoom(null);
        setNotice("");
    };

    /*
     * Change room status
     */
    const openStatusPanel = (room) => {
        setStatusRoom(room);
        setStatusDraft(room.status);
        setStatusError("");
        setFormMode(null);
        setBedRoom(null);
        setNotice("");
    };

    const handleSaveStatus = async () => {
        if (!statusRoom || savingStatus) return;

        if (statusDraft === statusRoom.status) {
            setStatusRoom(null);
            return;
        }

        setSavingStatus(true);
        setStatusError("");

        try {
            const updated = await updateRoomStatus(
                statusRoom.id,
                statusDraft
            );

            setStatusRoom(null);

            setNotice(
                `Room ${updated.roomNumber} status changed to ${updated.status}.`
            );

            refreshRooms();
        } catch (error) {
            setStatusError(
                error.message || "Unable to update room status"
            );
        } finally {
            setSavingStatus(false);
        }
    };

    const goToPage = (page) => {
        if (
            loading ||
            page < 1 ||
            page > pagination.totalPages
        ) {
            return;
        }

        setFilters((previous) => ({
            ...previous,
            page,
        }));
    };

    const totalPages = Math.max(
        1,
        pagination.totalPages
    );

    const displayPage = Math.min(
        filters.page,
        totalPages
    );

    const bedHostel = bedRoom
        ? hostels.find(
            (hostel) => hostel.id === bedRoom.hostel
        )
        : null;

    return (
        <div className="rooms-page">
            <section className="rooms-page-heading">
                <div>
                    <p className="dashboard-section-label">
                        Accommodation Inventory
                    </p>

                    <h2>Room & Bed Management</h2>

                    <p>
                        Manage rooms, capacity, bed provisioning
                        and operational status.
                    </p>
                </div>

                <button
                    type="button"
                    className="button button-primary rooms-button-with-icon"
                    onClick={openCreateForm}
                    disabled={
                        hostelsLoading ||
                        !hostels.some((hostel) => hostel.isActive)
                    }
                >
                    <Plus size={18} aria-hidden="true" />
                    Add Room
                </button>
            </section>

            {notice && (
                <p className="rooms-message is-success" role="status">
                    {notice}
                </p>
            )}

            {hostelsError && (
                <div className="rooms-message is-error" role="alert">
                    {hostelsError}

                    <button
                        type="button"
                        className="rooms-inline-button"
                        onClick={() =>
                            setHostelsReloadKey((value) => value + 1)
                        }
                    >
                        Retry hostel list
                    </button>
                </div>
            )}

            {!hostelsLoading &&
                !hostelsError &&
                !hostels.some((hostel) => hostel.isActive) && (
                    <p className="rooms-message is-info">
                        No active hostel is available.
                        Create or activate a hostel in the{" "}
                        <a href="/admin/hostels">
                            Hostel Management page
                        </a>.
                    </p>
                )}

            <section className="rooms-summary">
                <span className="rooms-summary-icon">
                    <BedDouble size={23} aria-hidden="true" />
                </span>

                <div>
                    <span>Matching Rooms</span>
                    <strong>
                        {loading ? "..." : pagination.total}
                    </strong>
                </div>
            </section>

            {formMode !== null && (
                <RoomForm
                    key={
                        formMode === "create"
                            ? `create-${filters.hostel}`
                            : formMode.id
                    }
                    room={
                        formMode === "create" ? null : formMode
                    }
                    hostels={hostels}
                    defaultHostelId={filters.hostel}
                    onSaved={handleFormSaved}
                    onCancel={() => setFormMode(null)}
                />
            )}

            {statusRoom && (
                <section
                    className="rooms-panel"
                    aria-labelledby="room-status-heading"
                >
                    <div className="rooms-panel-heading">
                        <h3 id="room-status-heading">
                            Change Room {statusRoom.roomNumber} Status
                        </h3>
                    </div>

                    <div className="rooms-field">
                        <label htmlFor="room-new-status">
                            New Status
                        </label>

                        <select
                            id="room-new-status"
                            value={statusDraft}
                            disabled={savingStatus}
                            onChange={(event) =>
                                setStatusDraft(event.target.value)
                            }
                        >
                            <option value="active">Active</option>
                            <option value="maintenance">
                                Maintenance
                            </option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <p className="rooms-help">
                        Status changes do not automatically
                        vacate beds or move residents.
                        Allocation-aware safeguards will
                        be added before real resident use.
                    </p>

                    {statusError && (
                        <p
                            className="rooms-message is-error"
                            role="alert"
                        >
                            {statusError}
                        </p>
                    )}

                    <div className="rooms-form-actions">
                        <button
                            type="button"
                            className="button button-secondary"
                            disabled={savingStatus}
                            onClick={() => setStatusRoom(null)}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="button button-primary"
                            disabled={
                                savingStatus ||
                                statusDraft === statusRoom.status
                            }
                            onClick={handleSaveStatus}
                        >
                            {savingStatus
                                ? "Saving..."
                                : "Confirm Status Change"}
                        </button>
                    </div>
                </section>
            )}

            {bedRoom && (
                <BedManager
                    key={bedRoom.id}
                    room={bedRoom}
                    hostelName={
                        bedHostel?.name ?? "Unknown hostel"
                    }
                    hostelActive={
                        bedHostel?.isActive === true
                    }
                    onClose={() => setBedRoom(null)}
                    onChanged={refreshRooms}
                />
            )}

            <section className="rooms-list-panel">
                <div className="rooms-list-heading">
                    <div>
                        <h3>Registered Rooms</h3>

                        <p>
                            Filter inventory by hostel and
                            operational status.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="button button-secondary rooms-button-with-icon"
                        disabled={loading}
                        onClick={refreshRooms}
                    >
                        <RefreshCw size={17} aria-hidden="true" />
                        Refresh
                    </button>
                </div>

                <form
                    className="rooms-filters"
                    onSubmit={handleSearch}
                >
                    <label
                        htmlFor="rooms-search"
                        className="rooms-visually-hidden"
                    >
                        Search room number
                    </label>

                    <input
                        id="rooms-search"
                        type="search"
                        placeholder="Search room number"
                        value={searchInput}
                        maxLength={100}
                        onChange={(event) =>
                            setSearchInput(event.target.value)
                        }
                    />

                    <button
                        type="submit"
                        className="button button-primary"
                    >
                        Search
                    </button>

                    <label
                        htmlFor="rooms-hostel-filter"
                        className="rooms-visually-hidden"
                    >
                        Filter by hostel
                    </label>

                    <select
                        id="rooms-hostel-filter"
                        name="hostel"
                        value={filters.hostel}
                        onChange={handleFilterChange}
                    >
                        <option value="">All hostels</option>

                        {hostels.map((hostel) => (
                            <option
                                key={hostel.id}
                                value={hostel.id}
                            >
                                {hostel.name}
                            </option>
                        ))}
                    </select>

                    <label
                        htmlFor="rooms-status-filter"
                        className="rooms-visually-hidden"
                    >
                        Filter by status
                    </label>

                    <select
                        id="rooms-status-filter"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <label
                        htmlFor="rooms-type-filter"
                        className="rooms-visually-hidden"
                    >
                        Filter by room type
                    </label>

                    <select
                        id="rooms-type-filter"
                        name="roomType"
                        value={filters.roomType}
                        onChange={handleFilterChange}
                    >
                        <option value="">All room types</option>
                        <option value="standard">Standard</option>
                        <option value="accessible">Accessible</option>
                    </select>

                    <label
                        htmlFor="rooms-page-size"
                        className="rooms-visually-hidden"
                    >
                        Results per page
                    </label>

                    <select
                        id="rooms-page-size"
                        name="limit"
                        value={filters.limit}
                        onChange={handleFilterChange}
                    >
                        <option value="10">10 per page</option>
                        <option value="20">20 per page</option>
                        <option value="50">50 per page</option>
                    </select>

                    <button
                        type="button"
                        className="rooms-reset-button"
                        onClick={resetFilters}
                    >
                        Reset
                    </button>
                </form>

                {listError && (
                    <div
                        className="rooms-message is-error rooms-list-error"
                        role="alert"
                    >
                        {listError}

                        <button
                            type="button"
                            className="rooms-inline-button"
                            onClick={refreshRooms}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div
                        className="rooms-loading"
                        role="status"
                    >
                        Loading rooms...
                    </div>
                ) : !listError ? (
                    <RoomTable
                        rooms={rooms}
                        hostels={hostels}
                        onEdit={openEditForm}
                        onManageBeds={openBedManager}
                        onChangeStatus={openStatusPanel}
                    />
                ) : null}

                {!listError && (
                    <div className="rooms-pagination">
                        <span>
                            Page {displayPage} of {totalPages}
                        </span>

                        <div className="rooms-pagination-actions">
                            <button
                                type="button"
                                disabled={
                                    loading || filters.page <= 1
                                }
                                onClick={() =>
                                    goToPage(filters.page - 1)
                                }
                            >
                                <ChevronLeft
                                    size={18}
                                    aria-hidden="true"
                                />
                                Previous
                            </button>

                            <button
                                type="button"
                                disabled={
                                    loading ||
                                    filters.page >= pagination.totalPages
                                }
                                onClick={() =>
                                    goToPage(filters.page + 1)
                                }
                            >
                                Next
                                <ChevronRight
                                    size={18}
                                    aria-hidden="true"
                                />
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}

export default AdminRoomsPage;
