
function DashboardCard({
    title,
    value,
    description,
    icon: Icon,
}) {
    return (
        <article className="dashboard-card">
            <div className="dashboard-card-heading">
                <span className="dashboard-card-title">
                    {title}
                </span>

                {Icon && (
                    <span className="dashboard-card-icon">
                        <Icon size={20} aria-hidden="true" />
                    </span>
                )}
            </div>

            <p className="dashboard-card-value">
                {value}
            </p>

            {description && (
                <p className="dashboard-card-description">
                    {description}
                </p>
            )}
        </article>
    );
}

export default DashboardCard;
