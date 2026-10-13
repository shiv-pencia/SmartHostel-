
import { Eye, Users } from "lucide-react";

const roleLabels = {
    student: "Student",
    warden: "Warden",
    staff: "Staff",
    admin: "Administrator",
};

function UserTable({ users, onViewUser }) {
    if (users.length === 0) {
        return (
            <div className="users-empty-state">
                <Users size={30} aria-hidden="true" />

                <h3>No users found</h3>

                <p>
                    Try changing the search term or filters.
                </p>
            </div>
        );
    }

    return (
        <div className="users-table-scroll">
            <table className="users-table">
                <thead>
                    <tr>
                        <th scope="col">User</th>
                        <th scope="col">Role</th>
                        <th scope="col">Status</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Action</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>
                                <div className="users-person">
                                    <span
                                        className="users-avatar"
                                        aria-hidden="true"
                                    >
                                        {user.name?.charAt(0).toUpperCase()}
                                    </span>

                                    <span className="users-person-info">
                                        <strong>{user.name}</strong>
                                        <small>{user.email}</small>
                                    </span>
                                </div>
                            </td>

                            <td>
                                <span className="users-role">
                                    {roleLabels[user.role] ?? user.role}
                                </span>
                            </td>

                            <td>
                                <span
                                    className={
                                        user.isActive
                                            ? "users-status is-active"
                                            : "users-status is-inactive"
                                    }
                                >
                                    {user.isActive ? "Active" : "Inactive"}
                                </span>
                            </td>

                            <td>{user.phone || "—"}</td>

                            <td>
                                <button
                                    type="button"
                                    className="users-action-button"
                                    onClick={() => onViewUser(user.id)}
                                    aria-label={`View ${user.name}`}
                                >
                                    <Eye size={17} aria-hidden="true" />
                                    View / Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default UserTable;
