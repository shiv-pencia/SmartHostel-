import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import * as visitorService from "../services/visitor.service.js";

export const logEntry = asyncHandler(async (req, res) => {
    const actorId = req.user?.id ?? req.user?._id;
    const visitor = await visitorService.logVisitorEntry({
        ...req.body,
        recordedBy: actorId,
    });

    return sendSuccess(res, {
        statusCode: 201,
        message: "Visitor entry logged successfully",
        data: visitor,
    });
});

export const checkout = asyncHandler(async (req, res) => {
    const visitor = await visitorService.checkoutVisitor(req.params.visitorId);

    return sendSuccess(res, {
        message: "Visitor checked out successfully",
        data: visitor,
    });
});

export const getVisitors = asyncHandler(async (req, res) => {
    const visitors = await visitorService.listVisitors({
        hostelId: req.query.hostelId,
        status: req.query.status,
    });

    return sendSuccess(res, {
        message: "Visitors list fetched successfully",
        data: visitors,
    });
});
