
import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router";

import { useAuth } from "../hooks/useAuth.js";
import SessionStatus from "../components/common/SessionStatus.jsx";

function ProtectedRoute() {
    const { status } = useAuth();
    const location = useLocation();

    // Wait until the backend session is checked
    if (status === "loading" || status === "error") {
        return <SessionStatus />;
    }

    // Redirect unauthenticated users to login
    if (status === "unauthenticated") {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from:
                        location.pathname +
                        location.search +
                        location.hash,
                }}
            />
        );
    }

    // User is authenticated
    return <Outlet />;
}

export default ProtectedRoute;
