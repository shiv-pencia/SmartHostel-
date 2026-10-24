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
import Complaint from "../src/models/complaint.model.js";
import RevokedToken from "../src/models/revokedToken.model.js";

let mongoServer;

const API = "/api/v1";

const csrfHeader = {
    "X-Requested-With": "XMLHttpRequest",
};

let studentCookie;
let adminCookie;
let staffCookie;

let studentUser;
let adminUser;
let staffUser;
let hostelDoc;
let roomDoc;
let complaintId;

before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await Promise.all([
        User.init(),
        Hostel.init(),
        Room.init(),
        Bed.init(),
        Complaint.init(),
        RevokedToken.init(),
    ]);

    adminUser = await User.create({
        name: "Admin User",
        email: "complaint.admin@example.com",
        password: "AdminPass@123",
        role: "admin",
        isActive: true,
    });

    studentUser = await User.create({
        name: "Student User",
        email: "complaint.student@example.com",
        password: "StudentPass@123",
        role: "student",
        isActive: true,
    });

    staffUser = await User.create({
        name: "Plumber Joe",
        email: "complaint.staff@example.com",
        password: "StaffPass@123",
        role: "staff",
        isActive: true,
    });

    hostelDoc = await Hostel.create({
        name: "Kapili Hostel",
        code: "KAP",
        location: "Campus",
        genderPolicy: "male",
        isActive: true,
    });

    roomDoc = await Room.create({
        hostel: hostelDoc._id,
        roomNumber: "201",
        floor: 2,
        capacity: 2,
        status: "active",
    });

    // Helper to log in and return cookie
    const login = async (email, password) => {
        const res = await request(app)
            .post(`${API}/auth/login`)
            .set(csrfHeader)
            .send({ email, password });
        return res.headers["set-cookie"]
            ?.find((c) => c.startsWith("accessToken="))
            ?.split(";")[0];
    };

    adminCookie = await login("complaint.admin@example.com", "AdminPass@123");
    studentCookie = await login("complaint.student@example.com", "StudentPass@123");
    staffCookie = await login("complaint.staff@example.com", "StaffPass@123");
});

after(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

test("Complaint Management workflow and lifecycle", async (t) => {
    await t.test("Student registers a valid complaint", async () => {
        const res = await request(app)
            .post(`${API}/complaints`)
            .set("Cookie", studentCookie)
            .set(csrfHeader)
            .send({
                title: "Water leakage in bathroom",
                description: "The sink pipe has been leaking continuously since morning.",
                category: "plumbing",
                priority: "high",
                hostelId: hostelDoc._id.toString(),
                roomId: roomDoc._id.toString(),
            });

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.status, "pending");
        assert.equal(res.body.data.category, "plumbing");
        assert.equal(res.body.data.priority, "high");

        complaintId = res.body.data.id;
        assert.ok(complaintId);
    });

    await t.test("Rejects complaint with missing required fields", async () => {
        const res = await request(app)
            .post(`${API}/complaints`)
            .set("Cookie", studentCookie)
            .set(csrfHeader)
            .send({
                title: "Bad",
                // description missing
                category: "invalid_category",
            });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
    });

    await t.test("Student sees their submitted complaint in list", async () => {
        const res = await request(app)
            .get(`${API}/complaints`)
            .set("Cookie", studentCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.length, 1);
        assert.equal(res.body.data[0].id, complaintId);
    });

    await t.test("Admin can view stats and assign staff member", async () => {
        const statsRes = await request(app)
            .get(`${API}/complaints/stats`)
            .set("Cookie", adminCookie);

        assert.equal(statsRes.status, 200);
        assert.equal(statsRes.body.data.total, 1);
        assert.equal(statsRes.body.data.byStatus.pending, 1);

        const assignRes = await request(app)
            .patch(`${API}/complaints/${complaintId}/assign`)
            .set("Cookie", adminCookie)
            .set(csrfHeader)
            .send({
                staffId: staffUser._id.toString(),
            });

        assert.equal(assignRes.status, 200);
        assert.equal(assignRes.body.data.status, "assigned");
        assert.equal(assignRes.body.data.assignedTo.id, staffUser._id.toString());
    });

    await t.test("Student cannot assign staff to complaint", async () => {
        const res = await request(app)
            .patch(`${API}/complaints/${complaintId}/assign`)
            .set("Cookie", studentCookie)
            .set(csrfHeader)
            .send({
                staffId: staffUser._id.toString(),
            });

        assert.equal(res.status, 403);
    });

    await t.test("Staff sees assigned task in list", async () => {
        const res = await request(app)
            .get(`${API}/complaints`)
            .set("Cookie", staffCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.data.length, 1);
        assert.equal(res.body.data[0].id, complaintId);
    });

    await t.test("Staff updates complaint to in_progress then resolved", async () => {
        const progressRes = await request(app)
            .patch(`${API}/complaints/${complaintId}/status`)
            .set("Cookie", staffCookie)
            .set(csrfHeader)
            .send({
                status: "in_progress",
            });

        assert.equal(progressRes.status, 200);
        assert.equal(progressRes.body.data.status, "in_progress");

        const resolveRes = await request(app)
            .patch(`${API}/complaints/${complaintId}/status`)
            .set("Cookie", staffCookie)
            .set(csrfHeader)
            .send({
                status: "resolved",
                resolutionNotes: "Replaced the washer and tightened connection. Leak fixed.",
            });

        assert.equal(resolveRes.status, 200);
        assert.equal(resolveRes.body.data.status, "resolved");
        assert.ok(resolveRes.body.data.resolvedAt);
        assert.equal(
            resolveRes.body.data.resolutionNotes,
            "Replaced the washer and tightened connection. Leak fixed."
        );
    });

    await t.test("Student sees resolution details upon fetching complaint", async () => {
        const res = await request(app)
            .get(`${API}/complaints/${complaintId}`)
            .set("Cookie", studentCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.data.status, "resolved");
        assert.equal(
            res.body.data.resolutionNotes,
            "Replaced the washer and tightened connection. Leak fixed."
        );
    });
});
