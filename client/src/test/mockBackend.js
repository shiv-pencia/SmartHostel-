
import MockAdapter from "axios-mock-adapter";

import httpClient from "../api/httpClient.js";

export const adminFixture = {
    id: "507f1f77bcf86cd799439011",
    name: "Admin User",
    email: "admin@example.com",
    phone: "9876543210",
    role: "admin",
    isActive: true,
};

export const studentFixture = {
    id: "507f191e810c19729de860ea",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    phone: "9876543211",
    role: "student",
    isActive: true,
};

export const wardenFixture = {
    id: "507f1f77bcf86cd799439012",
    name: "Priya Singh",
    email: "priya@example.com",
    phone: "9876543212",
    role: "warden",
    isActive: true,
};

export const staffFixture = {
    id: "507f1f77bcf86cd799439013",
    name: "Mohan Kumar",
    email: "mohan@example.com",
    phone: "9876543213",
    role: "staff",
    isActive: true,
};

const success = (data, message = "Success") => ({
    success: true,
    message,
    data,
});

const failure = (message) => ({
    success: false,
    message,
});

export function createMockBackend({
    session = null,
    accounts = [
        adminFixture,
        studentFixture,
        wardenFixture,
        staffFixture,
    ],
} = {}) {
    const mock = new MockAdapter(httpClient, {
        onNoMatch: "throwException",
    });

    const users = accounts.map((user) => ({ ...user }));

    let currentSession = session
        ? { ...session }
        : null;

    const findUser = (id) =>
        users.find((user) => user.id === id);

    const requireAdmin = () => {
        return currentSession?.role === "admin";
    };

    /*
     * AUTHENTICATION
     */

    mock.onGet("/auth/me").reply(() => {
        if (!currentSession || !currentSession.isActive) {
            return [
                401,
                failure("Authentication required. Please login."),
            ];
        }

        return [
            200,
            success({ user: currentSession }),
        ];
    });

    mock.onPost("/auth/login").reply((config) => {
        const credentials = JSON.parse(config.data);

        const account = users.find(
            (user) =>
                user.email === credentials.email &&
                user.isActive
        );

        // Simulated test password for fixture accounts.
        if (
            !account ||
            credentials.password !== "TestPass@123"
        ) {
            return [
                401,
                failure("Invalid email or password"),
            ];
        }

        currentSession = { ...account };

        return [
            200,
            success(
                { user: currentSession },
                "Login successful"
            ),
        ];
    });

    mock.onPost("/auth/register").reply((config) => {
        const payload = JSON.parse(config.data);

        if (
            users.some(
                (user) => user.email === payload.email
            )
        ) {
            return [
                409,
                failure("Email is already registered"),
            ];
        }

        const newUser = {
            id: `test-user-${users.length + 1}`,
            name: payload.name,
            email: payload.email,
            phone: payload.phone ?? null,
            role: "student",
            isActive: true,
        };

        users.push(newUser);

        return [
            201,
            success(
                { user: newUser },
                "Student registered successfully"
            ),
        ];
    });

    mock.onPost("/auth/logout").reply(() => {
        currentSession = null;

        return [
            200,
            success(null, "Logout successful"),
        ];
    });

    /*
     * USER MANAGEMENT
     */

    mock.onGet("/users").reply((config) => {
        if (!requireAdmin()) {
            return [403, failure("Forbidden")];
        }

        const {
            page = 1,
            limit = 10,
            search = "",
            role = "",
            status = "",
        } = config.params ?? {};

        let filtered = [...users];

        if (search) {
            const term = String(search).toLowerCase();

            filtered = filtered.filter(
                (user) =>
                    user.name.toLowerCase().includes(term) ||
                    user.email.toLowerCase().includes(term)
            );
        }

        if (role) {
            filtered = filtered.filter(
                (user) => user.role === role
            );
        }

        if (status) {
            filtered = filtered.filter(
                (user) =>
                    user.isActive === (status === "active")
            );
        }

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        const start = (pageNumber - 1) * pageSize;
        const pageUsers = filtered.slice(
            start,
            start + pageSize
        );

        return [
            200,
            {
                success: true,
                message: "Users retrieved successfully",
                data: pageUsers,
                meta: {
                    page: pageNumber,
                    limit: pageSize,
                    total: filtered.length,
                    totalPages: Math.ceil(
                        filtered.length / pageSize
                    ),
                },
            },
        ];
    });

    mock.onGet(/^\/users\/[^/]+$/).reply((config) => {
        if (!requireAdmin()) {
            return [403, failure("Forbidden")];
        }

        const id = decodeURIComponent(
            config.url.split("/")[2]
        );

        const user = findUser(id);

        return user
            ? [200, success({ user })]
            : [404, failure("User not found")];
    });

    mock.onPatch(/^\/users\/[^/]+$/).reply((config) => {
        if (!requireAdmin()) {
            return [403, failure("Forbidden")];
        }

        const id = decodeURIComponent(
            config.url.split("/")[2]
        );

        const user = findUser(id);

        if (!user) {
            return [404, failure("User not found")];
        }

        const data = JSON.parse(config.data);

        if (data.name !== undefined) {
            user.name = data.name;
        }

        if (data.phone !== undefined) {
            user.phone = data.phone;
        }

        if (currentSession?.id === user.id) {
            currentSession = { ...user };
        }

        return [
            200,
            success({ user }, "User updated successfully"),
        ];
    });

    mock.onPatch(/^\/users\/[^/]+\/role$/).reply(
        (config) => {
            if (!requireAdmin()) {
                return [403, failure("Forbidden")];
            }

            const id = config.url.split("/")[2];
            const user = findUser(id);

            if (!user) {
                return [404, failure("User not found")];
            }

            const { role } = JSON.parse(config.data);

            if (
                user.role === "admin" ||
                role === "admin"
            ) {
                return [
                    403,
                    failure("Administrator role assignment is restricted"),
                ];
            }

            user.role = role;

            return [
                200,
                success({ user }, "User role updated successfully"),
            ];
        }
    );

    mock.onPatch(/^\/users\/[^/]+\/status$/).reply(
        (config) => {
            if (!requireAdmin()) {
                return [403, failure("Forbidden")];
            }

            const id = config.url.split("/")[2];
            const user = findUser(id);

            if (!user) {
                return [404, failure("User not found")];
            }

            if (user.role === "admin") {
                return [
                    403,
                    failure(
                        "Administrator account status cannot be changed here"
                    ),
                ];
            }

            const { isActive } = JSON.parse(config.data);

            user.isActive = isActive;

            return [
                200,
                success(
                    { user },
                    "User status updated successfully"
                ),
            ];
        }
    );

    /*
     * Allocation Mock Handlers
     */
    let allocations = [
        {
            id: "alloc-1",
            student: studentFixture,
            hostel: { id: "hostel-1", name: "Brahmaputra Hostel", code: "BRH" },
            room: { id: "room-1", roomNumber: "101", floor: 1, roomType: "standard" },
            bed: { id: "bed-1", bedNumber: "B1", operationalStatus: "usable" },
            status: "active",
            allocatedAt: new Date().toISOString(),
            allocatedBy: adminFixture,
        },
    ];

    let vacantBeds = [
        {
            id: "bed-2",
            bedNumber: "B2",
            operationalStatus: "usable",
            room: { id: "room-1", roomNumber: "101", floor: 1, roomType: "standard" },
            hostel: { id: "hostel-1", name: "Brahmaputra Hostel", code: "BRH" },
        },
    ];

    mock.onGet("/allocations/vacancies").reply(() => {
        if (!requireAdmin()) {
            return [403, failure("Forbidden")];
        }
        return [200, success(vacantBeds, "Vacant beds fetched successfully")];
    });

    mock.onGet("/allocations").reply(() => {
        if (!requireAdmin()) {
            return [403, failure("Forbidden")];
        }
        return [200, success(allocations, "Allocations fetched successfully")];
    });

    mock.onGet("/allocations/my").reply(() => {
        if (!currentSession) {
            return [401, failure("Unauthorized")];
        }
        const myAlloc = allocations.find(
            (a) => a.student?.id === currentSession.id && a.status === "active"
        );
        return [200, success(myAlloc ?? null, "My allocation fetched")];
    });

    mock.onPost("/allocations").reply((config) => {
        if (!requireAdmin()) {
            return [403, failure("Forbidden")];
        }
        const data = JSON.parse(config.data);
        const newAlloc = {
            id: `alloc-${allocations.length + 1}`,
            student: users.find((u) => u.id === data.studentId) ?? studentFixture,
            hostel: { id: data.hostelId, name: "Brahmaputra Hostel", code: "BRH" },
            room: { id: data.roomId, roomNumber: "101", floor: 1, roomType: "standard" },
            bed: { id: data.bedId, bedNumber: "B2", operationalStatus: "usable" },
            status: "active",
            allocatedAt: new Date().toISOString(),
            allocatedBy: currentSession,
        };
        allocations.push(newAlloc);
        vacantBeds = vacantBeds.filter((b) => b.id !== data.bedId);
        return [201, success(newAlloc, "Student allocated successfully")];
    });

    mock.onPatch(/^\/allocations\/[^/]+\/vacate$/).reply((config) => {
        if (!requireAdmin()) {
            return [403, failure("Forbidden")];
        }
        const id = config.url.split("/")[2];
        const alloc = allocations.find((a) => a.id === id);
        if (!alloc) {
            return [404, failure("Allocation not found")];
        }
        alloc.status = "vacated";
        alloc.vacatedAt = new Date().toISOString();
        return [200, success(alloc, "Allocation vacated successfully")];
    });

    /*
     * Complaint Mock Handlers
     */
    let complaints = [
        {
            id: "complaint-1",
            title: "Fan not working",
            description: "Ceiling fan stopped spinning last night.",
            category: "electrical",
            priority: "high",
            status: "pending",
            student: studentFixture,
            hostel: { id: "hostel-1", name: "Brahmaputra Hostel", code: "BRH" },
            room: { id: "room-1", roomNumber: "101", floor: 1 },
            assignedTo: null,
            resolutionNotes: null,
            createdAt: new Date().toISOString(),
        },
    ];

    mock.onGet("/complaints").reply((config) => {
        if (!currentSession) return [401, failure("Unauthorized")];
        let list = [...complaints];
        if (currentSession.role === "student") {
            list = list.filter((c) => c.student?.id === currentSession.id);
        } else if (currentSession.role === "staff") {
            list = list.filter((c) => c.assignedTo?.id === currentSession.id);
        }
        return [200, success(list, "Complaints fetched")];
    });

    mock.onGet("/complaints/stats").reply(() => {
        return [
            200,
            success({
                total: complaints.length,
                byStatus: {
                    pending: complaints.filter((c) => c.status === "pending").length,
                    assigned: complaints.filter((c) => c.status === "assigned").length,
                    in_progress: complaints.filter((c) => c.status === "in_progress").length,
                    resolved: complaints.filter((c) => c.status === "resolved").length,
                },
            }),
        ];
    });

    mock.onPost("/complaints").reply((config) => {
        if (!currentSession) return [401, failure("Unauthorized")];
        const data = JSON.parse(config.data);
        const newComplaint = {
            id: `complaint-${complaints.length + 1}`,
            title: data.title,
            description: data.description,
            category: data.category,
            priority: data.priority ?? "medium",
            status: "pending",
            student: currentSession,
            hostel: { id: "hostel-1", name: "Brahmaputra Hostel", code: "BRH" },
            room: { id: "room-1", roomNumber: "101", floor: 1 },
            assignedTo: null,
            resolutionNotes: null,
            createdAt: new Date().toISOString(),
        };
        complaints.push(newComplaint);
        return [201, success(newComplaint, "Complaint registered successfully")];
    });

    mock.onPatch(/^\/complaints\/[^/]+\/assign$/).reply((config) => {
        if (!requireAdmin()) return [403, failure("Forbidden")];
        const id = config.url.split("/")[2];
        const data = JSON.parse(config.data);
        const complaint = complaints.find((c) => c.id === id);
        if (!complaint) return [404, failure("Complaint not found")];
        const staff = users.find((u) => u.id === data.staffId) ?? staffFixture;
        complaint.assignedTo = staff;
        complaint.status = "assigned";
        return [200, success(complaint, "Staff assigned successfully")];
    });

    mock.onPatch(/^\/complaints\/[^/]+\/status$/).reply((config) => {
        if (!currentSession) return [401, failure("Unauthorized")];
        const id = config.url.split("/")[2];
        const data = JSON.parse(config.data);
        const complaint = complaints.find((c) => c.id === id);
        if (!complaint) return [404, failure("Complaint not found")];
        complaint.status = data.status;
        if (data.resolutionNotes) {
            complaint.resolutionNotes = data.resolutionNotes;
        }
        return [200, success(complaint, "Status updated successfully")];
    });

    /*
     * REPORTS AND ANALYTICS
     */
    mock.onGet("/reports/overview").reply(() => {
        const studentCount = users.filter((u) => u.role === "student").length;
        const activeAllocationsCount = allocations.filter((a) => a.status === "active").length;
        return [
            200,
            success({
                students: {
                    total: studentCount,
                    allocated: activeAllocationsCount,
                    unallocated: Math.max(0, studentCount - activeAllocationsCount),
                    allocationRate: studentCount > 0 ? (activeAllocationsCount / studentCount) * 100 : 0,
                },
                occupancy: {
                    totalHostels: 2,
                    totalRooms: 5,
                    totalCapacity: 10,
                    usableBeds: 8,
                    occupiedBeds: activeAllocationsCount,
                    vacantBeds: Math.max(0, 8 - activeAllocationsCount),
                    maintenanceBeds: 1,
                    occupancyRate: 12.5,
                },
                complaints: {
                    total: complaints.length,
                    open: complaints.filter((c) => c.status !== "resolved").length,
                    resolved: complaints.filter((c) => c.status === "resolved").length,
                    urgent: complaints.filter((c) => c.priority === "urgent").length,
                    resolutionRate: complaints.length > 0
                        ? (complaints.filter((c) => c.status === "resolved").length / complaints.length) * 100
                        : 0,
                },
                recentAllocations: [],
                recentComplaints: [],
            }),
        ];
    });

    mock.onGet(/\/reports\/occupancy.*/).reply(() => {
        return [
            200,
            success({
                generatedAt: new Date().toISOString(),
                summary: {
                    totalHostels: 2,
                    totalRooms: 5,
                    totalCapacity: 10,
                    provisionedBeds: 8,
                    usableBeds: 8,
                    occupiedBeds: 1,
                    vacantBeds: 7,
                    maintenanceBeds: 0,
                    inactiveBeds: 0,
                    occupancyRate: 12.5,
                },
                hostels: [
                    {
                        hostelId: "hostel-1",
                        name: "Brahmaputra Hostel",
                        code: "BRH",
                        location: "Zone A",
                        isActive: true,
                        totalRooms: 3,
                        totalCapacity: 6,
                        provisionedBeds: 5,
                        usableBeds: 5,
                        occupiedBeds: 1,
                        vacantBeds: 4,
                        maintenanceBeds: 0,
                        inactiveBeds: 0,
                        occupancyRate: 20.0,
                    },
                ],
                roomTypes: [
                    {
                        key: "single",
                        label: "Single Room",
                        totalRooms: 1,
                        totalCapacity: 1,
                        usableBeds: 1,
                        occupiedBeds: 0,
                        vacantBeds: 1,
                        occupancyRate: 0,
                    },
                    {
                        key: "double",
                        label: "Double Room",
                        totalRooms: 2,
                        totalCapacity: 4,
                        usableBeds: 4,
                        occupiedBeds: 1,
                        vacantBeds: 3,
                        occupancyRate: 25.0,
                    },
                ],
            }),
        ];
    });

    mock.onGet(/\/reports\/complaints.*/).reply(() => {
        return [
            200,
            success({
                generatedAt: new Date().toISOString(),
                summary: {
                    totalComplaints: 1,
                    openComplaints: 1,
                    resolvedComplaints: 0,
                    rejectedComplaints: 0,
                    urgentComplaints: 0,
                    resolutionRate: 0,
                    avgResolutionHours: 0,
                },
                statusBreakdown: [
                    { status: "pending", count: 1, percentage: 100 },
                    { status: "assigned", count: 0, percentage: 0 },
                    { status: "in_progress", count: 0, percentage: 0 },
                    { status: "resolved", count: 0, percentage: 0 },
                ],
                categoryBreakdown: [
                    { category: "electrical", count: 1, percentage: 100 },
                    { category: "plumbing", count: 0, percentage: 0 },
                ],
                priorityBreakdown: [
                    { priority: "high", count: 1, percentage: 100 },
                    { priority: "medium", count: 0, percentage: 0 },
                ],
                hostelBreakdown: [
                    {
                        hostelId: "hostel-1",
                        hostelName: "Brahmaputra Hostel",
                        total: 1,
                        open: 1,
                        resolved: 0,
                        resolutionRate: 0,
                    },
                ],
            }),
        ];
    });

    mock.onGet("/reports/inventory").reply(() => {
        return [
            200,
            success({
                generatedAt: new Date().toISOString(),
                summary: {
                    totalHostels: 2,
                    activeHostels: 2,
                    inactiveHostels: 0,
                    totalRooms: 5,
                    activeRooms: 5,
                    maintenanceRooms: 0,
                    inactiveRooms: 0,
                    totalCapacity: 10,
                    provisionedBeds: 8,
                    usableBeds: 8,
                    maintenanceBeds: 0,
                    inactiveBeds: 0,
                    unprovisionedSlots: 2,
                    provisionableSlots: 2,
                    counterMismatchRooms: 0,
                    overCapacityRooms: 0,
                    orphanRooms: 0,
                    orphanBeds: 0,
                },
                hostels: [
                    {
                        id: "hostel-1",
                        name: "Brahmaputra Hostel",
                        code: "BRH",
                        location: "Zone A",
                        isActive: true,
                        totalRooms: 3,
                        totalCapacity: 6,
                        provisionedBeds: 5,
                        usableBeds: 5,
                        maintenanceBeds: 0,
                        unprovisionedSlots: 1,
                        provisionableSlots: 1,
                    },
                ],
            }),
        ];
    });

    return {
        mock,
        users,
        allocations,
        vacantBeds,
        getSession: () => currentSession,
    };
}
