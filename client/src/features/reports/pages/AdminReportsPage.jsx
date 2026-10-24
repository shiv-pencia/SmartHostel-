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
    MessageSquareWarning,
    CheckCircle2,
    Clock,
    Flame,
    Filter,
} from "lucide-react";

import {
    getInventoryReport,
    getOccupancyReport,
    getComplaintAnalytics,
} from "../api/reports.api.js";

import "../styles/reports.css";

const numberFormat = new Intl.NumberFormat("en-IN");
const formatNumber = (value) => numberFormat.format(value ?? 0);

function SummaryCard({ label, value, icon: Icon, colorClass = "" }) {
    return (
        <article className="reports-stat-card">
            <div className="reports-stat-heading">
                <span>{label}</span>
                <span className={`reports-stat-icon ${colorClass}`}>
                    <Icon size={20} aria-hidden="true" />
                </span>
            </div>
            <strong>{value}</strong>
        </article>
    );
}

function ProgressBar({ percentage, color = "primary" }) {
    const safePercent = Math.min(100, Math.max(0, percentage || 0));
    return (
        <div className="reports-progress-wrap">
            <div className="reports-progress-bar">
                <div
                    className={`reports-progress-fill ${color}`}
                    style={{ width: `${safePercent}%` }}
                />
            </div>
            <span className="reports-progress-text">{safePercent}%</span>
        </div>
    );
}

export default function AdminReportsPage() {
    const [activeTab, setActiveTab] = useState("occupancy"); // "occupancy" | "complaints" | "inventory"
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    // Occupancy state
    const [occupancyData, setOccupancyData] = useState(null);
    const [selectedHostel, setSelectedHostel] = useState("");

    // Complaints state
    const [complaintData, setComplaintData] = useState(null);

    // Inventory state
    const [inventoryData, setInventoryData] = useState(null);

    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        const loadReports = async () => {
            setLoading(true);
            setError("");

            try {
                if (activeTab === "occupancy") {
                    const data = await getOccupancyReport(
                        selectedHostel ? { hostelId: selectedHostel } : {},
                        controller.signal
                    );
                    setOccupancyData(data);
                    setLastUpdated(data.generatedAt);
                } else if (activeTab === "complaints") {
                    const data = await getComplaintAnalytics(
                        selectedHostel ? { hostelId: selectedHostel } : {},
                        controller.signal
                    );
                    setComplaintData(data);
                    setLastUpdated(data.generatedAt);
                } else if (activeTab === "inventory") {
                    const data = await getInventoryReport(controller.signal);
                    setInventoryData(data);
                    setLastUpdated(data.generatedAt);
                }
            } catch (err) {
                if (err.name !== "CanceledError" && err.name !== "AbortError") {
                    setError(err.message || "Failed to load report data");
                }
            } finally {
                setLoading(false);
            }
        };

        loadReports();

        return () => controller.abort();
    }, [activeTab, selectedHostel, reloadKey]);

    const handleRefresh = () => {
        setReloadKey((prev) => prev + 1);
    };

    return (
        <div className="reports-page">
            {/* Header */}
            <div className="reports-page-heading">
                <div>
                    <p className="dashboard-section-label">Operations Intelligence</p>
                    <h2>Hostel Reports & Analytics</h2>
                    <p>
                        Real-time occupancy tracking, student grievance resolution telemetry,
                        and physical room inventory audits.
                    </p>
                </div>

                <div className="reports-refresh">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "spin" : ""}
                            aria-hidden="true"
                        />
                        Refresh Telemetry
                    </button>
                </div>
            </div>

            {lastUpdated && (
                <p className="reports-generated">
                    Last updated: {new Date(lastUpdated).toLocaleString("en-IN")}
                </p>
            )}

            {/* Tab navigation */}
            <nav className="reports-tab-nav" aria-label="Report Views">
                <button
                    type="button"
                    className={`reports-tab-btn ${activeTab === "occupancy" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("occupancy")}
                >
                    <BedDouble size={18} aria-hidden="true" />
                    Occupancy Statistics
                </button>

                <button
                    type="button"
                    className={`reports-tab-btn ${activeTab === "complaints" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("complaints")}
                >
                    <MessageSquareWarning size={18} aria-hidden="true" />
                    Complaint Analytics
                </button>

                <button
                    type="button"
                    className={`reports-tab-btn ${activeTab === "inventory" ? "is-active" : ""}`}
                    onClick={() => setActiveTab("inventory")}
                >
                    <Layers size={18} aria-hidden="true" />
                    Inventory & Integrity
                </button>
            </nav>

            {error && (
                <div className="reports-message is-error" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {/* TAB 1: OCCUPANCY STATISTICS */}
            {activeTab === "occupancy" && (
                <>
                    {loading && !occupancyData ? (
                        <div className="reports-loading">
                            <p>Calculating live occupancy telemetry...</p>
                        </div>
                    ) : occupancyData ? (
                        <>
                            {/* Filter Bar */}
                            <div className="reports-filter-bar">
                                <div className="reports-filter-group">
                                    <Filter size={16} className="text-muted" aria-hidden="true" />
                                    <label htmlFor="hostel-filter" className="reports-filter-label">
                                        Filter by Hostel:
                                    </label>
                                    <select
                                        id="hostel-filter"
                                        className="reports-select"
                                        value={selectedHostel}
                                        onChange={(e) => setSelectedHostel(e.target.value)}
                                    >
                                        <option value="">All Hostels</option>
                                        {occupancyData.hostels.map((h) => (
                                            <option key={h.hostelId} value={h.hostelId}>
                                                {h.name} ({h.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <span className="text-muted" style={{ fontSize: "13px" }}>
                                    Showing {occupancyData.hostels.length} hostel(s)
                                </span>
                            </div>

                            {/* Summary KPI Cards */}
                            <section className="reports-stats-grid cols-6" aria-label="Occupancy KPIs">
                                <SummaryCard
                                    label="Total Capacity"
                                    value={formatNumber(occupancyData.summary.totalCapacity)}
                                    icon={DoorOpen}
                                />
                                <SummaryCard
                                    label="Usable Beds"
                                    value={formatNumber(occupancyData.summary.usableBeds)}
                                    icon={BedDouble}
                                    colorClass="emerald"
                                />
                                <SummaryCard
                                    label="Occupied Beds"
                                    value={formatNumber(occupancyData.summary.occupiedBeds)}
                                    icon={Building2}
                                />
                                <SummaryCard
                                    label="Vacant Beds"
                                    value={formatNumber(occupancyData.summary.vacantBeds)}
                                    icon={Layers}
                                    colorClass="amber"
                                />
                                <SummaryCard
                                    label="Maintenance Beds"
                                    value={formatNumber(occupancyData.summary.maintenanceBeds)}
                                    icon={Wrench}
                                    colorClass="rose"
                                />
                                <SummaryCard
                                    label="Occupancy Rate"
                                    value={`${occupancyData.summary.occupancyRate}%`}
                                    icon={CheckCircle2}
                                    colorClass={occupancyData.summary.occupancyRate > 90 ? "rose" : "emerald"}
                                />
                            </section>

                            {/* Room Type Distribution */}
                            <section className="reports-panel" aria-label="Room Type Occupancy">
                                <div className="reports-section-heading">
                                    <h3>
                                        <BedDouble size={20} aria-hidden="true" />
                                        Room Category Breakdown
                                    </h3>
                                    <p>Capacity and allocation rates grouped by room format.</p>
                                </div>

                                <div className="reports-roomtype-grid">
                                    {occupancyData.roomTypes.map((rt) => (
                                        <div key={rt.key} className="reports-roomtype-card">
                                            <div className="reports-roomtype-heading">
                                                <strong>{rt.label}</strong>
                                                <span className="text-muted" style={{ fontSize: "12px" }}>
                                                    {rt.totalRooms} rooms
                                                </span>
                                            </div>

                                            <ProgressBar
                                                percentage={rt.occupancyRate}
                                                color={rt.occupancyRate > 85 ? "amber" : "emerald"}
                                            />

                                            <div className="reports-roomtype-metrics">
                                                <div>
                                                    <span>Usable</span>
                                                    <strong>{rt.usableBeds}</strong>
                                                </div>
                                                <div>
                                                    <span>Occupied</span>
                                                    <strong>{rt.occupiedBeds}</strong>
                                                </div>
                                                <div>
                                                    <span>Vacant</span>
                                                    <strong>{rt.vacantBeds}</strong>
                                                </div>
                                                <div>
                                                    <span>Rate</span>
                                                    <strong>{rt.occupancyRate}%</strong>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Hostel Breakdown Table */}
                            <section className="reports-panel reports-table-panel" aria-label="Hostel-wise Breakdown">
                                <div className="reports-section-heading">
                                    <h3>
                                        <Building2 size={20} aria-hidden="true" />
                                        Hostel-wise Occupancy & Vacancy Breakdown
                                    </h3>
                                    <p>Comprehensive telemetry on capacity, occupancy, and available vacancies per building.</p>
                                </div>

                                <div className="reports-table-scroll">
                                    <table className="reports-table">
                                        <thead>
                                            <tr>
                                                <th>Hostel</th>
                                                <th>Status</th>
                                                <th>Rooms</th>
                                                <th>Capacity</th>
                                                <th>Usable Beds</th>
                                                <th>Occupied</th>
                                                <th>Vacant</th>
                                                <th>Under Maintenance</th>
                                                <th>Occupancy Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {occupancyData.hostels.map((hostel) => (
                                                <tr key={hostel.hostelId}>
                                                    <td>
                                                        <strong>{hostel.name}</strong>
                                                        <small>{hostel.code} • {hostel.location}</small>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`reports-status ${
                                                                hostel.isActive ? "is-active" : "is-inactive"
                                                            }`}
                                                        >
                                                            {hostel.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td>{formatNumber(hostel.totalRooms)}</td>
                                                    <td>{formatNumber(hostel.totalCapacity)}</td>
                                                    <td>
                                                        <strong>{formatNumber(hostel.usableBeds)}</strong>
                                                    </td>
                                                    <td>
                                                        <strong style={{ color: "#2563eb" }}>
                                                            {formatNumber(hostel.occupiedBeds)}
                                                        </strong>
                                                    </td>
                                                    <td>
                                                        <strong style={{ color: "#059669" }}>
                                                            {formatNumber(hostel.vacantBeds)}
                                                        </strong>
                                                    </td>
                                                    <td>{formatNumber(hostel.maintenanceBeds)}</td>
                                                    <td>
                                                        <ProgressBar
                                                            percentage={hostel.occupancyRate}
                                                            color={
                                                                hostel.occupancyRate > 90
                                                                    ? "rose"
                                                                    : hostel.occupancyRate > 75
                                                                    ? "amber"
                                                                    : "emerald"
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    ) : null}
                </>
            )}

            {/* TAB 2: COMPLAINT ANALYTICS */}
            {activeTab === "complaints" && (
                <>
                    {loading && !complaintData ? (
                        <div className="reports-loading">
                            <p>Compiling complaint analytics and resolution metrics...</p>
                        </div>
                    ) : complaintData ? (
                        <>
                            {/* Summary KPI Cards */}
                            <section className="reports-stats-grid cols-6" aria-label="Complaint KPIs">
                                <SummaryCard
                                    label="Total Grievances"
                                    value={formatNumber(complaintData.summary.totalComplaints)}
                                    icon={MessageSquareWarning}
                                />
                                <SummaryCard
                                    label="Action Required"
                                    value={formatNumber(complaintData.summary.openComplaints)}
                                    icon={Clock}
                                    colorClass="amber"
                                />
                                <SummaryCard
                                    label="Resolved"
                                    value={formatNumber(complaintData.summary.resolvedComplaints)}
                                    icon={CheckCircle2}
                                    colorClass="emerald"
                                />
                                <SummaryCard
                                    label="Urgent Priority"
                                    value={formatNumber(complaintData.summary.urgentComplaints)}
                                    icon={Flame}
                                    colorClass="rose"
                                />
                                <SummaryCard
                                    label="Resolution Rate"
                                    value={`${complaintData.summary.resolutionRate}%`}
                                    icon={CheckCircle2}
                                    colorClass="emerald"
                                />
                                <SummaryCard
                                    label="Avg Turnaround"
                                    value={`${complaintData.summary.avgResolutionHours} hrs`}
                                    icon={Clock}
                                    colorClass="purple"
                                />
                            </section>

                            {/* Category Distribution Grid */}
                            <section className="reports-panel" aria-label="Grievance Categories">
                                <div className="reports-section-heading">
                                    <h3>
                                        <Layers size={20} aria-hidden="true" />
                                        Grievance Category Distribution
                                    </h3>
                                    <p>Volume of logged issues categorized by maintenance trade.</p>
                                </div>

                                <div className="reports-category-grid">
                                    {complaintData.categoryBreakdown.map((cat) => (
                                        <div key={cat.category} className="reports-category-card">
                                            <div className="reports-category-header">
                                                <span className="reports-category-name">{cat.category}</span>
                                                <span className="reports-category-count">
                                                    {cat.count} issues ({cat.percentage}%)
                                                </span>
                                            </div>
                                            <ProgressBar percentage={cat.percentage} color="primary" />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Priority & Status Distribution Panels */}
                            <div className="reports-detail-grid">
                                {complaintData.priorityBreakdown.map((p) => (
                                    <div key={p.priority}>
                                        <span style={{ textTransform: "capitalize" }}>
                                            {p.priority} Priority
                                        </span>
                                        <strong>{p.count}</strong>
                                        <small className="text-muted">{p.percentage}% of grievances</small>
                                    </div>
                                ))}
                            </div>

                            {/* Hostel Breakdown Table */}
                            {complaintData.hostelBreakdown.length > 0 && (
                                <section className="reports-panel reports-table-panel" aria-label="Hostel Grievances">
                                    <div className="reports-section-heading">
                                        <h3>
                                            <Building2 size={20} aria-hidden="true" />
                                            Hostel Grievance Turnaround
                                        </h3>
                                        <p>Issue volume and resolution percentage per hostel.</p>
                                    </div>

                                    <div className="reports-table-scroll">
                                        <table className="reports-table">
                                            <thead>
                                                <tr>
                                                    <th>Hostel</th>
                                                    <th>Total Complaints</th>
                                                    <th>Open / In Progress</th>
                                                    <th>Resolved</th>
                                                    <th>Resolution Rate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {complaintData.hostelBreakdown.map((h) => (
                                                    <tr key={h.hostelId}>
                                                        <td>
                                                            <strong>{h.hostelName}</strong>
                                                        </td>
                                                        <td>{formatNumber(h.total)}</td>
                                                        <td>
                                                            <strong style={{ color: "#d97706" }}>
                                                                {formatNumber(h.open)}
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            <strong style={{ color: "#059669" }}>
                                                                {formatNumber(h.resolved)}
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            <ProgressBar
                                                                percentage={h.resolutionRate}
                                                                color="emerald"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}
                        </>
                    ) : null}
                </>
            )}

            {/* TAB 3: INVENTORY & INTEGRITY */}
            {activeTab === "inventory" && (
                <>
                    {loading && !inventoryData ? (
                        <div className="reports-loading">
                            <p>Loading physical inventory audits...</p>
                        </div>
                    ) : inventoryData ? (
                        <>
                            {/* Inventory Summary Cards */}
                            <section className="reports-stats-grid" aria-label="Inventory Totals">
                                <SummaryCard
                                    label="Total Hostels"
                                    value={formatNumber(inventoryData.summary.totalHostels)}
                                    icon={Building2}
                                />
                                <SummaryCard
                                    label="Total Rooms"
                                    value={formatNumber(inventoryData.summary.totalRooms)}
                                    icon={DoorOpen}
                                />
                                <SummaryCard
                                    label="Room Capacity"
                                    value={formatNumber(inventoryData.summary.totalCapacity)}
                                    icon={Layers}
                                />
                                <SummaryCard
                                    label="Provisioned Beds"
                                    value={formatNumber(inventoryData.summary.provisionedBeds)}
                                    icon={BedDouble}
                                    colorClass="emerald"
                                />
                                <SummaryCard
                                    label="Unprovisioned Slots"
                                    value={formatNumber(inventoryData.summary.unprovisionedSlots)}
                                    icon={Layers}
                                />
                                <SummaryCard
                                    label="Provisionable Slots"
                                    value={formatNumber(inventoryData.summary.provisionableSlots)}
                                    icon={BedDouble}
                                    colorClass="amber"
                                />
                                <SummaryCard
                                    label="Maintenance Beds"
                                    value={formatNumber(inventoryData.summary.maintenanceBeds)}
                                    icon={Wrench}
                                    colorClass="rose"
                                />
                            </section>

                            {/* Integrity Audit Warnings */}
                            {(inventoryData.summary.counterMismatchRooms > 0 ||
                                inventoryData.summary.overCapacityRooms > 0 ||
                                inventoryData.summary.orphanRooms > 0 ||
                                inventoryData.summary.orphanBeds > 0) ? (
                                <div className="reports-message is-warning" role="alert">
                                    <ShieldAlert size={20} aria-hidden="true" />
                                    <div>
                                        <p>
                                            <strong>Integrity Alerts Detected:</strong> One or more rooms or beds have
                                            counter discrepancies or missing references requiring administrator attention.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="reports-message is-success">
                                    <p>
                                        <strong>Audit Clean:</strong> All room bed counters match physical bed documents and
                                        no orphaned records were detected.
                                    </p>
                                </div>
                            )}

                            {/* Inventory Table */}
                            <section className="reports-panel reports-table-panel" aria-label="Physical Inventory Breakdown">
                                <div className="reports-section-heading">
                                    <h3>
                                        <Layers size={20} aria-hidden="true" />
                                        Physical Bed Inventory & Capacity Verification
                                    </h3>
                                    <p>Detailed verification of room capacity vs physical bed document counters.</p>
                                </div>

                                <div className="reports-table-scroll">
                                    <table className="reports-table">
                                        <thead>
                                            <tr>
                                                <th>Hostel</th>
                                                <th>Status</th>
                                                <th>Rooms</th>
                                                <th>Capacity</th>
                                                <th>Provisioned Beds</th>
                                                <th>Usable</th>
                                                <th>Maintenance</th>
                                                <th>Unprovisioned</th>
                                                <th>Provisionable</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventoryData.hostels.map((hostel) => (
                                                <tr key={hostel.id}>
                                                    <td>
                                                        <strong>{hostel.name}</strong>
                                                        <small>{hostel.code}</small>
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`reports-status ${
                                                                hostel.isActive ? "is-active" : "is-inactive"
                                                            }`}
                                                        >
                                                            {hostel.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                    </td>
                                                    <td>{formatNumber(hostel.totalRooms)}</td>
                                                    <td>{formatNumber(hostel.totalCapacity)}</td>
                                                    <td>{formatNumber(hostel.provisionedBeds)}</td>
                                                    <td>
                                                        <strong>{formatNumber(hostel.usableBeds)}</strong>
                                                    </td>
                                                    <td>{formatNumber(hostel.maintenanceBeds)}</td>
                                                    <td>{formatNumber(hostel.unprovisionedSlots)}</td>
                                                    <td>
                                                        <strong style={{ color: "#059669" }}>
                                                            {formatNumber(hostel.provisionableSlots)}
                                                        </strong>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </>
                    ) : null}
                </>
            )}
        </div>
    );
}
