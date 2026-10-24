import { useCallback, useEffect, useState } from "react";
import {
    RefreshCw,
    Wrench,
    Clock,
    CheckCircle2,
    Play,
    Check,
    X,
} from "lucide-react";

import {
    getComplaints,
    updateComplaintStatus,
} from "../api/complaints.api.js";

import "../styles/complaints.css";

const getErrorMessage = (error) =>
    error?.response?.data?.message ??
    error?.message ??
    "Something went wrong. Please try again.";

export default function StaffTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // Modal state for resolving task with notes
    const [resolvingTask, setResolvingTask] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [submittingResolution, setSubmittingResolution] = useState(false);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const res = await getComplaints({ limit: 100 });
            const list = Array.isArray(res?.data)
                ? res.data
                : res?.data?.complaints ?? [];
            setTasks(list);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleStartWork = async (taskId) => {
        setError("");
        setMessage("");

        try {
            await updateComplaintStatus(taskId, { status: "in_progress" });
            setMessage("Task marked as In Progress.");
            await loadTasks();
        } catch (err) {
            setError(getErrorMessage(err));
        }
    };

    const handleResolveTask = async (e) => {
        e.preventDefault();
        if (!resolvingTask) return;

        setError("");
        setMessage("");
        setSubmittingResolution(true);

        try {
            await updateComplaintStatus(resolvingTask.id, {
                status: "resolved",
                resolutionNotes,
            });
            setMessage(`Task #${resolvingTask.id.slice(-6)} resolved successfully.`);
            setResolvingTask(null);
            setResolutionNotes("");
            await loadTasks();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmittingResolution(false);
        }
    };

    const assignedCount = tasks.filter((t) => t.status === "assigned").length;
    const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
    const resolvedCount = tasks.filter((t) => t.status === "resolved").length;

    return (
        <main className="complaints-page">
            <header className="complaints-header">
                <div>
                    <p className="complaints-eyebrow">MAINTENANCE & WORK ORDERS</p>
                    <h1>Assigned Maintenance Tasks</h1>
                    <p className="complaints-subtitle">
                        View complaints assigned to you, start repairs, and submit resolution reports.
                    </p>
                </div>

                <button
                    className="complaint-secondary-button"
                    type="button"
                    onClick={loadTasks}
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
                        <Wrench size={16} /> Total Assigned
                    </span>
                    <strong>{tasks.length}</strong>
                </article>

                <article className="complaint-stat-card">
                    <span>
                        <Clock size={16} /> Ready to Start
                    </span>
                    <strong>{assignedCount}</strong>
                </article>

                <article className="complaint-stat-card">
                    <span>
                        <Play size={16} /> Work In Progress
                    </span>
                    <strong>{inProgressCount}</strong>
                </article>

                <article className="complaint-stat-card">
                    <span>
                        <CheckCircle2 size={16} /> Completed
                    </span>
                    <strong>{resolvedCount}</strong>
                </article>
            </section>

            <section className="complaint-panel">
                <h2>Your Work Orders</h2>

                {loading ? (
                    <p className="complaints-muted">Loading assigned tasks...</p>
                ) : tasks.length === 0 ? (
                    <p className="complaints-muted">No maintenance tasks currently assigned to you.</p>
                ) : (
                    <div className="complaints-table-wrapper">
                        <table className="complaints-table">
                            <thead>
                                <tr>
                                    <th>Location</th>
                                    <th>Issue & Description</th>
                                    <th>Category</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task.id}>
                                        <td>
                                            <strong>{task.hostel?.name ?? "Hostel"}</strong>
                                            {task.room && (
                                                <small>
                                                    Room {task.room.roomNumber} (Floor {task.room.floor})
                                                </small>
                                            )}
                                            {task.student && (
                                                <small>Resident: {task.student.name}</small>
                                            )}
                                        </td>
                                        <td>
                                            <strong>{task.title}</strong>
                                            <small>{task.description}</small>
                                            {task.resolutionNotes && (
                                                <small style={{ color: "#166534" }}>
                                                    Note: {task.resolutionNotes}
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{ textTransform: "capitalize" }}>{task.category}</span>
                                        </td>
                                        <td>
                                            <span className={`priority-badge priority-${task.priority}`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`complaint-status-badge status-${task.status}`}>
                                                {task.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", gap: "6px" }}>
                                                {task.status === "assigned" && (
                                                    <button
                                                        className="complaint-action-button complaint-primary-button"
                                                        type="button"
                                                        onClick={() => handleStartWork(task.id)}
                                                    >
                                                        <Play size={13} /> Start Work
                                                    </button>
                                                )}

                                                {task.status === "in_progress" && (
                                                    <button
                                                        className="complaint-action-button"
                                                        type="button"
                                                        style={{ background: "#166534", color: "#ffffff" }}
                                                        onClick={() => {
                                                            setResolvingTask(task);
                                                            setResolutionNotes("");
                                                        }}
                                                    >
                                                        <Check size={14} /> Resolve Task
                                                    </button>
                                                )}

                                                {task.status === "resolved" && (
                                                    <span className="complaints-muted" style={{ fontSize: "13px" }}>
                                                        Completed ✓
                                                    </span>
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

            {/* Resolve Modal */}
            {resolvingTask && (
                <div className="complaint-modal-backdrop" role="dialog" aria-modal="true">
                    <div className="complaint-modal">
                        <div className="complaint-modal-header">
                            <h3>Mark Task as Resolved</h3>
                            <button
                                className="complaint-modal-close"
                                type="button"
                                onClick={() => setResolvingTask(null)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <p className="complaints-muted" style={{ marginTop: 0, marginBottom: "16px" }}>
                            Resolving: <strong>{resolvingTask.title}</strong> at {resolvingTask.hostel?.name} (Room {resolvingTask.room?.roomNumber ?? "—"})
                        </p>

                        <form onSubmit={handleResolveTask}>
                            <label htmlFor="res-notes" style={{ display: "block", marginBottom: "8px", fontWeight: 600 }}>
                                Resolution Notes / Work Performed
                            </label>
                            <textarea
                                id="res-notes"
                                placeholder="Describe the repairs made or parts replaced..."
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                required
                                minLength={5}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid #d1d5db",
                                    minHeight: "90px",
                                    marginBottom: "20px",
                                    boxSizing: "border-box",
                                }}
                            />

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button
                                    className="complaint-secondary-button"
                                    type="button"
                                    onClick={() => setResolvingTask(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="complaint-primary-button"
                                    type="submit"
                                    disabled={submittingResolution || !resolutionNotes.trim()}
                                >
                                    {submittingResolution ? "Submitting..." : "Confirm & Complete"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
