
import {
    NavLink,
    Outlet,
} from "react-router";

function PublicLayout() {
    return (
        <div className="app-shell">
            <header className="site-header">
                <div className="container nav-container">
                    <NavLink
                        to="/"
                        className="brand"
                        end
                    >
                        Smart Hostel
                    </NavLink>

                    <nav
                        className="nav-links"
                        aria-label="Main navigation"
                    >
                        <NavLink to="/" end>
                            Home
                        </NavLink>

                        <NavLink to="/login">
                            Login
                        </NavLink>

                        <NavLink
                            to="/register"
                            className="nav-button"
                        >
                            Register
                        </NavLink>
                    </nav>
                </div>
            </header>

            <main className="main-content">
                <Outlet />
            </main>

            <footer className="site-footer">
                <div className="container">
                    Smart Hostel Management System
                </div>
            </footer>
        </div>
    );
}

export default PublicLayout;
