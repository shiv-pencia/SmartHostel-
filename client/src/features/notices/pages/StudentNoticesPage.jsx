import { useState, useEffect } from "react";
import { Bell, RefreshCw, UserCheck, ShieldAlert, Sparkles } from "lucide-react";
import { listNotices } from "../api/notices.api.js";
import "../styles/notices.css";

const categories = [
    { key: "all", label: "All Notices" },
    { key: "general", label: "General" },
    { key: "mess", label: "Mess & Dining" },
    { key: "maintenance", label: "Maintenance" },
    { key: "curfew", label: "Curfew & Rules" },
];

export default function StudentNoticesPage() {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        const fetchNotices = async () => {
            setLoading(true);
            setError("");

            try {
                const params = activeCategory !== "all" ? { category: activeCategory } : {};
                const data = await listNotices(params, controller.signal);
                setNotices(data);
            } catch (err) {
                if (err.name !== "CanceledError" && err.name !== "AbortError") {
                    setError(err.message || "Failed to load notices");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchNotices();

        return () => controller.abort();
    }, [activeCategory, reloadKey]);

    return (
        <div className="notices-page">
            <div className="notices-header">
                <div>
                    <p className="dashboard-section-label">Official Communications</p>
                    <h2>Hostel Notice Board</h2>
                    <p>Official announcements, dining schedules, and maintenance circulars.</p>
                </div>

                <button
                    type="button"
                    onClick={() => setReloadKey((p) => p + 1)}
                    className="btn-secondary"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={loading ? "spin" : ""} aria-hidden="true" />
                    Refresh
                </button>
            </div>

            {/* Category filter buttons */}
            <div className="notices-filter-bar" role="tablist" aria-label="Notice categories">
                {categories.map((cat) => (
                    <button
                        key={cat.key}
                        type="button"
                        className={`notices-filter-btn ${activeCategory === cat.key ? "is-active" : ""}`}
                        onClick={() => setActiveCategory(cat.key)}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="reports-message is-error" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {loading ? (
                <div className="reports-loading">
                    <p>Fetching official announcements...</p>
                </div>
            ) : notices.length === 0 ? (
                <div className="reports-empty">
                    <p>No notices currently published in this category.</p>
                </div>
            ) : (
                <div className="notices-grid">
                    {notices.map((notice) => (
                        <article
                            key={notice.id}
                            className={`notice-card ${notice.priority === "urgent" ? "urgent" : notice.priority === "important" ? "important" : ""}`}
                        >
                            <div className="notice-meta">
                                <span className={`notice-category ${notice.category}`}>
                                    {notice.category}
                                </span>
                                <span className="notice-date">
                                    {new Date(notice.createdAt).toLocaleDateString("en-IN", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </span>
                            </div>

                            <h3 className="notice-title">{notice.title}</h3>
                            <p className="notice-content">{notice.content}</p>

                            <div className="notice-footer">
                                <span className="notice-publisher">
                                    <UserCheck size={14} aria-hidden="true" />
                                    {notice.publishedBy?.name || "Hostel Administration"}
                                </span>
                                {notice.targetHostel && (
                                    <span>{notice.targetHostel.name}</span>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
