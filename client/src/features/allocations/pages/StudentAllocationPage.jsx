import { useCallback, useEffect, useState } from "react";
import { BedDouble, Building2, Calendar, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

import { getMyAllocation } from "../api/allocations.api.js";
import "./allocations.css";

const getErrorMessage = (error) =>
    error?.response?.data?.message ??
    error?.message ??
    "Unable to load your allocation details.";

export default function StudentAllocationPage() {
    const [allocation, setAllocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadAllocation = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await getMyAllocation();
            const data = response?.data ?? response;
            setAllocation(data && data.status === "active" ? data : null);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAllocation();
    }, [loadAllocation]);

    if (loading) {
        return (
            <main className="allocations-page">
                <p className="allocations-muted">Loading your allocation details...</p>
            </main>
        );
    }

    return (
        <main className="allocations-page">
            <header className="allocations-header">
                <div>
                    <p className="allocations-eyebrow">RESIDENT SERVICES</p>
                    <h1>My Allocation</h1>
                    <p className="allocations-subtitle">
                        View your assigned hostel room, bed number, and residency details.
                    </p>
                </div>

                <button
                    className="allocations-secondary-button"
                    onClick={loadAllocation}
                    type="button"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
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

            {allocation ? (
                <div className="allocation-student-card">
                    <div className="allocation-student-status-badge">
                        <CheckCircle2 size={16} />
                        <span>Active Allocation</span>
                    </div>

                    <div className="allocation-student-details-grid">
                        <article className="allocation-student-detail-item">
                            <span className="allocation-detail-label">
                                <Building2 size={16} />
                                Hostel
                            </span>
                            <strong>{allocation.hostel?.name ?? "Hostel"}</strong>
                            {allocation.hostel?.code && (
                                <small>Code: {allocation.hostel.code}</small>
                            )}
                        </article>

                        <article className="allocation-student-detail-item">
                            <span className="allocation-detail-label">
                                <BedDouble size={16} />
                                Room & Bed
                            </span>
                            <strong>
                                Room {allocation.room?.roomNumber ?? "—"} · Bed {allocation.bed?.bedNumber ?? "—"}
                            </strong>
                            <small>
                                Floor: {allocation.room?.floor ?? 0} ({allocation.room?.roomType ?? "standard"})
                            </small>
                        </article>

                        <article className="allocation-student-detail-item">
                            <span className="allocation-detail-label">
                                <Calendar size={16} />
                                Allocated Since
                            </span>
                            <strong>
                                {allocation.allocatedAt
                                    ? new Date(allocation.allocatedAt).toLocaleDateString(undefined, {
                                          year: "numeric",
                                          month: "short",
                                          day: "numeric",
                                      })
                                    : "—"}
                            </strong>
                            <small>
                                By: {allocation.allocatedBy?.name ?? "Administration"}
                            </small>
                        </article>
                    </div>
                </div>
            ) : (
                <section className="allocation-panel" style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ display: "inline-flex", padding: "12px", borderRadius: "50%", background: "#fef3c7", color: "#b45309", marginBottom: "16px" }}>
                        <AlertCircle size={32} />
                    </div>
                    <h2>No Active Allocation Found</h2>
                    <p className="allocations-muted" style={{ maxWidth: "480px", margin: "8px auto 0" }}>
                        You do not currently have an active hostel bed allocation. Please reach out to your hostel administrator or warden to obtain a room assignment.
                    </p>
                </section>
            )}
        </main>
    );
}
