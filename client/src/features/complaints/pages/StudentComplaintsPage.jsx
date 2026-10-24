import { useCallback, useEffect, useState } from "react";
import {
    Plus,
    RefreshCw,
    MessageSquareWarning,
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

import {
    getComplaints,
    createComplaint,
} from "../api/complaints.api.js";

import "../styles/complaints.css";

const getErrorMessage = (error) =>
    error?.response?.data?.message ??
    error?.message ??
    "Something went wrong. Please try again.";

export default function StudentComplaintsPage() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [filterStatus, setFilterStatus] = useState("all");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Form states
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("electrical");
    const [priority, setPriority] = useState("medium");
    const [description, setDescription] = useState("");

    const loadComplaints = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getComplaints({ limit: 100 });
            const list = Array.isArray(response?.data)
                ? response.data
                : response?.data?.complaints ?? [];
            setComplaints(list);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadComplaints();
    }, [loadComplaints]);

    const handleCreate = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");
        setSubmitting(true);

        try {
            await createComplaint({
                title,
                category,
                priority,
                description,
            });

            setMessage("Complaint registered successfully. A staff member will be assigned.");
            setTitle("");
            setDescription("");
            setShowForm(false);
            await loadComplaints();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const filteredComplaints = complaints.filter((item) => {
        if (filterStatus === "all") return true;
        return item.status === filterStatus;
    });

    const pendingCount = complaints.filter(
        (c) => c.status === "pending" || c.status === "assigned"
    ).length;
    const inProgressCount = complaints.filter((c) => c.status === "in_progress").length;
    const resolvedCount = complaints.filter((c) => c.status === "resolved").length;

    return (
        <main className="complaints-page">
            <header className="complaints-header">
                <div>
                    <p className="complaints-eyebrow">STUDENT SERVICES</p>
                    <h1>My Complaints & Maintenance</h1>
                    <p className="complaints-subtitle">
                        Report issues in your room or hostel and track their resolution progress.
                    </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        className="complaint-secondary-button"
                        type="button"
                        onClick={loadComplaints}
                    >
                        <RefreshCw size={14} aria-hidden="true" />
                        Refresh
                    </button>

                    <button
                        className="complaint-primary-button"
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? (
                            <>
                                <ChevronUp size={16} /> Hide Form
                            </>
                        ) : (
                            <>
                                <Plus size={16} /> Lodge Complaint
                            </>
                        )}
                    </button>
                </div>
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
                    <strong>{complaints.length}</strong>
                </article>

                <article className="complaint-stat-card">
                    <span>
                        <Clock size={16} /> Pending / Assigned
                    </span>
                    <strong>{pendingCount}</strong>
                </article>

                <article className="complaint-stat-card">
                    <span>
                        <AlertCircle size={16} /> In Progress
                    </span>
                    <strong>{inProgressCount}</strong>
                </article>

                <article className="complaint-stat-card">
                    <span>
                        <CheckCircle2 size={16} /> Resolved
                    </span>
                    <strong>{resolvedCount}</strong>
                </article>
            </section>

            {showForm && (
                <section className="complaint-panel">
                    <h2>Register a New Issue</h2>

                    <form className="complaint-form" onSubmit={handleCreate}>
                        <div className="complaint-form-full">
                            <label htmlFor="complaint-title">Subject / Title</label>
                            <input
                                id="complaint-title"
                                type="text"
                                placeholder="e.g. Ceiling fan not spinning at full speed"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                minLength={3}
                                maxLength={120}
                            />
                        </div>

                        <div>
                            <label htmlFor="complaint-category">Category</label>
                            <select
                                id="complaint-category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                            >
                                <option value="electrical">Electrical</option>
                                <option value="plumbing">Plumbing</option>
                                <option value="carpentry">Carpentry</option>
                                <option value="cleaning">Cleaning</option>
                                <option value="internet">Internet / Wi-Fi</option>
                                <option value="furniture">Furniture</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="complaint-priority">Priority</label>
                            <select
                                id="complaint-priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                required
                            >
                                <option value="low">Low (General)</option>
                                <option value="medium">Medium (Standard)</option>
                                <option value="high">High (Urgent Attention)</option>
                                <option value="urgent">Urgent (Emergency)</option>
                            </select>
                        </div>

                        <div className="complaint-form-full">
                            <label htmlFor="complaint-desc">Detailed Description</label>
                            <textarea
                                id="complaint-desc"
                                placeholder="Describe the problem, when it started, and where in your room it is located..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                minLength={10}
                                maxLength={2000}
                            />
                        </div>

                        <div className="complaint-form-full" style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                            <button
                                className="complaint-primary-button"
                                type="submit"
                                disabled={submitting}
                            >
                                {submitting ? "Submitting..." : "Submit Complaint"}
                            </button>
                            <button
                                className="complaint-secondary-button"
                                type="button"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="complaint-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                    <h2 style={{ margin: 0 }}>Complaint History</h2>

                    <div style={{ display: "inline-flex", background: "#f3f4f6", padding: "3px", borderRadius: "8px" }}>
                        {["all", "pending", "in_progress", "resolved"].map((st) => (
                            <button
                                key={st}
                                type="button"
                                onClick={() => setFilterStatus(st)}
                                style={{
                                    padding: "6px 12px",
                                    border: 0,
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    background: filterStatus === st ? "#ffffff" : "transparent",
                                    color: filterStatus === st ? "#1f2937" : "#6b7280",
                                    boxShadow: filterStatus === st ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                                    textTransform: "capitalize",
                                }}
                            >
                                {st.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <p className="complaints-muted">Loading your complaints...</p>
                ) : filteredComplaints.length === 0 ? (
                    <p className="complaints-muted">No complaints found under this view.</p>
                ) : (
                    <div className="complaints-table-wrapper">
                        <table className="complaints-table">
                            <thead>
                                <tr>
                                    <th>Subject & Details</th>
                                    <th>Category</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Assigned Staff</th>
                                    <th>Resolution</th>
                                    <th>Filed On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredComplaints.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <strong>{item.title}</strong>
                                            <small>{item.description}</small>
                                            {item.room && (
                                                <small style={{ color: "#2563eb" }}>
                                                    Room: {item.room.roomNumber}
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ textTransform: "capitalize" }}>{item.category}</span>
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
                                                    <strong>{item.assignedTo.name}</strong>
                                                    <small>{item.assignedTo.phone || item.assignedTo.email}</small>
                                                </div>
                                            ) : (
                                                <span className="complaints-muted">Awaiting Assignment</span>
                                            )}
                                        </td>
                                        <td>
                                            {item.status === "resolved" ? (
                                                <div>
                                                    <span style={{ color: "#166534", fontWeight: 600 }}>Resolved</span>
                                                    {item.resolutionNotes && (
                                                        <small>{item.resolutionNotes}</small>
                                                    )}
                                                </div>
                                            ) : item.status === "rejected" ? (
                                                <span style={{ color: "#991b1b" }}>Rejected</span>
                                            ) : (
                                                <span className="complaints-muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
