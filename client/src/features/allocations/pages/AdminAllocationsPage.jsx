import { useCallback, useEffect, useState } from "react";
import { RefreshCw, BedDouble, UserCheck, Users } from "lucide-react";

import {
    getStudents,
    getVacantBeds,
    createAllocation,
    getAllocations,
    vacateAllocation,
} from "../api/allocations.api.js";

import "./allocations.css";

const getId = (item) => item?._id ?? item?.id ?? "";

const getArray = (response, key) => {
    if (Array.isArray(response)) {
        return response;
    }
    if (Array.isArray(response?.data)) {
        return response.data;
    }
    if (Array.isArray(response?.data?.[key])) {
        return response.data[key];
    }
    if (Array.isArray(response?.[key])) {
        return response[key];
    }
    return [];
};

const getErrorMessage = (error) =>
    error?.response?.data?.message ??
    error?.message ??
    "Something went wrong. Please try again.";

export default function AdminAllocationsPage() {
    const [students, setStudents] = useState([]);
    const [vacantBeds, setVacantBeds] = useState([]);
    const [allocations, setAllocations] = useState([]);

    const [studentId, setStudentId] = useState("");
    const [bedId, setBedId] = useState("");

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [vacatingId, setVacatingId] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [studentResponse, bedResponse, allocationResponse] =
                await Promise.all([
                    getStudents(),
                    getVacantBeds(),
                    getAllocations({ page: 1, limit: 100 }),
                ]);

            const studentList = getArray(studentResponse, "users").filter(
                (student) =>
                    student.role === "student" && student.isActive !== false
            );

            const beds = getArray(bedResponse, "beds");
            const allocationList = getArray(allocationResponse, "allocations");

            setStudents(studentList);
            setVacantBeds(beds);
            setAllocations(allocationList);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const activeStudentIds = new Set(
        allocations
            .filter((item) => item.status === "active")
            .map((item) => getId(item.student))
    );

    const handleAllocate = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");

        if (!studentId || !bedId) {
            setError("Please select both a student and a vacant bed.");
            return;
        }

        const selectedBed = vacantBeds.find((bed) => getId(bed) === bedId);

        if (!selectedBed) {
            setError(
                "This bed is no longer in the vacancy list. Refresh and try again."
            );
            return;
        }

        setSubmitting(true);

        try {
            await createAllocation({
                studentId,
                hostelId: getId(selectedBed.hostel),
                roomId: getId(selectedBed.room),
                bedId,
            });

            setMessage("Student allocated successfully.");
            setStudentId("");
            setBedId("");

            await loadData();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    const handleVacate = async (allocationId) => {
        const confirmed = window.confirm(
            "Are you sure you want to vacate this allocation?"
        );

        if (!confirmed) {
            return;
        }

        setError("");
        setMessage("");
        setVacatingId(allocationId);

        try {
            await vacateAllocation(allocationId);

            setMessage("Allocation vacated successfully.");
            await loadData();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setVacatingId(null);
        }
    };

    const filteredAllocations = allocations.filter((item) => {
        if (filterStatus !== "all" && item.status !== filterStatus) {
            return false;
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const studentName = item.student?.name?.toLowerCase() ?? "";
            const studentEmail = item.student?.email?.toLowerCase() ?? "";
            const hostelName = item.hostel?.name?.toLowerCase() ?? "";
            const roomNum = item.room?.roomNumber?.toLowerCase() ?? "";
            return (
                studentName.includes(query) ||
                studentEmail.includes(query) ||
                hostelName.includes(query) ||
                roomNum.includes(query)
            );
        }
        return true;
    });

    if (loading) {
        return (
            <main className="allocations-page">
                <p className="allocations-muted">Loading allocation data...</p>
            </main>
        );
    }

    return (
        <main className="allocations-page">
            <header className="allocations-header">
                <div>
                    <p className="allocations-eyebrow">HOSTEL ADMINISTRATION</p>
                    <h1>Student Allocation</h1>
                    <p className="allocations-subtitle">
                        Assign beds and manage active hostel occupancy.
                    </p>
                </div>

                <button
                    className="allocations-secondary-button"
                    onClick={loadData}
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

            {message && (
                <div className="allocations-alert allocations-alert-success" role="status">
                    {message}
                </div>
            )}

            <section className="allocations-stats">
                <article className="allocation-stat">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <BedDouble size={16} /> Available beds
                    </span>
                    <strong>{vacantBeds.length}</strong>
                </article>

                <article className="allocation-stat">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <UserCheck size={16} /> Active allocations
                    </span>
                    <strong>
                        {
                            allocations.filter((item) => item.status === "active")
                                .length
                        }
                    </strong>
                </article>

                <article className="allocation-stat">
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Users size={16} /> Total records loaded
                    </span>
                    <strong>{allocations.length}</strong>
                </article>
            </section>

            <section className="allocation-panel">
                <h2>Allocate a Bed</h2>

                <form onSubmit={handleAllocate}>
                    <label htmlFor="allocation-student">Student</label>

                    <select
                        id="allocation-student"
                        value={studentId}
                        onChange={(event) => setStudentId(event.target.value)}
                        required
                    >
                        <option value="">Select an active student</option>

                        {students.map((student) => {
                            const sId = getId(student);
                            const isAllocated = activeStudentIds.has(sId);
                            return (
                                <option
                                    key={sId}
                                    value={sId}
                                    disabled={isAllocated}
                                >
                                    {student.name} — {student.email}
                                    {isAllocated ? " (Already allocated)" : ""}
                                </option>
                            );
                        })}
                    </select>

                    <label htmlFor="allocation-bed">Available Bed</label>

                    <select
                        id="allocation-bed"
                        value={bedId}
                        onChange={(event) => setBedId(event.target.value)}
                        required
                    >
                        <option value="">Select a vacant bed</option>

                        {vacantBeds.map((bed) => (
                            <option key={getId(bed)} value={getId(bed)}>
                                {bed.hostel?.name ?? "Hostel"} · Room{" "}
                                {bed.room?.roomNumber ?? "—"} · Bed{" "}
                                {bed.bedNumber}
                            </option>
                        ))}
                    </select>

                    {vacantBeds.length === 0 && (
                        <p className="allocations-muted">
                            No vacant beds are currently available.
                        </p>
                    )}

                    <button
                        className="allocations-primary-button"
                        type="submit"
                        disabled={
                            submitting ||
                            vacatingId !== null ||
                            students.length === 0 ||
                            vacantBeds.length === 0
                        }
                    >
                        {submitting ? "Allocating..." : "Allocate Bed"}
                    </button>
                </form>
            </section>

            <section className="allocation-panel">
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <h2 style={{ margin: 0 }}>Allocation Records</h2>

                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
                        <input
                            type="search"
                            placeholder="Search by student, hostel, room..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ minWidth: "220px", padding: "8px 12px", border: "1px solid var(--border-color, #d1d5db)", borderRadius: "8px", fontSize: "14px" }}
                        />

                        <div style={{ display: "inline-flex", background: "#f3f4f6", padding: "3px", borderRadius: "8px" }}>
                            {["all", "active", "vacated"].map((st) => (
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
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="allocation-table-wrapper">
                    <table className="allocation-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Hostel</th>
                                <th>Room</th>
                                <th>Bed</th>
                                <th>Allocated Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredAllocations.map((allocation) => {
                                const aId = getId(allocation);
                                const isVacating = vacatingId === aId;

                                return (
                                    <tr key={aId}>
                                        <td>
                                            <strong>{allocation.student?.name ?? "Student"}</strong>
                                            <small>{allocation.student?.email ?? ""}</small>
                                        </td>

                                        <td>
                                            {allocation.hostel?.name ?? "—"}
                                            {allocation.hostel?.code && (
                                                <small>{allocation.hostel.code}</small>
                                            )}
                                        </td>

                                        <td>
                                            Room {allocation.room?.roomNumber ?? "—"}
                                            {allocation.room?.floor !== undefined && (
                                                <small>Floor {allocation.room.floor}</small>
                                            )}
                                        </td>

                                        <td>
                                            Bed {allocation.bed?.bedNumber ?? "—"}
                                        </td>

                                        <td>
                                            {allocation.allocatedAt
                                                ? new Date(allocation.allocatedAt).toLocaleDateString()
                                                : "—"}
                                        </td>

                                        <td>
                                            <span
                                                className={`allocation-status ${
                                                    allocation.status === "active"
                                                        ? "allocation-status-active"
                                                        : "allocation-status-vacated"
                                                }`}
                                            >
                                                {allocation.status}
                                            </span>
                                        </td>

                                        <td>
                                            {allocation.status === "active" ? (
                                                <button
                                                    className="allocations-danger-button"
                                                    type="button"
                                                    disabled={isVacating || submitting}
                                                    onClick={() => handleVacate(aId)}
                                                >
                                                    {isVacating ? "Vacating..." : "Vacate"}
                                                </button>
                                            ) : (
                                                <span className="allocations-muted">
                                                    Vacated
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}

                            {allocations.length === 0 && (
                                <tr>
                                    <td colSpan="7">
                                        No allocation records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
