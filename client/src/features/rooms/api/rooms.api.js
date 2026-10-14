
import httpClient from "../../../api/httpClient.js";

/*
 * GET /api/v1/rooms
 * Supports pagination, search, and filters.
 */
export const listRooms = async (params = {}, signal) => {
    const response = await httpClient.get("/rooms", {
        params,
        signal,
    });

    return {
        rooms: response.data.data,
        pagination: response.data.meta,
    };
};

/*
 * GET /api/v1/rooms/:roomId
 */
export const getRoomById = async (roomId, signal) => {
    const response = await httpClient.get(
        `/rooms/${encodeURIComponent(roomId)}`,
        { signal }
    );

    return response.data.data.room;
};

/*
 * POST /api/v1/rooms
 */
export const createRoom = async (payload) => {
    const response = await httpClient.post(
        "/rooms",
        payload
    );

    return response.data.data.room;
};

/*
 * PATCH /api/v1/rooms/:roomId
 */
export const updateRoom = async (roomId, payload) => {
    const response = await httpClient.patch(
        `/rooms/${encodeURIComponent(roomId)}`,
        payload
    );

    return response.data.data.room;
};

/*
 * PATCH /api/v1/rooms/:roomId/status
 */
export const updateRoomStatus = async (
    roomId,
    status
) => {
    const response = await httpClient.patch(
        `/rooms/${encodeURIComponent(roomId)}/status`,
        { status }
    );

    return response.data.data.room;
};
