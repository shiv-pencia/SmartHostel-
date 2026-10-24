import { useCallback, useEffect, useState } from "react";
import {
    RefreshCw,
    MessageSquareWarning,
    Clock,
    AlertCircle,
    CheckCircle2,
    UserCheck,
    Search,
    X,
} from "lucide-react";

import {
    getComplaints,
    getComplaintStats,
    assignComplaint,
    updateComplaintStatus,
    getMaintenanceStaff,
} from "../api/complaints.api.js";

import "../styles/complaints.css";

const getErrorMessage = (error) =>
    error?.response?.data?.message ??
    error?.message ??
    "Something went wrong. Please try again.";

export default function AdminComplaintsPage() {
    const [complaints, setComplaints] = useState([]);
    const [stats, setStats] = useState(null);
    const [staffList, setStaffList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Modal state for assigning staff
    const [assignModalComplaint, setAssignModalComplaint] = useState(null);
    const [selectedStaffId, setSelectedStaffId] = useState("");
    const [submittingAssign, setSubmittingAssign] = useState(false);

    // Alert feedback
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [complaintsRes, statsRes, staffRes] = await Promise.all([
                getComplaints({ limit: 100 }),
                getComplaintStats(),
                getMaintenanceStaff(),
            ]);

            const list = Array.isArray(complaintsRes?.data)
                ? complaintsRes.data
                : complaintsRes?.data?.complaints ?? [];
            setComplaints(list);
            setStats(statsRes?.data ?? null);

            const staffMembers = Array.isArray(staffRes?.data)
                ? staffRes.data
                : staffRes?.data?.users ?? [];
            setStaffList(staffMembers);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAssignStaff = async (e) => {
        e.preventDefault();
        if (!assignModalComplaint || !selectedStaffId) return;

        setError("");
        setMessage("");
        setSubmittingAssign(true);

        try {
            await assignComplaint(assignModalComplaint.id, {
                staffId: selectedStaffId,
            });

            setMessage(
                `Staff assigned to complaint #${assignModalComplaint.id.slice(-6)} successfully.`
            );
            setAssignModalComplaint(null);
            setSelectedStaffId("");
            await loadData();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmittingAssign(false);
        }
    };

    const handleStatusUpdate = async (complaintId, newStatus) => {
        setError("");
        setMessage("");

        try {
            await updateComplaintStatus(complaintId, { status: newStatus });
            setMessage(`Complaint status updated to ${newStatus}.`);
            await loadData();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const filteredComplaints = complaints.filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) {
            return false;
        }
        if (categoryFilter !== "all" && item.category !== categoryFilter) {
            return false;
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const title = item.title?.toLowerCase() ?? "";
            const student = item.student?.name?.toLowerCase() ?? "";
            const hostel = item.hostel?.name?.toLowerCase() ?? "";
            return (
                title.includes(query) ||
                student.includes(query) ||
                hostel.includes(query)
            );
        }
        return true;
    });

    return (
        <main className="complaints-page">
            <header className="complaints-header">
                <div>
                    <p className="complaints-eyebrow">FACILITY & MAINTENANCE</p>
                    <h1>Complaint Management</h1>
                    <p className="complaints-subtitle">
                        Oversee hostel grievances, assign maintenance staff, and monitor resolution times.
                    </p>
                </div>

                <button
                    className="complaint-secondary-button"
                    type="button"
                    onClick={loadData}
                >
                    <RefreshCw size={14} aria-hidden="true" />
                    Refresh
                </button>
            </header>

            {error && (
                <div className="allocations-alert allocations-alert-error" role="alert">
                    {error}
                </div>
            )}

            {message && (
                <div className="allocations-alert allocations-alert-success" role="status">
                    {message}
                </div>
            )}

            <section className="complaints-stats-grid">
                <article className="complaint-stat-card">
                    <span>
                        <MessageSquareWarning size={16} /> Total Registered
                    </span>
                    <strong>{stats?.total ?? complaints.length}</strong>
                </article>

                <article className="complaint-stat-card">
                    <span>
                        <Clock size={16} /> Awaiting Action
                    </span>
                    <strong>{stats?.byStatus?.pending ?? 0}</strong>
                </article>

                <article className="complaint-stat-card">
                    <span>
                        <AlertCircle size={16} /> In Progress
                    </span>
                    <strong>
                        {(stats?.byStatus?.assigned ?? 0) +
                            (stats?.byStatus?.in_progress ?? 0)}
                    </strong>
                </article>

                <article className="complaint-stat-card">
                    <span>
                        <CheckCircle2 size={16} /> Resolved
                    </span>
                    <strong>{stats?.byStatus?.resolved ?? 0}</strong>
                </article>
            </section>

            <section className="complaint-panel">
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "18px",
                    }}
                >
                    <h2 style={{ margin: 0 }}>All Grievances</h2>

                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                        <div style={{ position: "relative" }}>
                            <input
                                type="search"
                                placeholder="Search by student, hostel, title..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: "8px 12px",
                                    border: "1px solid var(--border-color, #d1d5db)",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    minWidth: "220px",
                                }}
                            />
                        </div>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                border: "1px solid var(--border-color, #d1d5db)",
                                borderRadius: "8px",
                                fontSize: "14px",
                                background: "#ffffff",
                            }}
                        >
                            <option value="all">All Categories</option>
                            <option value="electrical">Electrical</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="carpentry">Carpentry</option>
                            <option value="cleaning">Cleaning</option>
                            <option value="internet">Internet</option>
                            <option value="furniture">Furniture</option>
                            <option value="other">Other</option>
                        </select>

                        <div style={{ display: "inline-flex", background: "#f3f4f6", padding: "3px", borderRadius: "8px" }}>
                            {["all", "pending", "assigned", "in_progress", "resolved"].map((st) => (
                                <button
                                    key={st}
                                    type="button"
                                    onClick={() => setStatusFilter(st)}
                                    style={{
                                        padding: "6px 12px",
                                        border: 0,
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        background: statusFilter === st ? "#ffffff" : "transparent",
                                        color: statusFilter === st ? "#1f2937" : "#6b7280",
                                        boxShadow: statusFilter === st ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                                        textTransform: "capitalize",
                                    }}
                                >
                                    {st.replace("_", " ")}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p className="complaints-muted">Loading grievances...</p>
                ) : filteredComplaints.length === 0 ? (
                    <p className="complaints-muted">No complaints match your criteria.</p>
                ) : (
                    <div className="complaints-table-wrapper">
                        <table className="complaints-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Hostel & Room</th>
                                    <th>Issue</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Assigned Staff</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredComplaints.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.student?.name ?? "Student"}</strong>
                                            <small>{item.student?.email ?? ""}</small>
                                        </td>
                                        <td>
                                            {item.hostel?.name ?? "Hostel"}
                                            {item.room && (
                                                <small>
                                                    Room {item.room.roomNumber}
                                                    {item.bed ? ` · Bed ${item.bed.bedNumber}` : ""}
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <strong>{item.title}</strong>
                                            <small>{item.description}</small>
                                            <small style={{ color: "#2563eb", textTransform: "capitalize" }}>
                                                {item.category}
                                            </small>
                                        </td>
                                        <td>
                                            <span className={`priority-badge priority-${item.priority}`}>
                                                {item.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`complaint-status-badge status-${item.status}`}>
                                                {item.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td>
                                            {item.assignedTo ? (
                                                <div>
                                                    <span style={{ fontWeight: 600 }}>{item.assignedTo.name}</span>
                                                    <small>{item.assignedTo.email}</small>
                                                </div>
                                            ) : (
                                                <span className="complaints-muted">Unassigned</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                {item.status !== "resolved" && item.status !== "rejected" && (
                                                    <button
                                                        className="complaint-action-button complaint-secondary-button"
                                                        type="button"
                                                        onClick={() => {
                                                            setAssignModalComplaint(item);
                                                            setSelectedStaffId(item.assignedTo?.id ?? "");
                                                        }}
                                                    >
                                                        <UserCheck size={14} />
                                                        {item.assignedTo ? "Reassign" : "Assign"}
                                                    </button>
                                                )}

                                                {item.status === "in_progress" && (
                                                    <button
                                                        className="complaint-action-button complaint-primary-button"
                                                        type="button"
                                                        onClick={() => handleStatusUpdate(item.id, "resolved")}
                                                    >
                                                        Mark Done
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Assign Staff Modal */}
            {assignModalComplaint && (
                <div className="complaint-modal-backdrop" role="dialog" aria-modal="true">
                    <div className="complaint-modal">
                        <div className="complaint-modal-header">
                            <h3>Assign Maintenance Staff</h3>
                            <button
                                className="complaint-modal-close"
                                type="button"
                                onClick={() => setAssignModalComplaint(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="complaints-muted" style={{ marginTop: 0, marginBottom: "16px" }}>
                            Assign a staff technician to resolve: <strong>{assignModalComplaint.title}</strong>
                        </p>

                        <form onSubmit={handleAssignStaff}>
                            <label htmlFor="select-staff" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                                Select Maintenance Staff
                            </label>
                            <select
                                id="select-staff"
                                value={selectedStaffId}
                                onChange={(e) => setSelectedStaffId(e.target.value)}
                                required
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid #d1d5db",
                                    marginBottom: "20px",
                                }}
                            >
                                <option value="">Choose a staff member</option>
                                {staffList.map((st) => (
                                    <option key={st.id} value={st.id}>
                                        {st.name} — {st.email}
                                    </option>
                                ))}
                            </select>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    className="complaint-secondary-button"
                                    type="button"
                                    onClick={() => setAssignModalComplaint(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="complaint-primary-button"
                                    type="submit"
                                    disabled={submittingAssign || !selectedStaffId}
                                >
                                    {submittingAssign ? "Assigning..." : "Confirm Assignment"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
