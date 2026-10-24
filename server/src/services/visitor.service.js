import Visitor from "../models/visitor.model.js";
import ApiError from "../utils/ApiError.js";

export const logVisitorEntry = async ({
    visitorName,
    visitorPhone,
    studentId,
    hostelId,
    purpose,
    idProofType,
    recordedBy,
}) => {
    const visitor = await Visitor.create({
        visitorName,
        visitorPhone,
        student: studentId,
        hostel: hostelId,
        purpose,
        idProofType,
        recordedBy,
        checkIn: new Date(),
        status: "inside",
    });

    return visitor.toSafeObject();
};

export const checkoutVisitor = async (visitorId) => {
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
        throw new ApiError(404, "Visitor record not found");
    }

    if (visitor.status === "checked_out") {
        throw new ApiError(400, "Visitor has already checked out");
    }

    visitor.status = "checked_out";
    visitor.checkOut = new Date();
    await visitor.save();

    return visitor.toSafeObject();
};

export const listVisitors = async ({
    hostelId,
    status,
    limit = 50,
} = {}) => {
    const filter = {};
    if (hostelId) filter.hostel = hostelId;
    if (status) filter.status = status;

    const visitors = await Visitor.find(filter)
        .sort({ checkIn: -1 })
        .limit(Number(limit))
        .populate("student", "name email")
        .populate("hostel", "name code")
        .populate("recordedBy", "name role")
        .lean();

    return visitors.map((v) => ({
        id: String(v._id),
        visitorName: v.visitorName,
        visitorPhone: v.visitorPhone,
        student: v.student
            ? { id: String(v.student._id), name: v.student.name, email: v.student.email }
            : null,
        hostel: v.hostel
            ? { id: String(v.hostel._id), name: v.hostel.name, code: v.hostel.code }
            : null,
        purpose: v.purpose,
        idProofType: v.idProofType,
        checkIn: v.checkIn,
        checkOut: v.checkOut,
        status: v.status,
        recordedBy: v.recordedBy?.name || "Staff",
    }));
};
