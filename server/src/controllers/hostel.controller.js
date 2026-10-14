
import * as hostelService from "../services/hostel.service.js";

import {
    listHostelsQuerySchema,
} from "../validators/hostel.validator.js";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";

/*
 * CREATE HOSTEL
 *
 * POST /api/v1/hostels
 */

export const createHostel = asyncHandler(
    async (req, res) => {
        const hostel = await hostelService.createHostel(
            req.body
        );

        return sendSuccess(res, {
            statusCode: 201,
            message: "Hostel created successfully",
            data: { hostel },
        });
    }
);

/*
 * LIST HOSTELS
 *
 * GET /api/v1/hostels
 */

export const listHostels = asyncHandler(
    async (req, res) => {
        const parsed =
            listHostelsQuerySchema.safeParse(req.query);

        if (!parsed.success) {
            const errors = parsed.error.issues.map(
                (issue) => ({
                    field: issue.path.join(".") || "query",
                    message: issue.message,
                })
            );

            throw new ApiError(
                400,
                "Invalid query parameters",
                errors
            );
        }

        const result = await hostelService.listHostels(
            parsed.data
        );

        return sendSuccess(res, {
            message: "Hostels retrieved successfully",
            data: result.hostels,
            meta: result.pagination,
        });
    }
);

/*
 * GET HOSTEL
 *
 * GET /api/v1/hostels/:hostelId
 */

export const getHostelById = asyncHandler(
    async (req, res) => {
        const hostel = await hostelService.getHostelById(
            req.params.hostelId
        );

        return sendSuccess(res, {
            message: "Hostel retrieved successfully",
            data: { hostel },
        });
    }
);

/*
 * UPDATE HOSTEL
 *
 * PATCH /api/v1/hostels/:hostelId
 */

export const updateHostel = asyncHandler(
    async (req, res) => {
        const hostel = await hostelService.updateHostel(
            req.params.hostelId,
            req.body
        );

        return sendSuccess(res, {
            message: "Hostel updated successfully",
            data: { hostel },
        });
    }
);

/*
 * ACTIVATE / DEACTIVATE HOSTEL
 *
 * PATCH /api/v1/hostels/:hostelId/status
 */

export const updateHostelStatus = asyncHandler(
    async (req, res) => {
        const hostel =
            await hostelService.updateHostelStatus(
                req.params.hostelId,
                req.body.isActive
            );

        return sendSuccess(res, {
            message: "Hostel status updated successfully",
            data: { hostel },
        });
    }
);
