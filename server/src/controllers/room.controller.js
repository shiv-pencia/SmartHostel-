
import * as roomService from "../services/room.service.js";

import {
    listRoomsQuerySchema,
} from "../validators/room.validator.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";

/*
 * CREATE ROOM
 */
export const createRoom = asyncHandler(async (req, res) => {
    const room = await roomService.createRoom(req.body);

    return sendSuccess(res, {
        statusCode: 201,
        message: "Room created successfully",
        data: { room },
    });
});

/*
 * LIST ROOMS
 */
export const listRooms = asyncHandler(async (req, res) => {
    const result = listRoomsQuerySchema.safeParse(
        req.query
    );

    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field: issue.path.join(".") || "query",
            message: issue.message,
        }));

        throw new ApiError(
            400,
            "Invalid query parameters",
            errors
        );
    }

    const data = await roomService.listRooms(
        result.data
    );

    return sendSuccess(res, {
        message: "Rooms retrieved successfully",
        data: data.rooms,
        meta: data.pagination,
    });
});

/*
 * GET ROOM BY ID
 */
export const getRoomById = asyncHandler(
    async (req, res) => {
        const room = await roomService.getRoomById(
            req.params.roomId
        );

        return sendSuccess(res, {
            message: "Room retrieved successfully",
            data: { room },
        });
    }
);

/*
 * UPDATE ROOM
 */
export const updateRoom = asyncHandler(
    async (req, res) => {
        const room = await roomService.updateRoom(
            req.params.roomId,
            req.body
        );

        return sendSuccess(res, {
            message: "Room updated successfully",
            data: { room },
        });
    }
);

/*
 * UPDATE ROOM STATUS
 */
export const updateRoomStatus = asyncHandler(
    async (req, res) => {
        const room = await roomService.updateRoomStatus(
            req.params.roomId,
            req.body.status
        );

        return sendSuccess(res, {
            message: "Room status updated successfully",
            data: { room },
        });
    }
);
