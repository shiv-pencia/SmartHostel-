
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Building2,
    Plus,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import {
    listHostels,
    listActiveWardens,
    updateHostelStatus,
} from "../api/hostels.api.js";

import HostelTable from "../components/HostelTable.jsx";
import HostelForm from "../components/HostelForm.jsx";

import "../styles/hostels.css";

const initialFilters = {
    page: 1,
    limit: 10,
    search: "",
    status: "",
    genderPolicy: "",
};

function AdminHostelsPage() {
    const [filters, setFilters] = useState(initialFilters);
    const [searchInput, setSearchInput] = useState("");

    const [hostels, setHostels] = useState([]);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const [wardens, setWardens] = useState([]);
    const [wardensLoading, setWardensLoading] = useState(true);
    const [wardensError, setWardensError] = useState("");

    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState("");
    const [notice, setNotice] = useState("");

    const [reloadKey, setReloadKey] = useState(0);

    // null: no form
    // "create": creation form
    // hostel object: editing form
    const [formMode, setFormMode] = useState(null);

    const [pendingStatusHostel, setPendingStatusHostel] =
        useState(null);

    const [changingStatus, setChangingStatus] =
        useState(false);

    const [statusError, setStatusError] = useState("");

    /*
     * Load eligible wardens
     */
    useEffect(() => {
        const controller = new AbortController();

        const loadWardens = async () => {
            setWardensLoading(true);
            setWardensError("");

            try {
                const result = await listActiveWardens(
                    controller.signal
                );

                if (!controller.signal.aborted) {
                    setWardens(result);
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setWardensError(
                        error.message || "Unable to load wardens"
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setWardensLoading(false);
                }
            }
        };

        void loadWardens();

        return () => controller.abort();
    }, []);

    /*
     * Fetch hostel records when filters change
     */
    useEffect(() => {
        const controller = new AbortController();

        const loadHostels = async () => {
            setLoading(true);
            setListError("");

            const query = {
                page: filters.page,
                limit: filters.limit,
            };

            if (filters.search) {
                query.search = filters.search;
            }

            if (filters.status) {
                query.status = filters.status;
            }

            if (filters.genderPolicy) {
                query.genderPolicy = filters.genderPolicy;
            }

            try {
                const result = await listHostels(
                    query,
                    controller.signal
                );

                if (controller.signal.aborted) return;

                setHostels(result.hostels);
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
                if (controller.signal.aborted) return;

                setHostels([]);
                setListError(
                    error.message || "Unable to load hostels"
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadHostels();

        return () => controller.abort();
    }, [filters, reloadKey]);

    /*
     * Refresh the current list
     */
    const refreshHostels = useCallback(() => {
        setReloadKey((previous) => previous + 1);
    }, []);

    /*
     * Search
     */
    const handleSearch = (event) => {
        event.preventDefault();

        setFilters((previous) => ({
            ...previous,
            search: searchInput.trim(),
            page: 1,
        }));
    };

    /*
     * Dropdown filters
     */
    const handleFilterChange = (event) => {
        const { name, value } = event.target;

        setFilters((previous) => ({
            ...previous,
            [name]:
                name === "limit" ? Number(value) : value,
            page: 1,
        }));
    };

    /*
     * Reset search and filters
     */
    const resetFilters = () => {
        setSearchInput("");
        setFilters({ ...initialFilters });
    };

    /*
     * Form actions
     */
    const handleCreate = () => {
        setNotice("");
        setStatusError("");
        setPendingStatusHostel(null);
        setFormMode("create");
    };

    const handleEdit = (hostel) => {
        setNotice("");
        setStatusError("");
        setPendingStatusHostel(null);
        setFormMode(hostel);
    };

    const handleFormSaved = (savedHostel) => {
        setFormMode(null);

        setNotice(
            `Hostel "${savedHostel.name}" saved successfully.`
        );

        refreshHostels();
    };

    /*
     * Status confirmation
     */
    const requestStatusChange = (hostel) => {
        setStatusError("");
        setNotice("");
        setPendingStatusHostel(hostel);
    };

    const confirmStatusChange = async () => {
        if (!pendingStatusHostel || changingStatus) {
            return;
        }

        setChangingStatus(true);
        setStatusError("");

        const hostel = pendingStatusHostel;
        const newStatus = !hostel.isActive;

        try {
            const updated = await updateHostelStatus(
                hostel.id,
                newStatus
            );

            setPendingStatusHostel(null);

            setNotice(
                `${updated.name} ${updated.isActive ? "activated" : "deactivated"
                } successfully.`
            );

            refreshHostels();
        } catch (error) {
            setStatusError(
                error.message || "Unable to update status"
            );
        } finally {
            setChangingStatus(false);
        }
    };

    /*
     * Pagination
     */
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

    return (
        <div className="hostels-page">
            <section className="hostels-page-heading">
                <div>
                    <p className="dashboard-section-label">
                        Administration
                    </p>

                    <h2>Hostel Management</h2>

                    <p>
                        Create and manage hostel records,
                        assign wardens and control availability.
                    </p>
                </div>

                <button
                    type="button"
                    className="button button-primary hostels-new-button"
                    onClick={handleCreate}
                >
                    <Plus size={18} aria-hidden="true" />
                    Add Hostel
                </button>
            </section>

            {notice && (
                <div
                    className="hostels-message is-success"
                    role="status"
                >
                    {notice}
                </div>
            )}

            <section className="hostels-summary">
                <span className="hostels-summary-icon">
                    <Building2 size={23} aria-hidden="true" />
                </span>

                <div>
                    <span>Matching Hostels</span>

                    <strong>
                        {loading ? "..." : pagination.total}
                    </strong>
                </div>
            </section>

            {formMode !== null && (
                <HostelForm
                    key={
                        formMode === "create"
                            ? "create"
                            : formMode.id
                    }
                    hostel={
                        formMode === "create"
                            ? null
                            : formMode
                    }
                    wardens={wardens}
                    wardensLoading={wardensLoading}
                    wardensError={wardensError}
                    onSaved={handleFormSaved}
                    onCancel={() => setFormMode(null)}
                />
            )}

            {pendingStatusHostel && (
                <section
                    className="hostels-confirm-panel"
                    aria-label="Confirm hostel status change"
                >
                    <h3>Confirm Status Change</h3>

                    <p>
                        Are you sure you want to{" "}
                        <strong>
                            {pendingStatusHostel.isActive
                                ? "deactivate"
                                : "activate"}
                        </strong>{" "}
                        {pendingStatusHostel.name}?
                    </p>

                    {pendingStatusHostel.isActive && (
                        <p className="hostels-confirm-warning">
                            Deactivation marks the hostel inactive.
                            Before using this with real residents,
                            we must enforce resident and allocation
                            safety checks in the backend.
                        </p>
                    )}

                    {statusError && (
                        <p
                            className="hostels-message is-error"
                            role="alert"
                        >
                            {statusError}
                        </p>
                    )}

                    <div className="hostels-confirm-actions">
                        <button
                            type="button"
                            className="button button-secondary"
                            onClick={() =>
                                setPendingStatusHostel(null)
                            }
                            disabled={changingStatus}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="button button-primary"
                            onClick={confirmStatusChange}
                            disabled={changingStatus}
                        >
                            {changingStatus
                                ? "Updating..."
                                : "Confirm Change"}
                        </button>
                    </div>
                </section>
            )}

            <section className="hostels-list-panel">
                <div className="hostels-list-heading">
                    <div>
                        <h3>Registered Hostels</h3>
                        <p>
                            Search and filter hostel records.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="button button-secondary hostels-refresh"
                        onClick={refreshHostels}
                        disabled={loading}
                    >
                        <RefreshCw size={17} aria-hidden="true" />
                        Refresh
                    </button>
                </div>

                <form
                    className="hostels-filters"
                    onSubmit={handleSearch}
                >
                    <label
                        htmlFor="hostels-search"
                        className="hostels-visually-hidden"
                    >
                        Search hostels
                    </label>

                    <input
                        id="hostels-search"
                        type="search"
                        placeholder="Search name, code or location"
                        maxLength={100}
                        value={searchInput}
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
                        htmlFor="hostels-status-filter"
                        className="hostels-visually-hidden"
                    >
                        Filter by status
                    </label>

                    <select
                        id="hostels-status-filter"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <label
                        htmlFor="hostels-gender-filter"
                        className="hostels-visually-hidden"
                    >
                        Filter by gender policy
                    </label>

                    <select
                        id="hostels-gender-filter"
                        name="genderPolicy"
                        value={filters.genderPolicy}
                        onChange={handleFilterChange}
                    >
                        <option value="">All policies</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="coed">Co-ed</option>
                    </select>

                    <label
                        htmlFor="hostels-limit-filter"
                        className="hostels-visually-hidden"
                    >
                        Results per page
                    </label>

                    <select
                        id="hostels-limit-filter"
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
                        className="hostels-reset"
                        onClick={resetFilters}
                    >
                        Reset
                    </button>
                </form>

                {listError && (
                    <div
                        className="hostels-message is-error hostels-list-error"
                        role="alert"
                    >
                        {listError}

                        <button
                            type="button"
                            onClick={refreshHostels}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div
                        className="hostels-loading"
                        role="status"
                    >
                        Loading hostels...
                    </div>
                ) : !listError ? (
                    <HostelTable
                        hostels={hostels}
                        wardens={wardens}
                        onEdit={handleEdit}
                        onRequestStatusChange={requestStatusChange}
                        disabled={changingStatus}
                    />
                ) : null}

                {!listError && (
                    <div className="hostels-pagination">
                        <span>
                            Page {displayPage} of {totalPages}
                        </span>

                        <div className="hostels-pagination-actions">
                            <button
                                type="button"
                                onClick={() =>
                                    goToPage(filters.page - 1)
                                }
                                disabled={
                                    loading || filters.page <= 1
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
                                onClick={() =>
                                    goToPage(filters.page + 1)
                                }
                                disabled={
                                    loading ||
                                    filters.page >= pagination.totalPages
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

export default AdminHostelsPage;
