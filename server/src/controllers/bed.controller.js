
import * as bedService from "../services/bed.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

/*
 * CREATE BED IN ROOM
 */
export const createBed = asyncHandler(
    async (req, res) => {
        const bed = await bedService.createBed(
            req.params.roomId,
            req.body
        );

        return sendSuccess(res, {
            statusCode: 201,
            message: "Bed created successfully",
            data: { bed },
        });
    }
);

/*
 * LIST BEDS IN ROOM
 */
export const listBedsByRoom = asyncHandler(
    async (req, res) => {
        const result = await bedService.listBedsByRoom(
            req.params.roomId
        );

        return sendSuccess(res, {
            message: "Beds retrieved successfully",
            data: result,
        });
    }
);

/*
 * GET BED BY ID
 */
export const getBedById = asyncHandler(
    async (req, res) => {
        const bed = await bedService.getBedById(
            req.params.bedId
        );

        return sendSuccess(res, {
            message: "Bed retrieved successfully",
            data: { bed },
        });
    }
);

/*
 * UPDATE BED NUMBER
 */
export const updateBed = asyncHandler(
    async (req, res) => {
        const bed = await bedService.updateBed(
            req.params.bedId,
            req.body
        );

        return sendSuccess(res, {
            message: "Bed updated successfully",
            data: { bed },
        });
    }
);

/*
 * UPDATE BED STATUS
 */
export const updateBedStatus = asyncHandler(
    async (req, res) => {
        const bed = await bedService.updateBedStatus(
            req.params.bedId,
            req.body.operationalStatus
        );

        return sendSuccess(res, {
            message: "Bed status updated successfully",
            data: { bed },
        });
    }
);
