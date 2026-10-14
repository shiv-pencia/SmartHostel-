
import { useEffect, useState } from "react";

import {
    Building2,
    DoorOpen,
    BedDouble,
    Layers,
    Wrench,
    CircleAlert,
    RefreshCw,
    ShieldAlert,
} from "lucide-react";

import {
    getInventoryReport,
} from "../api/inventory.api.js";

import "../styles/reports.css";

const summaryCards = [
    {
        key: "totalHostels",
        label: "Total Hostels",
        icon: Building2,
    },
    {
        key: "totalRooms",
        label: "Total Rooms",
        icon: DoorOpen,
    },
    {
        key: "totalCapacity",
        label: "Room Capacity",
        icon: Layers,
    },
    {
        key: "provisionedBeds",
        label: "Provisioned Beds",
        icon: BedDouble,
    },
    {
        key: "unprovisionedSlots",
        label: "Unprovisioned Slots",
        icon: Layers,
    },
    {
        key: "provisionableSlots",
        label: "Provisionable Slots",
        icon: BedDouble,
    },
    {
        key: "maintenanceBeds",
        label: "Maintenance Beds",
        icon: Wrench,
    },
];

const numberFormat = new Intl.NumberFormat("en-IN");

const formatNumber = (value) =>
    numberFormat.format(value ?? 0);

function SummaryCard({
    label,
    value,
    icon: Icon,
}) {
    return (
        <article className="reports-stat-card">
            <div className="reports-stat-heading">
                <span>{label}</span>

                <span className="reports-stat-icon">
                    <Icon size={20} aria-hidden="true" />
                </span>
            </div>

            <strong>{formatNumber(value)}</strong>
        </article>
    );
}

function AdminInventoryReportPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadKey, setReloadKey] = useState(0);

    /*
     * Fetch live inventory statistics
     */
    useEffect(() => {
        const controller = new AbortController();

        const loadReport = async () => {
            setLoading(true);
            setError("");

            try {
                const result = await getInventoryReport(
                    controller.signal
                );

                if (!controller.signal.aborted) {
                    setReport(result);
                }
            } catch (err) {
                if (!controller.signal.aborted) {
                    setReport(null);
                    setError(
                        err.message ||
                        "Unable to load inventory report"
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void loadReport();

        return () => controller.abort();
    }, [reloadKey]);

    const refreshReport = () => {
        setReloadKey((previous) => previous + 1);
    };

    const summary = report?.summary;

    const hasIntegrityProblems =
        summary &&
        (
            summary.counterMismatchRooms > 0 ||
            summary.overCapacityRooms > 0 ||
            summary.orphanRooms > 0 ||
            summary.orphanBeds > 0
        );

    const generatedAt = report?.generatedAt
        ? new Date(report.generatedAt).toLocaleString(
            "en-IN"
        )
        : null;

    return (
        <div className="reports-page">
            <section className="reports-page-heading">
                <div>
                    <p className="dashboard-section-label">
                        Administration / Reports
                    </p>

                    <h2>Inventory Report</h2>

                    <p>
                        Hostel, room and bed inventory calculated
                        from MongoDB records.
                    </p>
                </div>

                <button
                    type="button"
                    className="button button-secondary reports-refresh"
                    onClick={refreshReport}
                    disabled={loading}
                >
                    <RefreshCw
                        size={17}
                        aria-hidden="true"
                    />
                    Refresh
                </button>
            </section>

            {error && (
                <div
                    className="reports-message is-error"
                    role="alert"
                >
                    <p>{error}</p>

                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={refreshReport}
                    >
                        Retry
                    </button>
                </div>
            )}

            {loading && (
                <div
                    className="reports-loading"
                    role="status"
                >
                    Generating inventory report...
                </div>
            )}

            {!loading && report && (
                <>
                    <p className="reports-generated">
                        Last generated: {generatedAt}
                    </p>

                    <section
                        className="reports-stats-grid"
                        aria-label="Inventory summary"
                    >
                        {summaryCards.map((card) => (
                            <SummaryCard
                                key={card.key}
                                label={card.label}
                                value={summary[card.key]}
                                icon={card.icon}
                            />
                        ))}
                    </section>

                    <section className="reports-panel">
                        <div className="reports-section-heading">
                            <h3>Operational Overview</h3>

                            <p>
                                Status of registered hostels, rooms
                                and beds.
                            </p>
                        </div>

                        <div className="reports-detail-grid">
                            <div>
                                <span>Active Hostels</span>
                                <strong>
                                    {formatNumber(summary.activeHostels)}
                                </strong>
                            </div>

                            <div>
                                <span>Inactive Hostels</span>
                                <strong>
                                    {formatNumber(summary.inactiveHostels)}
                                </strong>
                            </div>

                            <div>
                                <span>Active Rooms</span>
                                <strong>
                                    {formatNumber(summary.activeRooms)}
                                </strong>
                            </div>

                            <div>
                                <span>Maintenance Rooms</span>
                                <strong>
                                    {formatNumber(summary.maintenanceRooms)}
                                </strong>
                            </div>

                            <div>
                                <span>Inactive Rooms</span>
                                <strong>
                                    {formatNumber(summary.inactiveRooms)}
                                </strong>
                            </div>

                            <div>
                                <span>Usable Beds</span>
                                <strong>
                                    {formatNumber(summary.usableBeds)}
                                </strong>
                            </div>

                            <div>
                                <span>Inactive Beds</span>
                                <strong>
                                    {formatNumber(summary.inactiveBeds)}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section className="reports-panel">
                        <div className="reports-section-heading">
                            <h3>
                                <CircleAlert
                                    size={19}
                                    aria-hidden="true"
                                />
                                Data Integrity
                            </h3>

                            <p>
                                Checks for inconsistencies among
                                Hostel, Room and Bed documents.
                            </p>
                        </div>

                        {hasIntegrityProblems ? (
                            <div
                                className="reports-message is-warning"
                                role="alert"
                            >
                                <ShieldAlert
                                    size={19}
                                    aria-hidden="true"
                                />

                                <span>
                                    Inventory inconsistencies were detected.
                                    Review the counts before creating
                                    additional beds or changing capacities.
                                </span>
                            </div>
                        ) : (
                            <p
                                className="reports-message is-success"
                                role="status"
                            >
                                No inventory inconsistencies detected
                                by the current checks.
                            </p>
                        )}

                        <div className="reports-detail-grid">
                            <div>
                                <span>Counter Mismatch Rooms</span>
                                <strong>
                                    {formatNumber(
                                        summary.counterMismatchRooms
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Over-capacity Rooms</span>
                                <strong>
                                    {formatNumber(
                                        summary.overCapacityRooms
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>Orphaned Rooms</span>
                                <strong>
                                    {formatNumber(summary.orphanRooms)}
                                </strong>
                            </div>

                            <div>
                                <span>Orphaned Beds</span>
                                <strong>
                                    {formatNumber(summary.orphanBeds)}
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section className="reports-panel reports-table-panel">
                        <div className="reports-section-heading">
                            <h3>Hostel-wise Inventory</h3>

                            <p>
                                Breakdown of rooms, physical beds and
                                unprovisioned capacity by hostel.
                            </p>
                        </div>

                        {report.hostels.length === 0 ? (
                            <div className="reports-empty">
                                <Building2
                                    size={30}
                                    aria-hidden="true"
                                />

                                <p>
                                    No hostels are registered yet.
                                </p>
                            </div>
                        ) : (
                            <div className="reports-table-scroll">
                                <table className="reports-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">Hostel</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Rooms</th>
                                            <th scope="col">Capacity</th>
                                            <th scope="col">Beds</th>
                                            <th scope="col">Maintenance Beds</th>
                                            <th scope="col">Unprovisioned</th>
                                            <th scope="col">Provisionable</th>
                                            <th scope="col">Counter Issues</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {report.hostels.map((hostel) => (
                                            <tr key={hostel.id}>
                                                <td>
                                                    <strong>{hostel.name}</strong>
                                                    <small>{hostel.code}</small>
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            hostel.isActive
                                                                ? "reports-status is-active"
                                                                : "reports-status is-inactive"
                                                        }
                                                    >
                                                        {hostel.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {formatNumber(hostel.totalRooms)}
                                                </td>

                                                <td>
                                                    {formatNumber(hostel.totalCapacity)}
                                                </td>

                                                <td>
                                                    {formatNumber(
                                                        hostel.provisionedBeds
                                                    )}
                                                </td>

                                                <td>
                                                    {formatNumber(
                                                        hostel.maintenanceBeds
                                                    )}
                                                </td>

                                                <td>
                                                    {formatNumber(
                                                        hostel.unprovisionedSlots
                                                    )}
                                                </td>

                                                <td>
                                                    {formatNumber(
                                                        hostel.provisionableSlots
                                                    )}
                                                </td>

                                                <td>
                                                    {formatNumber(
                                                        hostel.counterMismatchRooms
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="reports-explanation">
                        <h3>How to interpret these statistics</h3>

                        <p>
                            <strong>Provisioned beds</strong> are actual
                            Bed documents in MongoDB.
                            <strong> Unprovisioned slots</strong> are
                            remaining physical capacity, while
                            <strong> provisionable slots</strong> are
                            those in active rooms and hostels with
                            consistent counters.
                        </p>

                        <p>
                            These numbers do not indicate resident
                            occupancy or vacancy. We will calculate
                            those values after implementing student
                            allocations in Phase 5.
                        </p>
                    </section>
                </>
            )}
        </div>
    );
}

export default AdminInventoryReportPage;
