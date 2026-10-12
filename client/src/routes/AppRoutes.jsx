
import {
    Routes,
    Route,
} from "react-router";

import PublicLayout from "../layouts/PublicLayout.jsx";

import HomePage from "../pages/HomePage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

import LoginPage from "../features/auth/pages/LoginPage.jsx";
import RegisterPage from "../features/auth/pages/RegisterPage.jsx";

function AppRoutes() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route
                    index
                    element={<HomePage />}
                />

                <Route
                    path="login"
                    element={<LoginPage />}
                />

                <Route
                    path="register"
                    element={<RegisterPage />}
                />

                <Route
                    path="*"
                    element={<NotFoundPage />}
                />
            </Route>
        </Routes>
    );
}

export default AppRoutes;
