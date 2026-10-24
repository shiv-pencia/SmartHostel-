import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import * as complaintService from "../services/complaint.service.js";

const getActorId = (req) => {
    return req.user?.id ?? req.user?._id ?? req.user?.userId;
};

/*
 * POST /api/v1/complaints
 * Student registers a new complaint.
 */
export const createComplaint = asyncHandler(async (req, res) => {
    const complaint = await complaintService.createComplaint({
        studentId: getActorId(req),
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        priority: req.body.priority,
        hostelId: req.body.hostelId,
        roomId: req.body.roomId,
        bedId: req.body.bedId,
    });

    return sendSuccess(res, {
        statusCode: 201,
        message: "Complaint registered successfully",
        data: complaint,
    });
});

/*
 * GET /api/v1/complaints
 * Role-aware complaint listing with filters.
 */
export const listComplaints = asyncHandler(async (req, res) => {
    const result = await complaintService.listComplaints({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        category: req.query.category,
        priority: req.query.priority,
        hostelId: req.query.hostelId,
        studentId: req.query.studentId,
        assignedTo: req.query.assignedTo,
        userRole: req.user?.role,
        userId: getActorId(req),
    });

    return sendSuccess(res, {
        message: "Complaints fetched successfully",
        data: result.complaints,
        meta: result.pagination,
    });
});

/*
 * GET /api/v1/complaints/stats
 * Aggregate metrics on complaints.
 */
export const getComplaintStats = asyncHandler(async (req, res) => {
    const stats = await complaintService.getComplaintStats({
        hostelId: req.query.hostelId,
    });

    return sendSuccess(res, {
        message: "Complaint statistics fetched successfully",
        data: stats,
    });
});

/*
 * GET /api/v1/complaints/:complaintId
 * Details of a single complaint.
 */
export const getComplaintById = asyncHandler(async (req, res) => {
    const complaint = await complaintService.getComplaintById(
        req.params.complaintId,
        req.user
    );

    return sendSuccess(res, {
        message: "Complaint retrieved successfully",
        data: complaint,
    });
});

/*
 * PATCH /api/v1/complaints/:complaintId/assign
 * Administrator or Warden assigns maintenance staff.
 */
export const assignComplaint = asyncHandler(async (req, res) => {
    const complaint = await complaintService.assignComplaint({
        complaintId: req.params.complaintId,
        staffId: req.body.staffId,
        assignedBy: getActorId(req),
    });

    return sendSuccess(res, {
        message: "Staff assigned to complaint successfully",
        data: complaint,
    });
});

/*
 * PATCH /api/v1/complaints/:complaintId/status
 * Staff updates work progress or resolves complaint. Admin/warden can also resolve/reject.
 */
export const updateComplaintStatus = asyncHandler(async (req, res) => {
    const complaint = await complaintService.updateComplaintStatus({
        complaintId: req.params.complaintId,
        status: req.body.status,
        resolutionNotes: req.body.resolutionNotes,
        updatedBy: getActorId(req),
        userRole: req.user?.role,
    });

    return sendSuccess(res, {
        message: "Complaint status updated successfully",
        data: complaint,
    });
});
