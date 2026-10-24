
import mongoose from "mongoose";

import User from "../models/user.model.js";
import Hostel from "../models/hostel.model.js";
import Room from "../models/room.model.js";
import Bed from "../models/bed.model.js";
import Allocation from "../models/allocation.model.js";

import ApiError from "../utils/ApiError.js";
import { withOptionalTransaction } from "../utils/transaction.js";

/*
 * Validate MongoDB ObjectIds before querying.
 */
const validateId = (id, fieldName) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, `Invalid ${fieldName}`);
    }
};

/*
 * Verify that the person performing the operation
 * is an active administrator.
 */
const requireAdmin = async (adminId, session) => {
    const admin = await User.findById(adminId).session(session);

    if (!admin || !admin.isActive || admin.role !== "admin") {
        throw new ApiError(
            403,
            "Only an active administrator can manage allocations"
        );
    }

    return admin;
};

/*
 * Convert populated references into safe response objects.
 */
const serializeReference = (value, fields = []) => {
    if (!value) {
        return null;
    }

    // If Mongoose populated the reference, include selected fields.
    if (value._id) {
        const result = {
            id: value._id.toString(),
        };

        for (const field of fields) {
            if (value[field] !== undefined) {
                result[field] = value[field];
            }
        }

        return result;
    }

    // Otherwise, return just the referenced document ID.
    return value.toString();
};

const serializeAllocation = (allocation) => ({
    id: allocation._id.toString(),

    student: serializeReference(
        allocation.student,
        ["name", "email", "role"]
    ),

    hostel: serializeReference(
        allocation.hostel,
        ["name", "code"]
    ),

    room: serializeReference(
        allocation.room,
        ["roomNumber", "floor", "roomType"]
    ),

    bed: serializeReference(
        allocation.bed,
        ["bedNumber", "operationalStatus"]
    ),

    status: allocation.status,
    allocatedAt: allocation.allocatedAt,
    vacatedAt: allocation.vacatedAt,

    allocatedBy: serializeReference(
        allocation.allocatedBy,
        ["name", "email"]
    ),

    vacatedBy: serializeReference(
        allocation.vacatedBy,
        ["name", "email"]
    ),

    createdAt: allocation.createdAt,
    updatedAt: allocation.updatedAt,
});

/*
 * 1. ALLOCATE A BED TO A STUDENT
 *
 * All related checks and insertion happen inside
 * one MongoDB transaction.
 */
export const allocateStudent = async ({
    studentId,
    hostelId,
    roomId,
    bedId,
    allocatedBy,
}) => {
    validateId(studentId, "student ID");
    validateId(hostelId, "hostel ID");
    validateId(roomId, "room ID");
    validateId(bedId, "bed ID");
    validateId(allocatedBy, "administrator ID");

    try {
        return await withOptionalTransaction(
            async (session) => {
                await requireAdmin(allocatedBy, session);

                const student = await User.findById(studentId)
                    .session(session);

                if (!student) {
                    throw new ApiError(404, "Student not found");
                }

                if (!student.isActive || student.role !== "student") {
                    throw new ApiError(
                        409,
                        "Only active student accounts can receive allocations"
                    );
                }

                const hostel = await Hostel.findById(hostelId)
                    .session(session);

                if (!hostel) {
                    throw new ApiError(404, "Hostel not found");
                }

                if (!hostel.isActive) {
                    throw new ApiError(
                        409,
                        "Cannot allocate a bed in an inactive hostel"
                    );
                }

                const room = await Room.findById(roomId)
                    .session(session);

                if (!room) {
                    throw new ApiError(404, "Room not found");
                }

                if (room.status !== "active") {
                    throw new ApiError(
                        409,
                        "Cannot allocate a bed in an inactive or maintenance room"
                    );
                }

                if (room.hostel.toString() !== hostel._id.toString()) {
                    throw new ApiError(
                        400,
                        "The selected room does not belong to this hostel"
                    );
                }

                const bed = await Bed.findById(bedId)
                    .session(session);

                if (!bed) {
                    throw new ApiError(404, "Bed not found");
                }

                if (bed.room.toString() !== room._id.toString()) {
                    throw new ApiError(
                        400,
                        "The selected bed does not belong to this room"
                    );
                }

                if (bed.operationalStatus !== "usable") {
                    throw new ApiError(
                        409,
                        "The selected bed is not available for allocation"
                    );
                }

                // A student can have only one active allocation.
                const existingStudentAllocation =
                    await Allocation.findOne({
                        student: student._id,
                        status: "active",
                    }).session(session);

                if (existingStudentAllocation) {
                    throw new ApiError(
                        409,
                        "This student already has an active allocation"
                    );
                }

                // A bed can have only one active allocation.
                const existingBedAllocation =
                    await Allocation.findOne({
                        bed: bed._id,
                        status: "active",
                    }).session(session);

                if (existingBedAllocation) {
                    throw new ApiError(
                        409,
                        "This bed is already occupied"
                    );
                }

                const [allocation] = await Allocation.create(
                    [
                        {
                            student: student._id,
                            hostel: hostel._id,
                            room: room._id,
                            bed: bed._id,
                            status: "active",
                            allocatedAt: new Date(),
                            allocatedBy: allocatedBy,
                        },
                    ],
                    session ? { session } : {}
                );

                return allocation.toSafeObject();
            }
        );
    } catch (error) {
        // The database indexes provide an extra safeguard
        // if two allocation requests race with each other.
        if (error?.code === 11000) {
            throw new ApiError(
                409,
                "The student or bed already has an active allocation"
            );
        }

        throw error;
    }
};

/*
 * 2. VACATE AN ALLOCATION
 *
 * Keep the allocation record for historical reporting.
 * Do not delete it.
 */
export const vacateAllocation = async ({
    allocationId,
    vacatedBy,
}) => {
    validateId(allocationId, "allocation ID");
    validateId(vacatedBy, "administrator ID");

    return withOptionalTransaction(async (session) => {
        await requireAdmin(vacatedBy, session);

        const allocation = await Allocation.findById(allocationId)
            .session(session);

        if (!allocation) {
            throw new ApiError(404, "Allocation not found");
        }

        if (allocation.status !== "active") {
            throw new ApiError(
                409,
                "This allocation has already been vacated"
            );
        }

        allocation.status = "vacated";
        allocation.vacatedAt = new Date();
        allocation.vacatedBy = vacatedBy;

        await allocation.save(session ? { session } : {});

        return allocation.toSafeObject();
    });
};

/*
 * 3. LIST VACANT BEDS
 *
 * Vacancy is calculated from actual usable beds and
 * active allocations, not from Room.bedCount alone.
 */
export const listVacantBeds = async ({ hostelId } = {}) => {
    let hostels;

    if (hostelId) {
        validateId(hostelId, "hostel ID");

        const hostel = await Hostel.findOne({
            _id: hostelId,
            isActive: true,
        });

        if (!hostel) {
            throw new ApiError(
                404,
                "Active hostel not found"
            );
        }

        hostels = [hostel];
    } else {
        hostels = await Hostel.find({
            isActive: true,
        }).sort({ name: 1, _id: 1 });
    }

    if (hostels.length === 0) {
        return [];
    }

    const hostelIds = hostels.map((hostel) => hostel._id);

    const rooms = await Room.find({
        hostel: { $in: hostelIds },
        status: "active",
    }).sort({ roomNumber: 1, _id: 1 });

    if (rooms.length === 0) {
        return [];
    }

    const roomIds = rooms.map((room) => room._id);

    const beds = await Bed.find({
        room: { $in: roomIds },
        operationalStatus: "usable",
    }).sort({ room: 1, bedNumber: 1, _id: 1 });

    if (beds.length === 0) {
        return [];
    }

    const bedIds = beds.map((bed) => bed._id);

    const occupiedBedIds = await Allocation.distinct("bed", {
        bed: { $in: bedIds },
        status: "active",
    });

    const occupiedSet = new Set(
        occupiedBedIds.map((id) => id.toString())
    );

    const roomById = new Map(
        rooms.map((room) => [room._id.toString(), room])
    );

    const hostelById = new Map(
        hostels.map((hostel) => [hostel._id.toString(), hostel])
    );

    return beds
        .filter((bed) => !occupiedSet.has(bed._id.toString()))
        .map((bed) => {
            const room = roomById.get(bed.room.toString());
            const hostel = hostelById.get(room.hostel.toString());

            return {
                id: bed._id.toString(),
                bedNumber: bed.bedNumber,
                operationalStatus: bed.operationalStatus,

                room: {
                    id: room._id.toString(),
                    roomNumber: room.roomNumber,
                    floor: room.floor,
                    roomType: room.roomType,
                },

                hostel: {
                    id: hostel._id.toString(),
                    name: hostel.name,
                    code: hostel.code,
                },
            };
        });
};

/*
 * 4. GET A STUDENT'S ACTIVE ALLOCATION
 */
export const getStudentActiveAllocation = async (studentId) => {
    validateId(studentId, "student ID");

    const allocation = await Allocation.findOne({
        student: studentId,
        status: "active",
    })
        .populate("student", "name email role")
        .populate("hostel", "name code")
        .populate("room", "roomNumber floor roomType")
        .populate("bed", "bedNumber operationalStatus")
        .populate("allocatedBy", "name email");

    return allocation ? serializeAllocation(allocation) : null;
};

/*
 * 5. LIST ALLOCATIONS, INCLUDING HISTORY
 */
export const listAllocations = async ({
    page = 1,
    limit = 20,
    status,
    hostelId,
    studentId,
} = {}) => {
    const filter = {};

    if (status !== undefined) {
        if (!["active", "vacated"].includes(status)) {
            throw new ApiError(
                400,
                "Status must be active or vacated"
            );
        }

        filter.status = status;
    }

    if (hostelId) {
        validateId(hostelId, "hostel ID");
        filter.hostel = hostelId;
    }

    if (studentId) {
        validateId(studentId, "student ID");
        filter.student = studentId;
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(
        100,
        Math.max(1, Number(limit) || 20)
    );

    const [allocations, total] = await Promise.all([
        Allocation.find(filter)
            .sort({ allocatedAt: -1, _id: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .populate("student", "name email role")
            .populate("hostel", "name code")
            .populate("room", "roomNumber floor roomType")
            .populate("bed", "bedNumber operationalStatus")
            .populate("allocatedBy", "name email")
            .populate("vacatedBy", "name email"),

        Allocation.countDocuments(filter),
    ]);

    return {
        allocations: allocations.map(serializeAllocation),

        pagination: {
            page: safePage,
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
        },
    };
};
