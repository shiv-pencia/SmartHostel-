import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

import {
    allocateStudent,
    vacateAllocation,
    listVacantBeds,
    getStudentActiveAllocation,
    listAllocations,
} from "../services/allocation.service.js";

const getActorId = (req) => {
    return req.user?.id ?? req.user?._id ?? req.user?.userId;
};

/*
 * POST /api/v1/allocations
 * Allocate a bed to a student.
 */
export const createAllocation = asyncHandler(async (req, res) => {
    const allocation = await allocateStudent({
        studentId: req.body.studentId,
        hostelId: req.body.hostelId,
        roomId: req.body.roomId,
        bedId: req.body.bedId,
        allocatedBy: getActorId(req),
    });

    return sendSuccess(res, {
        statusCode: 201,
        message: "Student allocated successfully",
        data: allocation,
    });
});

/*
 * GET /api/v1/allocations
 * List allocations and allocation history.
 */
export const getAllocations = asyncHandler(async (req, res) => {
    const result = await listAllocations({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        hostelId: req.query.hostelId,
        studentId: req.query.studentId,
    });

    return sendSuccess(res, {
        message: "Allocations fetched successfully",
        data: result.allocations,
        meta: result.pagination,
    });
});

/*
 * GET /api/v1/allocations/vacancies
 * List available beds.
 */
export const getVacancies = asyncHandler(async (req, res) => {
    const beds = await listVacantBeds({
        hostelId: req.query.hostelId,
    });

    return sendSuccess(res, {
        message: "Vacant beds fetched successfully",
        data: beds,
        meta: { count: beds.length },
    });
});

/*
 * GET /api/v1/allocations/my
 * Get the logged-in student's active allocation.
 */
export const getMyAllocation = asyncHandler(async (req, res) => {
    const studentId = getActorId(req);

    const allocation = await getStudentActiveAllocation(studentId);

    return sendSuccess(res, {
        message: allocation
            ? "Active allocation fetched successfully"
            : "No active allocation found",
        data: allocation,
    });
});

/*
 * PATCH /api/v1/allocations/:allocationId/vacate
 * Vacate an active allocation.
 */
export const vacateStudentAllocation = asyncHandler(async (req, res) => {
    const allocation = await vacateAllocation({
        allocationId: req.params.allocationId,
        vacatedBy: getActorId(req),
    });

    return sendSuccess(res, {
        message: "Allocation vacated successfully",
        data: allocation,
    });
});
