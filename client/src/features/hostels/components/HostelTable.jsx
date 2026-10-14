
import {
    Pencil,
    Power,
    Building2,
} from "lucide-react";

const genderLabels = {
    male: "Male",
    female: "Female",
    coed: "Co-ed",
};

function HostelTable({
    hostels,
    wardens,
    onEdit,
    onRequestStatusChange,
    disabled = false,
}) {
    const getWardenName = (wardenId) => {
        if (!wardenId) {
            return "Not assigned";
        }

        const warden = wardens.find(
            (user) => user.id === wardenId
        );

        return warden?.name ?? "Assigned warden";
    };

    if (hostels.length === 0) {
        return (
            <div className="hostels-empty">
                <Building2 size={34} aria-hidden="true" />

                <h3>No hostels found</h3>

                <p>
                    Create your first hostel or change
                    the current search filters.
                </p>
            </div>
        );
    }

    return (
        <div className="hostels-table-scroll">
            <table className="hostels-table">
                <thead>
                    <tr>
                        <th scope="col">Hostel</th>
                        <th scope="col">Location</th>
                        <th scope="col">Gender policy</th>
                        <th scope="col">Warden</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {hostels.map((hostel) => (
                        <tr key={hostel.id}>
                            <td>
                                <div className="hostels-name-cell">
                                    <span className="hostels-building-icon">
                                        <Building2
                                            size={19}
                                            aria-hidden="true"
                                        />
                                    </span>

                                    <span>
                                        <strong>{hostel.name}</strong>
                                        <small>Code: {hostel.code}</small>
                                    </span>
                                </div>
                            </td>

                            <td>{hostel.location}</td>

                            <td>
                                {genderLabels[hostel.genderPolicy] ??
                                    hostel.genderPolicy}
                            </td>

                            <td>{getWardenName(hostel.warden)}</td>

                            <td>
                                <span
                                    className={
                                        hostel.isActive
                                            ? "hostels-status is-active"
                                            : "hostels-status is-inactive"
                                    }
                                >
                                    {hostel.isActive
                                        ? "Active"
                                        : "Inactive"}
                                </span>
                            </td>

                            <td>
                                <div className="hostels-row-actions">
                                    <button
                                        type="button"
                                        onClick={() => onEdit(hostel)}
                                        disabled={disabled}
                                        aria-label={`Edit ${hostel.name}`}
                                    >
                                        <Pencil
                                            size={16}
                                            aria-hidden="true"
                                        />
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            onRequestStatusChange(hostel)
                                        }
                                        disabled={disabled}
                                        aria-label={
                                            `${hostel.isActive
                                                ? "Deactivate"
                                                : "Activate"} ${hostel.name}`
                                        }
                                    >
                                        <Power
                                            size={16}
                                            aria-hidden="true"
                                        />

                                        {hostel.isActive
                                            ? "Deactivate"
                                            : "Activate"}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default HostelTable;
