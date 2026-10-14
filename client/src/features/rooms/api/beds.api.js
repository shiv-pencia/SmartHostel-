
import httpClient from "../../../api/httpClient.js";

/*
 * GET /api/v1/rooms/:roomId/beds
 */
export const listBedsByRoom = async (roomId, signal) => {
    const response = await httpClient.get(
        `/rooms/${encodeURIComponent(roomId)}/beds`,
        { signal }
    );

    return response.data.data;
};

/*
 * POST /api/v1/rooms/:roomId/beds
 */
export const createBed = async (roomId, payload) => {
    const response = await httpClient.post(
        `/rooms/${encodeURIComponent(roomId)}/beds`,
        payload
    );

    return response.data.data.bed;
};

/*
 * GET /api/v1/beds/:bedId
 */
export const getBedById = async (bedId, signal) => {
    const response = await httpClient.get(
        `/beds/${encodeURIComponent(bedId)}`,
        { signal }
    );

    return response.data.data.bed;
};

/*
 * PATCH /api/v1/beds/:bedId
 */
export const updateBed = async (bedId, payload) => {
    const response = await httpClient.patch(
        `/beds/${encodeURIComponent(bedId)}`,
        payload
    );

    return response.data.data.bed;
};

/*
 * PATCH /api/v1/beds/:bedId/status
 */
export const updateBedStatus = async (
    bedId,
    operationalStatus
) => {
    const response = await httpClient.patch(
        `/beds/${encodeURIComponent(bedId)}/status`,
        { operationalStatus }
    );

    return response.data.data.bed;
};
