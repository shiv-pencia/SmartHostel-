import { useState, useEffect } from "react";
import { ContactRound, RefreshCw, LogOut, ShieldCheck, Clock } from "lucide-react";
import { listVisitors, checkoutVisitor } from "../api/visitors.api.js";
import "../styles/visitors.css";

export default function WardenVisitorsPage() {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState(null);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        const fetchVisitors = async () => {
            setLoading(true);
            setError("");

            try {
                const data = await listVisitors({}, controller.signal);
                setVisitors(data);
            } catch (err) {
                if (err.name !== "CanceledError" && err.name !== "AbortError") {
                    setError(err.message || "Failed to load visitors");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchVisitors();

        return () => controller.abort();
    }, [reloadKey]);

    const handleCheckout = async (visitorId) => {
        setActionLoading(visitorId);
        try {
            await checkoutVisitor(visitorId);
            setReloadKey((p) => p + 1);
        } catch (err) {
            alert(err.message || "Failed to checkout visitor");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="visitors-page">
            <div className="visitors-header">
                <div>
                    <p className="dashboard-section-label">Campus Security & Gate Control</p>
                    <h2>Visitor Management</h2>
                    <p>Track guest entries, verified ID credentials, and departure times.</p>
                </div>

                <button
                    type="button"
                    onClick={() => setReloadKey((p) => p + 1)}
                    className="btn-secondary"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={loading ? "spin" : ""} aria-hidden="true" />
                    Refresh Log
                </button>
            </div>

            {error && (
                <div className="reports-message is-error" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="reports-loading">
                    <p>Loading gate entry logs...</p>
                </div>
            ) : visitors.length === 0 ? (
                <div className="reports-empty">
                    <p>No visitor entries logged today.</p>
                </div>
            ) : (
                <div className="visitors-table-panel reports-table-panel">
                    <div className="reports-table-scroll">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    <th>Visitor Name</th>
                                    <th>Contact Phone</th>
                                    <th>Student Visited</th>
                                    <th>Hostel</th>
                                    <th>Purpose</th>
                                    <th>ID Type</th>
                                    <th>Check-in</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visitors.map((v) => (
                                    <tr key={v.id}>
                                        <td>
                                            <strong>{v.visitorName}</strong>
                                        </td>
                                        <td>{v.visitorPhone}</td>
                                        <td>
                                            <strong>{v.student?.name || "Student"}</strong>
                                            <small>{v.student?.email || ""}</small>
                                        </td>
                                        <td>{v.hostel?.name || "General"}</td>
                                        <td>{v.purpose}</td>
                                        <td>
                                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                                                {v.idProofType}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: "12px" }}>
                                                {new Date(v.checkIn).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`visitor-badge ${v.status}`}>
                                                {v.status === "inside" ? "On Campus" : "Checked Out"}
                                            </span>
                                        </td>
                                        <td>
                                            {v.status === "inside" ? (
                                                <button
                                                    type="button"
                                                    className="btn-secondary"
                                                    style={{ padding: "4px 10px", fontSize: "12px" }}
                                                    onClick={() => handleCheckout(v.id)}
                                                    disabled={actionLoading === v.id}
                                                >
                                                    <LogOut size={13} aria-hidden="true" />
                                                    {actionLoading === v.id ? "Checking out..." : "Checkout"}
                                                </button>
                                            ) : (
                                                <small className="text-muted">
                                                    Departed at{" "}
                                                    {new Date(v.checkOut).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </small>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
