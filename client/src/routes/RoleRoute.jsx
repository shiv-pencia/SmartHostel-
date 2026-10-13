
import { Navigate, Outlet } from "react-router";

import { useAuth } from "../hooks/useAuth.js";
import { getRoleHome } from "../utils/rolePaths.js";

function RoleRoute({ allowedRoles }) {
    const { user } = useAuth();

    // This component is used inside ProtectedRoute
    if (!user) {
        return null;
    }

    if (!allowedRoles.includes(user.role)) {
        return (
            <Navigate
                to={getRoleHome(user.role)}
                replace
            />
        );
    }

    return <Outlet />;
}

export default RoleRoute;
