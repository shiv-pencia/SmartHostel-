
import Room from "../models/room.model.js";
import Hostel from "../models/hostel.model.js";

import ApiError from "../utils/ApiError.js";

const findRoomOrThrow = async (roomId) => {
    const room = await Room.findById(roomId);

    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    return room;
};

const escapeRegExp = (value) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/*
 * CREATE ROOM
 */
export const createRoom = async (data) => {
    const hostel = await Hostel.findById(data.hostel);

    if (!hostel) {
        throw new ApiError(404, "Hostel not found");
    }

    if (!hostel.isActive) {
        throw new ApiError(
            409,
            "Cannot create rooms in an inactive hostel"
        );
    }

    const room = await Room.create({
        hostel: hostel._id,
        roomNumber: data.roomNumber,
        floor: data.floor,
        capacity: data.capacity,
        bedCount: 0,
        roomType: data.roomType,
        status: "active",
    });

    return room.toSafeObject();
};

/*
 * LIST ROOMS
 */
export const listRooms = async (query) => {
    const {
        page,
        limit,
        hostel,
        search,
        status,
        roomType,
    } = query;

    const filter = {};

    if (hostel) {
        filter.hostel = hostel;
    }

    if (status) {
        filter.status = status;
    }

    if (roomType) {
        filter.roomType = roomType;
    }

    if (search) {
        filter.roomNumber = {
            $regex: escapeRegExp(search),
            $options: "i",
        };
    }

    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
        Room.find(filter)
            .sort({ hostel: 1, roomNumber: 1, _id: 1 })
            .skip(skip)
            .limit(limit),

        Room.countDocuments(filter),
    ]);

    return {
        rooms: rooms.map((room) => room.toSafeObject()),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/*
 * GET ROOM BY ID
 */
export const getRoomById = async (roomId) => {
    const room = await findRoomOrThrow(roomId);

    return room.toSafeObject();
};

/*
 * UPDATE ROOM
 *
 * Capacity changes use an atomic conditional update.
 */
export const updateRoom = async (roomId, data) => {
    const changes = {};

    const fields = [
        "roomNumber",
        "floor",
        "capacity",
        "roomType",
    ];

    for (const field of fields) {
        if (data[field] !== undefined) {
            changes[field] = data[field];
        }
    }

    const filter = { _id: roomId };

    if (data.capacity !== undefined) {
        // Capacity cannot become smaller than
        // the number of already-provisioned beds.
        filter.bedCount = {
            $lte: data.capacity,
        };
    }

    const room = await Room.findOneAndUpdate(
        filter,
        { $set: changes },
        {
            returnDocument: "after",
            runValidators: true,
        }
    );

    if (!room) {
        const exists = await Room.exists({
            _id: roomId,
        });

        if (!exists) {
            throw new ApiError(404, "Room not found");
        }

        throw new ApiError(
            409,
            "Room capacity cannot be below its provisioned bed count"
        );
    }

    return room.toSafeObject();
};

/*
 * UPDATE ROOM STATUS
 */
export const updateRoomStatus = async (
    roomId,
    status
) => {
    const room = await Room.findByIdAndUpdate(
        roomId,
        { $set: { status } },
        {
            returnDocument: "after",
            runValidators: true,
        }
    );

    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    return room.toSafeObject();
};
