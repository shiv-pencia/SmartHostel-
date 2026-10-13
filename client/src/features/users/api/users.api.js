
import httpClient from "../../../api/httpClient.js";

/*
 * GET /api/v1/users
 *
 * Supports pagination, searching and filtering.
 */
export const listUsers = async (query, signal) => {
    const response = await httpClient.get("/users", {
        params: query,
        signal,
    });

    return {
        users: response.data.data,
        pagination: response.data.meta,
    };
};

/*
 * GET /api/v1/users/:userId
 */
export const getUserById = async (userId, signal) => {
    const response = await httpClient.get(
        `/users/${encodeURIComponent(userId)}`,
        { signal }
    );

    return response.data.data.user;
};

/*
 * PATCH /api/v1/users/:userId
 */
export const updateUser = async (userId, data) => {
    const response = await httpClient.patch(
        `/users/${encodeURIComponent(userId)}`,
        data
    );

    return response.data.data.user;
};

/*
 * PATCH /api/v1/users/:userId/status
 */
export const updateUserStatus = async (
    userId,
    isActive
) => {
    const response = await httpClient.patch(
        `/users/${encodeURIComponent(userId)}/status`,
        { isActive }
    );

    return response.data.data.user;
};

/*
 * PATCH /api/v1/users/:userId/role
 */
export const updateUserRole = async (userId, role) => {
    const response = await httpClient.patch(
        `/users/${encodeURIComponent(userId)}/role`,
        { role }
    );

    return response.data.data.user;
};
