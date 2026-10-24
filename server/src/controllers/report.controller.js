import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import {
    getOccupancyReport,
    getComplaintAnalytics,
    getDashboardOverview,
} from "../services/report.service.js";

/**
 * GET /api/v1/reports/occupancy
 * Generates room and bed occupancy statistics overall and per hostel.
 */
export const occupancyReport = asyncHandler(async (req, res) => {
    const report = await getOccupancyReport({
        hostelId: req.query.hostelId,
    });

    return sendSuccess(res, {
        message: "Occupancy report generated successfully",
        data: report,
    });
});

/**
 * GET /api/v1/reports/complaints
 * Generates complaints and grievance analytics.
 */
export const complaintAnalytics = asyncHandler(async (req, res) => {
    const analytics = await getComplaintAnalytics({
        hostelId: req.query.hostelId,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
    });

    return sendSuccess(res, {
        message: "Complaint analytics generated successfully",
        data: analytics,
    });
});

/**
 * GET /api/v1/reports/overview
 * Consolidated KPI summary for admin and role dashboard homepages.
 */
export const dashboardOverview = asyncHandler(async (req, res) => {
    const overview = await getDashboardOverview();

    return sendSuccess(res, {
        message: "Dashboard overview fetched successfully",
        data: overview,
    });
});
