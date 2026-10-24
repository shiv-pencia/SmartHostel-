import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../src/app.js";
import User from "../src/models/user.model.js";
import Hostel from "../src/models/hostel.model.js";
import Room from "../src/models/room.model.js";
import Bed from "../src/models/bed.model.js";
import Allocation from "../src/models/allocation.model.js";
import Complaint from "../src/models/complaint.model.js";
import RevokedToken from "../src/models/revokedToken.model.js";

let mongoServer;

const API = "/api/v1";

const csrfHeader = {
    "X-Requested-With": "XMLHttpRequest",
};

let studentCookie;
let adminCookie;

let studentUser;
let adminUser;
let hostelDoc;
let roomDoc;
let bed1Doc;
let bed2Doc;

before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await Promise.all([
        User.init(),
        Hostel.init(),
        Room.init(),
        Bed.init(),
        Allocation.init(),
        Complaint.init(),
        RevokedToken.init(),
    ]);

    adminUser = await User.create({
        name: "Report Admin",
        email: "report.admin@example.com",
        password: "AdminPass@123",
        role: "admin",
        isActive: true,
    });

    studentUser = await User.create({
        name: "Report Student",
        email: "report.student@example.com",
        password: "StudentPass@123",
        role: "student",
        isActive: true,
    });

    hostelDoc = await Hostel.create({
        name: "Manas Hostel",
        code: "MAN",
        location: "IIT Guwahati",
        genderPolicy: "male",
        isActive: true,
    });

    roomDoc = await Room.create({
        hostel: hostelDoc._id,
        roomNumber: "M-101",
        floor: 1,
        capacity: 2,
        bedCount: 2,
        roomType: "standard",
        status: "active",
    });

    bed1Doc = await Bed.create({
        room: roomDoc._id,
        bedNumber: "M-101-A",
        operationalStatus: "usable",
    });

    bed2Doc = await Bed.create({
        room: roomDoc._id,
        bedNumber: "M-101-B",
        operationalStatus: "usable",
    });

    // Create an active allocation for bed1
    await Allocation.create({
        student: studentUser._id,
        hostel: hostelDoc._id,
        room: roomDoc._id,
        bed: bed1Doc._id,
        status: "active",
        allocatedBy: adminUser._id,
    });

    // Create complaints: 1 resolved, 1 pending
    await Complaint.create({
        student: studentUser._id,
        hostel: hostelDoc._id,
        room: roomDoc._id,
        bed: bed1Doc._id,
        title: "Leaking faucet",
        description: "Bathroom faucet in M-101 is dripping continuously",
        category: "plumbing",
        priority: "medium",
        status: "resolved",
        resolvedAt: new Date(Date.now() + 3600000 * 2), // 2 hours later
    });

    await Complaint.create({
        student: studentUser._id,
        hostel: hostelDoc._id,
        room: roomDoc._id,
        bed: bed1Doc._id,
        title: "WiFi router blinking red",
        description: "No internet connectivity since morning",
        category: "internet",
        priority: "urgent",
        status: "pending",
    });

    // Login admin
    const adminLoginRes = await request(app)
        .post(`${API}/auth/login`)
        .set(csrfHeader)
        .send({
            email: "report.admin@example.com",
            password: "AdminPass@123",
        });
    adminCookie = adminLoginRes.headers["set-cookie"];

    // Login student
    const studentLoginRes = await request(app)
        .post(`${API}/auth/login`)
        .set(csrfHeader)
        .send({
            email: "report.student@example.com",
            password: "StudentPass@123",
        });
    studentCookie = studentLoginRes.headers["set-cookie"];
});

after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

test("Reports and Analytics endpoints", async (t) => {
    await t.test("Rejects unauthenticated requests to reports", async () => {
        const res = await request(app).get(`${API}/reports/overview`);
        assert.equal(res.status, 401);
    });

    await t.test("Rejects student access to occupancy report", async () => {
        const res = await request(app)
            .get(`${API}/reports/occupancy`)
            .set("Cookie", studentCookie);
        assert.equal(res.status, 403);
    });

    await t.test("Student can access overview report", async () => {
        const res = await request(app)
            .get(`${API}/reports/overview`)
            .set("Cookie", studentCookie);
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(typeof res.body.data.students.total, "number");
        assert.equal(res.body.data.occupancy.totalHostels, 1);
        assert.equal(res.body.data.occupancy.occupiedBeds, 1);
        assert.equal(res.body.data.occupancy.vacantBeds, 1);
        assert.equal(res.body.data.occupancy.occupancyRate, 50); // 1 occupied of 2 usable = 50%
        assert.equal(res.body.data.complaints.total, 2);
        assert.equal(res.body.data.complaints.open, 1);
        assert.equal(res.body.data.complaints.resolved, 1);
    });

    await t.test("Admin can retrieve occupancy report", async () => {
        const res = await request(app)
            .get(`${API}/reports/occupancy`)
            .set("Cookie", adminCookie);
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        const { summary, hostels, roomTypes } = res.body.data;
        assert.equal(summary.totalHostels, 1);
        assert.equal(summary.totalCapacity, 2);
        assert.equal(summary.provisionedBeds, 2);
        assert.equal(summary.usableBeds, 2);
        assert.equal(summary.occupiedBeds, 1);
        assert.equal(summary.vacantBeds, 1);
        assert.equal(summary.occupancyRate, 50);

        assert.equal(hostels.length, 1);
        assert.equal(hostels[0].code, "MAN");
        assert.equal(hostels[0].occupancyRate, 50);

        assert.ok(Array.isArray(roomTypes));
    });

    await t.test("Admin can filter occupancy report by hostelId", async () => {
        const res = await request(app)
            .get(`${API}/reports/occupancy?hostelId=${hostelDoc._id}`)
            .set("Cookie", adminCookie);
        assert.equal(res.status, 200);
        assert.equal(res.body.data.hostels.length, 1);
        assert.equal(res.body.data.hostels[0].name, "Manas Hostel");
    });

    await t.test("Admin can retrieve complaint analytics", async () => {
        const res = await request(app)
            .get(`${API}/reports/complaints`)
            .set("Cookie", adminCookie);
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        const { summary, statusBreakdown, categoryBreakdown, priorityBreakdown } =
            res.body.data;

        assert.equal(summary.totalComplaints, 2);
        assert.equal(summary.openComplaints, 1);
        assert.equal(summary.resolvedComplaints, 1);
        assert.equal(summary.urgentComplaints, 1);
        assert.equal(summary.resolutionRate, 50);
        assert.ok(summary.avgResolutionHours >= 0);

        const plumbing = categoryBreakdown.find((c) => c.category === "plumbing");
        assert.ok(plumbing);
        assert.equal(plumbing.count, 1);

        const internet = categoryBreakdown.find((c) => c.category === "internet");
        assert.ok(internet);
        assert.equal(internet.count, 1);

        const resolved = statusBreakdown.find((s) => s.status === "resolved");
        assert.ok(resolved);
        assert.equal(resolved.count, 1);
    });
});
