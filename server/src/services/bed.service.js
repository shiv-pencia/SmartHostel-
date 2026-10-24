
import mongoose from "mongoose";

import Hostel from "../models/hostel.model.js";
import Room from "../models/room.model.js";
import Bed from "../models/bed.model.js";

import ApiError from "../utils/ApiError.js";
import { withOptionalTransaction } from "../utils/transaction.js";

/*
 * GET BED BY ID HELPER
 */
const findBedOrThrow = async (bedId) => {
    const bed = await Bed.findById(bedId);

    if (!bed) {
        throw new ApiError(404, "Bed not found");
    }

    return bed;
};

/*
 * CREATE BED
 *
 * If running on a replica set, room counter and bed insertion
 * are committed together in a MongoDB transaction.
 * If running on a standalone MongoDB instance, compensatory rollback
 * ensures consistent state if bed creation fails.
 */
export const createBed = async (roomId, data) => {
    return withOptionalTransaction(async (session) => {
        const room = await Room.findById(roomId).session(session);

        if (!room) {
            throw new ApiError(404, "Room not found");
        }

        if (room.status !== "active") {
            throw new ApiError(
                409,
                "Cannot add beds to a non-active room"
            );
        }

        const hostel = await Hostel.findById(room.hostel).session(session);

        if (!hostel) {
            throw new ApiError(
                409,
                "Room refers to a missing hostel"
            );
        }

        if (!hostel.isActive) {
            throw new ApiError(
                409,
                "Cannot add beds to an inactive hostel"
            );
        }

        /*
         * Reserve exactly one unprovisioned slot.
         *
         * This update writes to the Room document,
         * coordinating concurrent bed creations
         * and capacity updates.
         */
        const updatedRoom = await Room.findOneAndUpdate(
            {
                _id: room._id,
                status: "active",
                $expr: {
                    $lt: ["$bedCount", "$capacity"],
                },
            },
            {
                $inc: { bedCount: 1 },
            },
            {
                returnDocument: "after",
                ...(session ? { session } : {}),
            }
        );

        if (!updatedRoom) {
            throw new ApiError(
                409,
                "Room has reached its bed capacity"
            );
        }

        /*
         * Create the bed.
         */
        try {
            const [bed] = await Bed.create(
                [
                    {
                        room: room._id,
                        bedNumber: data.bedNumber,
                        operationalStatus: "usable",
                    },
                ],
                session ? { session } : {}
            );

            return bed.toSafeObject();
        } catch (error) {
            if (!session) {
                // Manually roll back reserved bed slot if transactions are unsupported
                await Room.findByIdAndUpdate(room._id, {
                    $inc: { bedCount: -1 },
                });
            }
            throw error;
        }
    });
};

/*
 * LIST BEDS BELONGING TO A ROOM
 */
export const listBedsByRoom = async (roomId) => {
    const room = await Room.findById(roomId);

    if (!room) {
        throw new ApiError(404, "Room not found");
    }

    const beds = await Bed.find({
        room: room._id,
    }).sort({
        bedNumber: 1,
        _id: 1,
    });

    return {
        room: room.toSafeObject(),
        beds: beds.map((bed) => bed.toSafeObject()),
    };
};

/*
 * GET BED BY ID
 */
export const getBedById = async (bedId) => {
    const bed = await findBedOrThrow(bedId);

    return bed.toSafeObject();
};

/*
 * UPDATE BED LABEL
 */
export const updateBed = async (bedId, data) => {
    const bed = await findBedOrThrow(bedId);

    bed.bedNumber = data.bedNumber;

    await bed.save();

    return bed.toSafeObject();
};

/*
 * UPDATE BED OPERATIONAL STATUS
 */
export const updateBedStatus = async (
    bedId,
    operationalStatus
) => {
    const bed = await findBedOrThrow(bedId);

    bed.operationalStatus = operationalStatus;

    await bed.save();

    return bed.toSafeObject();
};
