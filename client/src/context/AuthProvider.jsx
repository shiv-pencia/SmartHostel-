
import {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";

import { AuthContext } from "./AuthContext.js";

import {
    loginUser,
    logoutUser,
    getCurrentUser,
} from "../features/auth/api/auth.api.js";

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);

    const [status, setStatus] = useState("loading");

    const [sessionError, setSessionError] = useState("");

    // Prevent older async requests from overwriting newer state
    const requestIdRef = useRef(0);

    /*
     * Restore session using HTTP-only cookie
     */
    const refreshSession = useCallback(async () => {
        const requestId = ++requestIdRef.current;

        setStatus("loading");
        setSessionError("");

        try {
            const currentUser = await getCurrentUser();

            if (requestId === requestIdRef.current) {
                setUser(currentUser);
                setStatus("authenticated");
            }

            return currentUser;
        } catch (error) {
            if (requestId === requestIdRef.current) {
                setUser(null);

                if (error.status === 401 || error.status === 403) {
                    setStatus("unauthenticated");
                } else {
                    setStatus("error");
                    setSessionError(
                        error.message || "Unable to check your session"
                    );
                }
            }

            return null;
        }
    }, []);

    /*
     * Check session when the application mounts
     */
    useEffect(() => {
        let isMounted = true;
        const requestId = ++requestIdRef.current;

        getCurrentUser()
            .then((currentUser) => {
                if (isMounted && requestId === requestIdRef.current) {
                    setUser(currentUser);
                    setStatus("authenticated");
                }
            })
            .catch((error) => {
                if (isMounted && requestId === requestIdRef.current) {
                    setUser(null);

                    if (error.status === 401 || error.status === 403) {
                        setStatus("unauthenticated");
                    } else {
                        setStatus("error");
                        setSessionError(
                            error.message || "Unable to check your session"
                        );
                    }
                }
            });

        return () => {
            isMounted = false;
            requestIdRef.current += 1;
        };
    }, []);

    /*
     * Login and update shared authentication state
     */
    const login = useCallback(async (credentials) => {
        const currentUser = await loginUser(credentials);

        requestIdRef.current += 1;

        setUser(currentUser);
        setStatus("authenticated");
        setSessionError("");

        return currentUser;
    }, []);

    /*
     * Logout and update shared authentication state
     */
    const logout = useCallback(async () => {
        await logoutUser();

        requestIdRef.current += 1;

        setUser(null);
        setStatus("unauthenticated");
        setSessionError("");
    }, []);

    const value = useMemo(
        () => ({
            user,
            status,
            sessionError,
            isAuthenticated: status === "authenticated",
            login,
            logout,
            refreshSession,
        }),
        [
            user,
            status,
            sessionError,
            login,
            logout,
            refreshSession,
        ]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
