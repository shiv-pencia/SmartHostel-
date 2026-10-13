
import { Navigate, Outlet } from "react-router";

import { useAuth } from "../hooks/useAuth.js";
import { getRoleHome } from "../utils/rolePaths.js";

import SessionStatus from "../components/common/SessionStatus.jsx";

function GuestRoute() {
    const { user, status } = useAuth();

    if (status === "loading" || status === "error") {
        return <SessionStatus />;
    }

    if (status === "authenticated") {
        return (
            <Navigate
                to={getRoleHome(user.role)}
                replace
            />
        );
    }

    return <Outlet />;
}

export default GuestRoute;
