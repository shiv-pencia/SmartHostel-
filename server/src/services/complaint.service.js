import mongoose from "mongoose";

import Complaint from "../models/complaint.model.js";
import User from "../models/user.model.js";
import Hostel from "../models/hostel.model.js";
import Allocation from "../models/allocation.model.js";

import ApiError from "../utils/ApiError.js";

const validateId = (id, fieldName) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${fieldName}`);
    }
};

const serializeReference = (value, fields = []) => {
    if (!value) {
        return null;
    }
    if (value._id) {
        const result = { id: value._id.toString() };
        for (const field of fields) {
            if (value[field] !== undefined) {
                result[field] = value[field];
            }
        }
        return result;
    }
    return value.toString();
};

const serializeComplaint = (complaint) => ({
    id: complaint._id.toString(),
    title: complaint.title,
    description: complaint.description,
    category: complaint.category,
    priority: complaint.priority,
    status: complaint.status,

    student: serializeReference(complaint.student, ["name", "email", "phone"]),
    hostel: serializeReference(complaint.hostel, ["name", "code"]),
    room: serializeReference(complaint.room, ["roomNumber", "floor"]),
    bed: serializeReference(complaint.bed, ["bedNumber"]),

    assignedTo: serializeReference(complaint.assignedTo, [
        "name",
        "email",
        "phone",
        "role",
    ]),
    assignedBy: serializeReference(complaint.assignedBy, ["name", "email"]),
    assignedAt: complaint.assignedAt,

    resolutionNotes: complaint.resolutionNotes,
    resolvedAt: complaint.resolvedAt,
    resolvedBy: serializeReference(complaint.resolvedBy, ["name", "email"]),

    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
});

/*
 * 1. CREATE COMPLAINT
 */
export const createComplaint = async ({
    studentId,
    title,
    description,
    category,
    priority = "medium",
    hostelId,
    roomId,
    bedId,
}) => {
    validateId(studentId, "student ID");

    const student = await User.findById(studentId);
    if (!student || !student.isActive || student.role !== "student") {
        throw new ApiError(403, "Only active students can submit complaints");
    }

    let finalHostelId = hostelId;
    let finalRoomId = roomId ?? null;
    let finalBedId = bedId ?? null;

    // If hostel is not specified, auto-resolve from active allocation
    if (!finalHostelId) {
        const activeAllocation = await Allocation.findOne({
            student: studentId,
            status: "active",
        });

        if (activeAllocation) {
            finalHostelId = activeAllocation.hostel;
            finalRoomId = activeAllocation.room;
            finalBedId = activeAllocation.bed;
        } else {
            throw new ApiError(
                400,
                "Hostel reference is required as you do not have an active room allocation"
            );
        }
    } else {
        validateId(finalHostelId, "hostel ID");
        const hostel = await Hostel.findById(finalHostelId);
        if (!hostel || !hostel.isActive) {
            throw new ApiError(404, "Active hostel not found");
        }
    }

    const complaint = await Complaint.create({
        student: studentId,
        hostel: finalHostelId,
        room: finalRoomId,
        bed: finalBedId,
        title,
        description,
        category,
        priority,
        status: "pending",
    });

    const populated = await Complaint.findById(complaint._id)
        .populate("student", "name email phone")
        .populate("hostel", "name code")
        .populate("room", "roomNumber floor")
        .populate("bed", "bedNumber");

    return serializeComplaint(populated);
};

/*
 * 2. LIST COMPLAINTS
 */
export const listComplaints = async ({
    page = 1,
    limit = 20,
    status,
    category,
    priority,
    hostelId,
    studentId,
    assignedTo,
    userRole,
    userId,
} = {}) => {
    const filter = {};

    // Role-based scoping
    if (userRole === "student") {
        filter.student = userId;
    } else if (userRole === "staff") {
        filter.assignedTo = userId;
    } else {
        // Admin or warden can filter by student or staff
        if (studentId) {
            validateId(studentId, "student ID");
            filter.student = studentId;
        }
        if (assignedTo) {
            validateId(assignedTo, "assigned staff ID");
            filter.assignedTo = assignedTo;
        }
    }

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (hostelId) {
        validateId(hostelId, "hostel ID");
        filter.hostel = hostelId;
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const [complaints, total] = await Promise.all([
        Complaint.find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .populate("student", "name email phone")
            .populate("hostel", "name code")
            .populate("room", "roomNumber floor")
            .populate("bed", "bedNumber")
            .populate("assignedTo", "name email phone role")
            .populate("assignedBy", "name email")
            .populate("resolvedBy", "name email"),
        Complaint.countDocuments(filter),
    ]);

    return {
        complaints: complaints.map(serializeComplaint),
        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
        },
    };
};

/*
 * 3. GET COMPLAINT BY ID
 */
export const getComplaintById = async (complaintId, user) => {
    validateId(complaintId, "complaint ID");

    const complaint = await Complaint.findById(complaintId)
        .populate("student", "name email phone")
        .populate("hostel", "name code")
        .populate("room", "roomNumber floor")
        .populate("bed", "bedNumber")
        .populate("assignedTo", "name email phone role")
        .populate("assignedBy", "name email")
        .populate("resolvedBy", "name email");

    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    // Role-based authorization
    if (user.role === "student" && complaint.student._id.toString() !== user.id) {
        throw new ApiError(403, "You can only view your own complaints");
    }

    if (
        user.role === "staff" &&
        complaint.assignedTo?._id?.toString() !== user.id
    ) {
        throw new ApiError(
            403,
            "You can only view complaints assigned to you"
        );
    }

    return serializeComplaint(complaint);
};

/*
 * 4. ASSIGN COMPLAINT TO STAFF (Admin / Warden)
 */
export const assignComplaint = async ({
    complaintId,
    staffId,
    assignedBy,
}) => {
    validateId(complaintId, "complaint ID");
    validateId(staffId, "staff ID");
    validateId(assignedBy, "administrator ID");

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    if (complaint.status === "resolved" || complaint.status === "rejected") {
        throw new ApiError(
            409,
            `Cannot assign a complaint that has already been ${complaint.status}`
        );
    }

    const staffUser = await User.findById(staffId);
    if (!staffUser || !staffUser.isActive || staffUser.role !== "staff") {
        throw new ApiError(
            400,
            "Assigned user must be an active maintenance staff member"
        );
    }

    complaint.assignedTo = staffId;
    complaint.assignedBy = assignedBy;
    complaint.assignedAt = new Date();
    complaint.status = "assigned";

    await complaint.save();

    const populated = await Complaint.findById(complaintId)
        .populate("student", "name email phone")
        .populate("hostel", "name code")
        .populate("room", "roomNumber floor")
        .populate("bed", "bedNumber")
        .populate("assignedTo", "name email phone role")
        .populate("assignedBy", "name email")
        .populate("resolvedBy", "name email");

    return serializeComplaint(populated);
};

/*
 * 5. UPDATE COMPLAINT STATUS (Staff or Admin/Warden)
 */
export const updateComplaintStatus = async ({
    complaintId,
    status,
    resolutionNotes,
    updatedBy,
    userRole,
}) => {
    validateId(complaintId, "complaint ID");
    validateId(updatedBy, "user ID");

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
        throw new ApiError(404, "Complaint not found");
    }

    if (userRole === "staff") {
        if (complaint.assignedTo?.toString() !== updatedBy.toString()) {
            throw new ApiError(
                403,
                "You can only update complaints assigned to you"
            );
        }
        if (!["in_progress", "resolved"].includes(status)) {
            throw new ApiError(
                400,
                "Staff can only change status to 'in_progress' or 'resolved'"
            );
        }
    }

    complaint.status = status;

    if (resolutionNotes) {
        complaint.resolutionNotes = resolutionNotes;
    }

    if (status === "resolved") {
        complaint.resolvedAt = new Date();
        complaint.resolvedBy = updatedBy;
    }

    await complaint.save();

    const populated = await Complaint.findById(complaintId)
        .populate("student", "name email phone")
        .populate("hostel", "name code")
        .populate("room", "roomNumber floor")
        .populate("bed", "bedNumber")
        .populate("assignedTo", "name email phone role")
        .populate("assignedBy", "name email")
        .populate("resolvedBy", "name email");

    return serializeComplaint(populated);
};

/*
 * 6. COMPLAINT SUMMARY STATS
 */
export const getComplaintStats = async ({ hostelId } = {}) => {
    const match = {};
    if (hostelId) {
        validateId(hostelId, "hostel ID");
        match.hostel = new mongoose.Types.ObjectId(hostelId);
    }

    const [statusStats, categoryStats, priorityStats, total] = await Promise.all([
        Complaint.aggregate([
            { $match: match },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Complaint.aggregate([
            { $match: match },
            { $group: { _id: "$category", count: { $sum: 1 } } },
        ]),
        Complaint.aggregate([
            { $match: match },
            { $group: { _id: "$priority", count: { $sum: 1 } } },
        ]),
        Complaint.countDocuments(match),
    ]);

    const byStatus = {
        pending: 0,
        assigned: 0,
        in_progress: 0,
        resolved: 0,
        rejected: 0,
    };
    for (const item of statusStats) {
        if (byStatus[item._id] !== undefined) {
            byStatus[item._id] = item.count;
        }
    }

    const byCategory = {};
    for (const item of categoryStats) {
        byCategory[item._id] = item.count;
    }

    const byPriority = {};
    for (const item of priorityStats) {
        byPriority[item._id] = item.count;
    }

    return {
        total,
        byStatus,
        byCategory,
        byPriority,
        activeCount: byStatus.pending + byStatus.assigned + byStatus.in_progress,
        resolvedCount: byStatus.resolved,
    };
};
