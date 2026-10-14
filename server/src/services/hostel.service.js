
import mongoose from "mongoose";

import Hostel from "../models/hostel.model.js";
import User from "../models/user.model.js";

import ApiError from "../utils/ApiError.js";

/*
 * HELPER: Find hostel by ID
 */

const findHostelOrThrow = async (hostelId) => {
    if (!mongoose.isObjectIdOrHexString(hostelId)) {
        throw new ApiError(400, "Invalid hostel ID");
    }

    const hostel = await Hostel.findById(hostelId);

    if (!hostel) {
        throw new ApiError(404, "Hostel not found");
    }

    return hostel;
};

/*
 * HELPER: Verify assigned warden
 */

const validateWarden = async (wardenId) => {
    // A hostel can temporarily have no warden.
    if (wardenId === null || wardenId === undefined) {
        return;
    }

    if (!mongoose.isObjectIdOrHexString(wardenId)) {
        throw new ApiError(400, "Invalid warden ID");
    }

    const warden = await User.findById(wardenId);

    if (!warden) {
        throw new ApiError(404, "Warden user not found");
    }

    if (warden.role !== "warden") {
        throw new ApiError(
            400,
            "Selected user must have the warden role"
        );
    }

    if (!warden.isActive) {
        throw new ApiError(
            400,
            "Cannot assign an inactive warden"
        );
    }
};

/*
 * HELPER: Escape regular-expression characters
 */

const escapeRegExp = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/*
 * 1. CREATE HOSTEL
 */

export const createHostel = async (data) => {
    await validateWarden(data.warden);

    // The unique MongoDB index on "code" prevents
    // duplicate hostels even under concurrent requests.
    const hostel = await Hostel.create({
        name: data.name,
        code: data.code,
        location: data.location,
        genderPolicy: data.genderPolicy,
        warden: data.warden ?? null,
    });

    return hostel.toSafeObject();
};

/*
 * 2. LIST HOSTELS
 */

export const listHostels = async (query) => {
    const {
        page,
        limit,
        search,
        genderPolicy,
        status,
    } = query;

    const filter = {};

    if (genderPolicy) {
        filter.genderPolicy = genderPolicy;
    }

    if (status) {
        filter.isActive = status === "active";
    }

    if (search) {
        const safeSearch = escapeRegExp(search);

        filter.$or = [
            {
                name: {
                    $regex: safeSearch,
                    $options: "i",
                },
            },
            {
                code: {
                    $regex: safeSearch,
                    $options: "i",
                },
            },
            {
                location: {
                    $regex: safeSearch,
                    $options: "i",
                },
            },
        ];
    }

    const skip = (page - 1) * limit;

    const [hostels, total] = await Promise.all([
        Hostel.find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(limit),

        Hostel.countDocuments(filter),
    ]);

    return {
        hostels: hostels.map(
            (hostel) => hostel.toSafeObject()
        ),

        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/*
 * 3. GET HOSTEL BY ID
 */

export const getHostelById = async (hostelId) => {
    const hostel = await findHostelOrThrow(hostelId);

    return hostel.toSafeObject();
};

/*
 * 4. UPDATE HOSTEL
 */

export const updateHostel = async (
    hostelId,
    data
) => {
    const hostel = await findHostelOrThrow(hostelId);

    // Validate referenced warden before updating.
    if (data.warden !== undefined) {
        await validateWarden(data.warden);
    }

    const allowedFields = [
        "name",
        "location",
        "genderPolicy",
        "warden",
    ];

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            hostel[field] = data[field];
        }
    }

    await hostel.save();

    return hostel.toSafeObject();
};

/*
 * 5. ACTIVATE / DEACTIVATE HOSTEL
 */

export const updateHostelStatus = async (
    hostelId,
    isActive
) => {
    const hostel = await findHostelOrThrow(hostelId);

    if (hostel.isActive === isActive) {
        return hostel.toSafeObject();
    }

    hostel.isActive = isActive;

    await hostel.save();

    return hostel.toSafeObject();
};
