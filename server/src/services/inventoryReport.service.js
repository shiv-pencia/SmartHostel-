
import Hostel from "../models/hostel.model.js";
import Room from "../models/room.model.js";
import Bed from "../models/bed.model.js";

/*
 * Fields returned for each hostel.
 */
const metricFields = [
    "totalRooms",
    "activeRooms",
    "maintenanceRooms",
    "inactiveRooms",
    "totalCapacity",
    "provisionedBeds",
    "usableBeds",
    "maintenanceBeds",
    "inactiveBeds",
    "unprovisionedSlots",
    "provisionableSlots",
    "counterMismatchRooms",
    "overCapacityRooms",
];

const emptyMetrics = () =>
    Object.fromEntries(
        metricFields.map((field) => [field, 0])
    );

/*
 * Helper: count beds with a particular status.
 *
 * The $lookup pipeline groups each room's beds
 * by operationalStatus before returning results.
 */
const countStatus = (status) => ({
    $sum: {
        $map: {
            input: "$bedStatuses",
            as: "item",
            in: {
                $cond: [
                    { $eq: ["$$item._id", status] },
                    "$$item.count",
                    0,
                ],
            },
        },
    },
});

const isRoomStatus = (status) => ({
    $cond: [
        { $eq: ["$status", status] },
        1,
        0,
    ],
});

/*
 * Aggregate rooms and beds, grouped by hostel.
 */
const aggregateRoomInventory = async () => {
    return Room.aggregate([
        {
            $lookup: {
                from: Bed.collection.name,
                localField: "_id",
                foreignField: "room",
                pipeline: [
                    {
                        $group: {
                            _id: "$operationalStatus",
                            count: { $sum: 1 },
                        },
                    },
                ],
                as: "bedStatuses",
            },
        },

        {
            $addFields: {
                storedBedCount: {
                    $ifNull: ["$bedCount", 0],
                },

                actualBedCount: {
                    $sum: "$bedStatuses.count",
                },

                usableCount: countStatus("usable"),
                maintenanceCount: countStatus("maintenance"),
                inactiveCount: countStatus("inactive"),
            },
        },

        {
            $addFields: {
                remainingPhysicalSlots: {
                    $max: [
                        0,
                        {
                            $subtract: [
                                "$capacity",
                                "$actualBedCount",
                            ],
                        },
                    ],
                },
            },
        },

        {
            $group: {
                _id: "$hostel",

                totalRooms: { $sum: 1 },

                activeRooms: {
                    $sum: isRoomStatus("active"),
                },

                maintenanceRooms: {
                    $sum: isRoomStatus("maintenance"),
                },

                inactiveRooms: {
                    $sum: isRoomStatus("inactive"),
                },

                totalCapacity: {
                    $sum: "$capacity",
                },

                provisionedBeds: {
                    $sum: "$actualBedCount",
                },

                usableBeds: {
                    $sum: "$usableCount",
                },

                maintenanceBeds: {
                    $sum: "$maintenanceCount",
                },

                inactiveBeds: {
                    $sum: "$inactiveCount",
                },

                unprovisionedSlots: {
                    $sum: "$remainingPhysicalSlots",
                },

                // Only active rooms with synchronized counters
                // qualify as potentially provisionable.
                activeProvisionableSlots: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ["$status", "active"] },
                                    {
                                        $eq: [
                                            "$storedBedCount",
                                            "$actualBedCount",
                                        ],
                                    },
                                ],
                            },
                            "$remainingPhysicalSlots",
                            0,
                        ],
                    },
                },

                counterMismatchRooms: {
                    $sum: {
                        $cond: [
                            {
                                $ne: [
                                    "$storedBedCount",
                                    "$actualBedCount",
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },

                overCapacityRooms: {
                    $sum: {
                        $cond: [
                            {
                                $or: [
                                    {
                                        $gt: [
                                            "$actualBedCount",
                                            "$capacity",
                                        ],
                                    },
                                    {
                                        $gt: [
                                            "$storedBedCount",
                                            "$capacity",
                                        ],
                                    },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
    ]);
};

/*
 * REPORT SERVICE
 *
 * GET /api/v1/reports/inventory
 */
export const getInventoryReport = async () => {
    const [hostels, groupedRooms, orphanBedResult] =
        await Promise.all([
            Hostel.find()
                .select("name code location isActive")
                .sort({ name: 1, _id: 1 })
                .lean(),

            aggregateRoomInventory(),

            // Detect beds whose referenced room is missing.
            Bed.aggregate([
                {
                    $lookup: {
                        from: Room.collection.name,
                        localField: "room",
                        foreignField: "_id",
                        as: "parentRoom",
                    },
                },
                {
                    $match: {
                        parentRoom: { $size: 0 },
                    },
                },
                {
                    $count: "count",
                },
            ]),
        ]);

    const groupedByHostel = new Map(
        groupedRooms.map((row) => [
            String(row._id),
            row,
        ])
    );

    const validHostelIds = new Set(
        hostels.map((hostel) => String(hostel._id))
    );

    // Rooms that reference a nonexistent hostel.
    const orphanRooms = groupedRooms
        .filter(
            (row) =>
                !validHostelIds.has(String(row._id))
        )
        .reduce(
            (sum, row) => sum + row.totalRooms,
            0
        );

    const rows = hostels.map((hostel) => {
        const stats = groupedByHostel.get(
            String(hostel._id)
        );

        const metrics = {
            ...emptyMetrics(),
        };

        if (stats) {
            for (const field of metricFields) {
                if (field === "provisionableSlots") continue;

                metrics[field] = stats[field] ?? 0;
            }

            metrics.provisionableSlots =
                hostel.isActive
                    ? stats.activeProvisionableSlots ?? 0
                    : 0;
        }

        return {
            id: String(hostel._id),
            name: hostel.name,
            code: hostel.code,
            location: hostel.location,
            isActive: hostel.isActive,
            ...metrics,
        };
    });

    const totals = emptyMetrics();

    for (const row of rows) {
        for (const field of metricFields) {
            totals[field] += row[field];
        }
    }

    const summary = {
        totalHostels: hostels.length,

        activeHostels: hostels.filter(
            (hostel) => hostel.isActive
        ).length,

        inactiveHostels: hostels.filter(
            (hostel) => !hostel.isActive
        ).length,

        ...totals,

        orphanRooms,
        orphanBeds: orphanBedResult[0]?.count ?? 0,
    };

    return {
        generatedAt: new Date().toISOString(),
        summary,
        hostels: rows,
    };
};
