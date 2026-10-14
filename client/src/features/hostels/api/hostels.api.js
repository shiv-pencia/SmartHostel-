
import httpClient from "../../../api/httpClient.js";

/*
 * GET /api/v1/hostels
 *
 * Search, filter and paginate hostels.
 */
export const listHostels = async (params = {}, signal) => {
    const response = await httpClient.get("/hostels", {
        params,
        signal,
    });

    return {
        hostels: response.data.data,
        pagination: response.data.meta,
    };
};

/*
 * GET /api/v1/hostels/:hostelId
 */
export const getHostelById = async (hostelId) => {
    const response = await httpClient.get(
        `/hostels/${encodeURIComponent(hostelId)}`
    );

    return response.data.data.hostel;
};

/*
 * POST /api/v1/hostels
 */
export const createHostel = async (payload) => {
    const response = await httpClient.post(
        "/hostels",
        payload
    );

    return response.data.data.hostel;
};

/*
 * PATCH /api/v1/hostels/:hostelId
 */
export const updateHostel = async (
    hostelId,
    payload
) => {
    const response = await httpClient.patch(
        `/hostels/${encodeURIComponent(hostelId)}`,
        payload
    );

    return response.data.data.hostel;
};

/*
 * PATCH /api/v1/hostels/:hostelId/status
 */
export const updateHostelStatus = async (
    hostelId,
    isActive
) => {
    const response = await httpClient.patch(
        `/hostels/${encodeURIComponent(hostelId)}/status`,
        { isActive }
    );

    return response.data.data.hostel;
};

/*
 * Load eligible wardens from User Management.
 *
 * GET /api/v1/users?role=warden&status=active
 *
 * Fetch successive pages because the users API
 * returns paginated results.
 */
export const listActiveWardens = async (signal) => {
    const wardens = [];
    let page = 1;
    let totalPages;

    do {
        const response = await httpClient.get("/users", {
            params: {
                role: "warden",
                status: "active",
                page,
                limit: 100,
            },
            signal,
        });

        const batch = response.data.data;
        const meta = response.data.meta;

        wardens.push(...batch);

        totalPages = meta.totalPages;
        page += 1;
    } while (page <= totalPages);

    return wardens;
};
