import Hostel from "../models/hostel.model.js";
import Room from "../models/room.model.js";
import Bed from "../models/bed.model.js";
import Allocation from "../models/allocation.model.js";
import Complaint from "../models/complaint.model.js";
import User from "../models/user.model.js";

/**
 * Helper to calculate percentage safely.
 */
const calcPercentage = (numerator, denominator) => {
    if (!denominator || denominator <= 0) return 0;
    return Number(((numerator / denominator) * 100).toFixed(1));
};

/**
 * GET OCCUPANCY REPORT
 * Aggregates room capacity, provisioned beds, usable beds,
 * active student allocations, and computes occupancy rates overall,
 * by hostel, and by room capacity types.
 */
export const getOccupancyReport = async ({ hostelId } = {}) => {
    const hostelQuery = {};
    if (hostelId) {
        hostelQuery._id = hostelId;
    }

    const hostels = await Hostel.find(hostelQuery)
        .select("name code location capacity isActive")
        .sort({ name: 1 })
        .lean();

    const targetHostelIds = hostels.map((h) => h._id);

    // Fetch rooms for these hostels
    const rooms = await Room.find({ hostel: { $in: targetHostelIds } })
        .select("hostel roomNumber floor capacity bedCount roomType status")
        .lean();

    const roomIds = rooms.map((r) => r._id);

    // Fetch all beds in these rooms
    const beds = await Bed.find({ room: { $in: roomIds } })
        .select("room bedNumber operationalStatus")
        .lean();

    // Fetch all active allocations in these hostels
    const activeAllocations = await Allocation.find({
        hostel: { $in: targetHostelIds },
        status: "active",
    })
        .select("student hostel room bed allocatedAt")
        .lean();

    // Map beds by room
    const bedsByRoom = new Map();
    for (const bed of beds) {
        const roomIdStr = String(bed.room);
        if (!bedsByRoom.has(roomIdStr)) {
            bedsByRoom.set(roomIdStr, []);
        }
        bedsByRoom.get(roomIdStr).push(bed);
    }

    // Map rooms by hostel
    const roomsByHostel = new Map();
    for (const room of rooms) {
        const hostelIdStr = String(room.hostel);
        if (!roomsByHostel.has(hostelIdStr)) {
            roomsByHostel.set(hostelIdStr, []);
        }
        roomsByHostel.get(hostelIdStr).push(room);
    }

    // Map active allocations by hostel
    const allocationsByHostel = new Map();
    for (const alloc of activeAllocations) {
        const hostelIdStr = String(alloc.hostel);
        if (!allocationsByHostel.has(hostelIdStr)) {
            allocationsByHostel.set(hostelIdStr, []);
        }
        allocationsByHostel.get(hostelIdStr).push(alloc);
    }

    // Build hostel breakdowns
    const hostelBreakdown = hostels.map((hostel) => {
        const hostelIdStr = String(hostel._id);
        const hostelRooms = roomsByHostel.get(hostelIdStr) || [];
        const hostelAllocations = allocationsByHostel.get(hostelIdStr) || [];

        let totalCapacity = 0;
        let provisionedBeds = 0;
        let usableBeds = 0;
        let maintenanceBeds = 0;
        let inactiveBeds = 0;

        for (const room of hostelRooms) {
            totalCapacity += room.capacity;
            const roomBeds = bedsByRoom.get(String(room._id)) || [];
            provisionedBeds += roomBeds.length;

            for (const b of roomBeds) {
                if (b.operationalStatus === "usable") usableBeds++;
                else if (b.operationalStatus === "maintenance") maintenanceBeds++;
                else if (b.operationalStatus === "inactive") inactiveBeds++;
            }
        }

        const occupiedBeds = hostelAllocations.length;
        const vacantBeds = Math.max(0, usableBeds - occupiedBeds);
        const occupancyRate = calcPercentage(occupiedBeds, usableBeds);

        return {
            hostelId: hostelIdStr,
            name: hostel.name,
            code: hostel.code,
            location: hostel.location,
            isActive: hostel.isActive,
            totalRooms: hostelRooms.length,
            totalCapacity,
            provisionedBeds,
            usableBeds,
            occupiedBeds,
            vacantBeds,
            maintenanceBeds,
            inactiveBeds,
            occupancyRate,
        };
    });

    // Room capacity breakdown: Single (1), Double (2), Triple (3), Dormitory (4+)
    const roomTypeCategories = [
        { key: "single", label: "Single Room", capacity: 1 },
        { key: "double", label: "Double Room", capacity: 2 },
        { key: "triple", label: "Triple Room", capacity: 3 },
        { key: "dormitory", label: "Dormitory (4+)", minCapacity: 4 },
    ];

    const roomTypeBreakdown = roomTypeCategories.map((cat) => {
        const matchingRooms = rooms.filter((r) => {
            if (cat.minCapacity) return r.capacity >= cat.minCapacity;
            return r.capacity === cat.capacity;
        });

        const matchingRoomIds = new Set(matchingRooms.map((r) => String(r._id)));
        let catTotalCapacity = 0;
        let catUsableBeds = 0;

        for (const r of matchingRooms) {
            catTotalCapacity += r.capacity;
            const rBeds = bedsByRoom.get(String(r._id)) || [];
            for (const b of rBeds) {
                if (b.operationalStatus === "usable") catUsableBeds++;
            }
        }

        const catOccupied = activeAllocations.filter((a) =>
            matchingRoomIds.has(String(a.room))
        ).length;

        const catVacant = Math.max(0, catUsableBeds - catOccupied);
        const catOccupancyRate = calcPercentage(catOccupied, catUsableBeds);

        return {
            key: cat.key,
            label: cat.label,
            totalRooms: matchingRooms.length,
            totalCapacity: catTotalCapacity,
            usableBeds: catUsableBeds,
            occupiedBeds: catOccupied,
            vacantBeds: catVacant,
            occupancyRate: catOccupancyRate,
        };
    });

    // Overall summary totals
    let totalRooms = 0;
    let totalCapacity = 0;
    let provisionedBeds = 0;
    let usableBeds = 0;
    let maintenanceBeds = 0;
    let inactiveBeds = 0;

    for (const row of hostelBreakdown) {
        totalRooms += row.totalRooms;
        totalCapacity += row.totalCapacity;
        provisionedBeds += row.provisionedBeds;
        usableBeds += row.usableBeds;
        maintenanceBeds += row.maintenanceBeds;
        inactiveBeds += row.inactiveBeds;
    }

    const totalOccupied = activeAllocations.length;
    const totalVacant = Math.max(0, usableBeds - totalOccupied);
    const overallOccupancyRate = calcPercentage(totalOccupied, usableBeds);

    return {
        generatedAt: new Date().toISOString(),
        summary: {
            totalHostels: hostels.length,
            totalRooms,
            totalCapacity,
            provisionedBeds,
            usableBeds,
            occupiedBeds: totalOccupied,
            vacantBeds: totalVacant,
            maintenanceBeds,
            inactiveBeds,
            occupancyRate: overallOccupancyRate,
        },
        hostels: hostelBreakdown,
        roomTypes: roomTypeBreakdown,
    };
};

/**
 * GET COMPLAINT ANALYTICS
 * Aggregates grievances by status, category, priority,
 * calculates resolution rate, and computes average turnaround time.
 */
export const getComplaintAnalytics = async ({
    hostelId,
    startDate,
    endDate,
} = {}) => {
    const filter = {};

    if (hostelId) {
        filter.hostel = hostelId;
    }

    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            filter.createdAt.$lte = new Date(endDate);
        }
    }

    const complaints = await Complaint.find(filter)
        .populate("hostel", "name code")
        .lean();

    const totalComplaints = complaints.length;

    // Status breakdown
    const statusCounts = {
        pending: 0,
        assigned: 0,
        in_progress: 0,
        resolved: 0,
        rejected: 0,
    };

    // Category breakdown
    const categoryCounts = {
        plumbing: 0,
        electrical: 0,
        carpentry: 0,
        cleaning: 0,
        internet: 0,
        furniture: 0,
        other: 0,
    };

    // Priority breakdown
    const priorityCounts = {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0,
    };

    // Hostel breakdown mapping
    const hostelComplaintMap = new Map();

    let totalResolutionHours = 0;
    let resolvedWithTimestampsCount = 0;

    for (const c of complaints) {
        // Status count
        if (statusCounts[c.status] !== undefined) {
            statusCounts[c.status]++;
        }

        // Category count
        if (categoryCounts[c.category] !== undefined) {
            categoryCounts[c.category]++;
        } else {
            categoryCounts.other = (categoryCounts.other || 0) + 1;
        }

        // Priority count
        if (priorityCounts[c.priority] !== undefined) {
            priorityCounts[c.priority]++;
        }

        // Resolution turnaround time
        if (c.status === "resolved" && c.resolvedAt && c.createdAt) {
            const diffMs = new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime();
            if (diffMs >= 0) {
                totalResolutionHours += diffMs / (1000 * 60 * 60);
                resolvedWithTimestampsCount++;
            }
        }

        // Hostel aggregation
        const hostelIdStr = c.hostel ? String(c.hostel._id || c.hostel) : "unassigned";
        const hostelName = c.hostel?.name || "General / Unassigned";

        if (!hostelComplaintMap.has(hostelIdStr)) {
            hostelComplaintMap.set(hostelIdStr, {
                hostelId: hostelIdStr,
                hostelName,
                total: 0,
                open: 0,
                resolved: 0,
            });
        }

        const entry = hostelComplaintMap.get(hostelIdStr);
        entry.total++;
        if (c.status === "resolved") {
            entry.resolved++;
        } else if (["pending", "assigned", "in_progress"].includes(c.status)) {
            entry.open++;
        }
    }

    const openComplaints =
        statusCounts.pending + statusCounts.assigned + statusCounts.in_progress;
    const resolvedComplaints = statusCounts.resolved;
    const resolutionRate = calcPercentage(resolvedComplaints, totalComplaints);

    const avgResolutionHours =
        resolvedWithTimestampsCount > 0
            ? Number((totalResolutionHours / resolvedWithTimestampsCount).toFixed(1))
            : 0;

    // Convert breakdown objects to formatted arrays with percentages
    const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: calcPercentage(count, totalComplaints),
    }));

    const categoryBreakdown = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
        percentage: calcPercentage(count, totalComplaints),
    }));

    const priorityBreakdown = Object.entries(priorityCounts).map(([priority, count]) => ({
        priority,
        count,
        percentage: calcPercentage(count, totalComplaints),
    }));

    const hostelBreakdown = Array.from(hostelComplaintMap.values()).map((h) => ({
        ...h,
        resolutionRate: calcPercentage(h.resolved, h.total),
    }));

    return {
        generatedAt: new Date().toISOString(),
        summary: {
            totalComplaints,
            openComplaints,
            resolvedComplaints,
            rejectedComplaints: statusCounts.rejected,
            urgentComplaints: priorityCounts.urgent,
            resolutionRate,
            avgResolutionHours,
        },
        statusBreakdown,
        categoryBreakdown,
        priorityBreakdown,
        hostelBreakdown,
    };
};

/**
 * GET DASHBOARD OVERVIEW
 * Consolidated operational KPIs and recent activities for
 * the unified admin/warden dashboard.
 */
export const getDashboardOverview = async () => {
    const [
        totalStudents,
        activeAllocationsCount,
        totalHostels,
        totalRooms,
        roomsCapacityResult,
        usableBeds,
        maintenanceBeds,
        totalComplaints,
        openComplaints,
        resolvedComplaints,
        urgentComplaints,
        recentAllocations,
        recentComplaints,
    ] = await Promise.all([
        User.countDocuments({ role: "student" }),
        Allocation.countDocuments({ status: "active" }),
        Hostel.countDocuments({ isActive: true }),
        Room.countDocuments({ status: "active" }),
        Room.aggregate([
            { $group: { _id: null, totalCapacity: { $sum: "$capacity" } } },
        ]),
        Bed.countDocuments({ operationalStatus: "usable" }),
        Bed.countDocuments({ operationalStatus: "maintenance" }),
        Complaint.countDocuments(),
        Complaint.countDocuments({
            status: { $in: ["pending", "assigned", "in_progress"] },
        }),
        Complaint.countDocuments({ status: "resolved" }),
        Complaint.countDocuments({
            priority: "urgent",
            status: { $in: ["pending", "assigned", "in_progress"] },
        }),
        Allocation.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("student", "name email")
            .populate("hostel", "name code")
            .populate("room", "roomNumber")
            .populate("bed", "bedNumber")
            .lean(),
        Complaint.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("student", "name email")
            .populate("hostel", "name code")
            .populate("room", "roomNumber")
            .populate("bed", "bedNumber")
            .lean(),
    ]);

    const totalCapacity = roomsCapacityResult[0]?.totalCapacity ?? 0;
    const occupiedBeds = activeAllocationsCount;
    const vacantBeds = Math.max(0, usableBeds - occupiedBeds);
    const occupancyRate = calcPercentage(occupiedBeds, usableBeds);
    const unallocatedStudents = Math.max(0, totalStudents - occupiedBeds);
    const complaintResolutionRate = calcPercentage(resolvedComplaints, totalComplaints);

    return {
        generatedAt: new Date().toISOString(),
        students: {
            total: totalStudents,
            allocated: occupiedBeds,
            unallocated: unallocatedStudents,
            allocationRate: calcPercentage(occupiedBeds, totalStudents),
        },
        occupancy: {
            totalHostels,
            totalRooms,
            totalCapacity,
            usableBeds,
            occupiedBeds,
            vacantBeds,
            maintenanceBeds,
            occupancyRate,
        },
        complaints: {
            total: totalComplaints,
            open: openComplaints,
            resolved: resolvedComplaints,
            urgent: urgentComplaints,
            resolutionRate: complaintResolutionRate,
        },
        recentAllocations: recentAllocations.map((a) => ({
            id: String(a._id),
            studentName: a.student?.name || "Unknown",
            studentEmail: a.student?.email || "",
            hostelName: a.hostel?.name || "Unknown",
            roomNumber: a.room?.roomNumber || "-",
            bedNumber: a.bed?.bedNumber || "-",
            status: a.status,
            allocatedAt: a.allocatedAt,
        })),
        recentComplaints: recentComplaints.map((c) => ({
            id: String(c._id),
            title: c.title,
            category: c.category,
            priority: c.priority,
            status: c.status,
            studentName: c.student?.name || "Unknown",
            hostelName: c.hostel?.name || "General",
            roomNumber: c.room?.roomNumber || "-",
            bedNumber: c.bed?.bedNumber || "-",
            createdAt: c.createdAt,
        })),
    };
};
