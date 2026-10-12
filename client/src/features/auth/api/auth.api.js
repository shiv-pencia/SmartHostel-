
import httpClient from "../../../api/httpClient.js";

/*
 * Register a new student
 *
 * POST /api/v1/auth/register
 */

export const registerStudent = async (studentData) => {
    const response = await httpClient.post(
        "/auth/register",
        studentData
    );

    return response.data.data.user;
};

/*
 * Login an existing user
 *
 * POST /api/v1/auth/login
 */

export const loginUser = async (credentials) => {
    const response = await httpClient.post(
        "/auth/login",
        credentials
    );

    return response.data.data.user;
};

/*
 * Logout the current user
 *
 * POST /api/v1/auth/logout
 */

export const logoutUser = async () => {
    const response = await httpClient.post(
        "/auth/logout"
    );

    return response.data;
};

/*
 * Fetch the current authenticated user
 *
 * GET /api/v1/auth/me
 */

export const getCurrentUser = async () => {
    const response = await httpClient.get(
        "/auth/me"
    );

    return response.data.data.user;
};
