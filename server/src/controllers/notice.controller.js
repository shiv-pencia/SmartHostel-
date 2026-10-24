import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import * as noticeService from "../services/notice.service.js";

export const createNotice = asyncHandler(async (req, res) => {
    const actorId = req.user?.id ?? req.user?._id;
    const notice = await noticeService.createNotice({
        ...req.body,
        publishedBy: actorId,
    });

    return sendSuccess(res, {
        statusCode: 201,
        message: "Notice published successfully",
        data: notice,
    });
});

export const getNotices = asyncHandler(async (req, res) => {
    const notices = await noticeService.listNotices({
        category: req.query.category,
        priority: req.query.priority,
        hostelId: req.query.hostelId,
    });

    return sendSuccess(res, {
        message: "Notices fetched successfully",
        data: notices,
    });
});
