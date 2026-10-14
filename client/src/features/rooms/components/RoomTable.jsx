
import {
    BedDouble,
    Pencil,
    Settings2,
    Layers3,
} from "lucide-react";

const statusLabels = {
    active: "Active",
    maintenance: "Maintenance",
    inactive: "Inactive",
};

const roomTypeLabels = {
    standard: "Standard",
    accessible: "Accessible",
};

function RoomTable({
    rooms,
    hostels,
    onEdit,
    onManageBeds,
    onChangeStatus,
}) {
    const hostelNames = new Map(
        hostels.map((hostel) => [
            hostel.id,
            hostel.name,
        ])
    );

    if (rooms.length === 0) {
        return (
            <div className="rooms-empty">
                <BedDouble size={34} aria-hidden="true" />
                <h3>No rooms found</h3>
                <p>
                    Create a room or try different search filters.
                </p>
            </div>
        );
    }

    return (
        <div className="rooms-table-scroll">
            <table className="rooms-table">
                <thead>
                    <tr>
                        <th scope="col">Room</th>
                        <th scope="col">Hostel</th>
                        <th scope="col">Floor</th>
                        <th scope="col">Type</th>
                        <th scope="col">Beds / Capacity</th>
                        <th scope="col">Status</th>
                        <th scope="col">Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {rooms.map((room) => {
                        const unprovisioned =
                            room.capacity - room.bedCount;

                        return (
                            <tr key={room.id}>
                                <td>
                                    <div className="rooms-name">
                                        <span className="rooms-name-icon">
                                            <BedDouble
                                                size={18}
                                                aria-hidden="true"
                                            />
                                        </span>

                                        <strong>
                                            Room {room.roomNumber}
                                        </strong>
                                    </div>
                                </td>

                                <td>
                                    {hostelNames.get(room.hostel) ??
                                        "Unknown hostel"}
                                </td>

                                <td>{room.floor}</td>

                                <td>
                                    {roomTypeLabels[room.roomType] ??
                                        room.roomType}
                                </td>

                                <td>
                                    <strong>
                                        {room.bedCount} / {room.capacity}
                                    </strong>

                                    <small className="rooms-muted">
                                        {unprovisioned} unprovisioned
                                    </small>
                                </td>

                                <td>
                                    <span
                                        className={`rooms-status is-${room.status}`}
                                    >
                                        {statusLabels[room.status] ??
                                            room.status}
                                    </span>
                                </td>

                                <td>
                                    <div className="rooms-actions">
                                        <button
                                            type="button"
                                            onClick={() => onManageBeds(room)}
                                            aria-label={
                                                `Manage beds in Room ${room.roomNumber}`
                                            }
                                        >
                                            <Layers3
                                                size={16}
                                                aria-hidden="true"
                                            />
                                            Beds
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onEdit(room)}
                                            aria-label={
                                                `Edit Room ${room.roomNumber}`
                                            }
                                        >
                                            <Pencil
                                                size={16}
                                                aria-hidden="true"
                                            />
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onChangeStatus(room)}
                                            aria-label={
                                                `Change status of Room ${room.roomNumber}`
                                            }
                                        >
                                            <Settings2
                                                size={16}
                                                aria-hidden="true"
                                            />
                                            Status
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default RoomTable;
