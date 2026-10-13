
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Search,
    RefreshCw,
    Users,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import { listUsers } from "../api/users.api.js";

import UserTable from "../components/UserTable.jsx";
import UserDetailsPanel from "../components/UserDetailsPanel.jsx";

import { useAuth } from "../../../hooks/useAuth.js";

import "../styles/users.css";

const initialFilters = {
    page: 1,
    limit: 10,
    search: "",
    role: "",
    status: "",
};

function AdminUsersPage() {
    const {
        user: currentUser,
        refreshSession,
    } = useAuth();

    // Search input before submission
    const [searchInput, setSearchInput] = useState("");

    // Applied filters sent to Express
    const [filters, setFilters] = useState(initialFilters);

    const [users, setUsers] = useState([]);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [reloadKey, setReloadKey] = useState(0);
    const [selectedUserId, setSelectedUserId] =
        useState(null);

    /*
     * Fetch users whenever filters or reloadKey change
     */
    useEffect(() => {
        const controller = new AbortController();

        const loadUsers = async () => {
            setLoading(true);
            setError("");

            const query = {
                page: filters.page,
                limit: filters.limit,
            };

            if (filters.search) {
                query.search = filters.search;
            }

            if (filters.role) {
                query.role = filters.role;
            }

            if (filters.status) {
                query.status = filters.status;
            }

            try {
                const result = await listUsers(
                    query,
                    controller.signal
                );

                if (controller.signal.aborted) return;

                setUsers(result.users);
                setPagination(result.pagination);

                // If a filter change leaves the current
                // page outside the available page range,
                // return to the last available page.
                if (
                    result.pagination.totalPages > 0 &&
                    filters.page > result.pagination.totalPages
                ) {
                    setFilters((previous) => ({
                        ...previous,
                        page: result.pagination.totalPages,
                    }));
                }
            } catch (err) {
                if (controller.signal.aborted) return;

                setUsers([]);
                setError(
                    err.message || "Unable to load users"
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadUsers();

        return () => {
            controller.abort();
        };
    }, [filters, reloadKey]);

    /*
     * Search form submission
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
     * Update dropdown filters
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
     * Reset filters
     */
    const handleReset = () => {
        setSearchInput("");
        setFilters({ ...initialFilters });
    };

    /*
     * Reload current page
     */
    const refreshUsers = useCallback(() => {
        setReloadKey((previous) => previous + 1);
    }, []);

    /*
     * Called when editing a user succeeds
     */
    const handleUserChanged = useCallback(
        (updatedUser) => {
            refreshUsers();

            // If admin edited their own profile,
            // refresh shared topbar account details.
            if (updatedUser.id === currentUser?.id) {
                void refreshSession();
            }
        },
        [
            currentUser?.id,
            refreshUsers,
            refreshSession,
        ]
    );

    const goToPage = (page) => {
        if (
            page < 1 ||
            page > pagination.totalPages ||
            loading
        ) {
            return;
        }

        setFilters((previous) => ({
            ...previous,
            page,
        }));
    };

    const displayedPage = Math.min(
        pagination.page,
        Math.max(1, pagination.totalPages)
    );

    return (
        <div className="users-page">
            <section className="users-page-heading">
                <div>
                    <p className="dashboard-section-label">
                        Administration
                    </p>

                    <h2>User Management</h2>

                    <p>
                        Search, review and manage registered
                        Smart Hostel accounts.
                    </p>
                </div>

                <button
                    type="button"
                    className="button button-secondary users-refresh"
                    onClick={refreshUsers}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        aria-hidden="true"
                    />
                    Refresh
                </button>
            </section>

            <section className="users-summary">
                <div className="users-summary-icon">
                    <Users size={23} aria-hidden="true" />
                </div>

                <div>
                    <span>Total Matching Users</span>
                    <strong>
                        {loading ? "..." : pagination.total}
                    </strong>
                </div>
            </section>

            <section className="users-list-panel">
                <div className="users-list-heading">
                    <h3>Registered Users</h3>
                    <p>
                        Apply filters to find a particular account.
                    </p>
                </div>

                <form
                    className="users-filters"
                    onSubmit={handleSearch}
                >
                    <div className="users-search-group">
                        <label
                            htmlFor="users-search"
                            className="users-visually-hidden"
                        >
                            Search by name or email
                        </label>

                        <Search
                            size={18}
                            aria-hidden="true"
                        />

                        <input
                            id="users-search"
                            type="search"
                            placeholder="Search name or email"
                            value={searchInput}
                            maxLength={100}
                            onChange={(event) =>
                                setSearchInput(event.target.value)
                            }
                        />
                    </div>

                    <button
                        type="submit"
                        className="button button-primary"
                    >
                        Search
                    </button>

                    <label
                        htmlFor="users-role-filter"
                        className="users-visually-hidden"
                    >
                        Filter by role
                    </label>

                    <select
                        id="users-role-filter"
                        name="role"
                        value={filters.role}
                        onChange={handleFilterChange}
                    >
                        <option value="">All roles</option>
                        <option value="student">Students</option>
                        <option value="warden">Wardens</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Administrators</option>
                    </select>

                    <label
                        htmlFor="users-status-filter"
                        className="users-visually-hidden"
                    >
                        Filter by status
                    </label>

                    <select
                        id="users-status-filter"
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>

                    <label
                        htmlFor="users-limit-filter"
                        className="users-visually-hidden"
                    >
                        Results per page
                    </label>

                    <select
                        id="users-limit-filter"
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
                        className="users-reset-button"
                        onClick={handleReset}
                    >
                        Reset
                    </button>
                </form>

                {error && (
                    <div
                        className="users-message is-error users-list-error"
                        role="alert"
                    >
                        {error}

                        <button
                            type="button"
                            onClick={refreshUsers}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div
                        className="users-loading-state"
                        role="status"
                    >
                        Loading users...
                    </div>
                ) : !error ? (
                    <UserTable
                        users={users}
                        onViewUser={setSelectedUserId}
                    />
                ) : null}

                {!error && (
                    <div className="users-pagination">
                        <p>
                            Page {displayedPage} of{" "}
                            {Math.max(1, pagination.totalPages)}
                        </p>

                        <div className="users-pagination-actions">
                            <button
                                type="button"
                                aria-label="Previous page"
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
                                aria-label="Next page"
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

            {selectedUserId && (
                <UserDetailsPanel
                    key={selectedUserId}
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                    onChanged={handleUserChanged}
                />
            )}
        </div>
    );
}

export default AdminUsersPage;
