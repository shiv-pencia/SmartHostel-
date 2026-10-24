import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

import app from "../src/app.js";
import User from "../src/models/user.model.js";
import Hostel from "../src/models/hostel.model.js";
import Room from "../src/models/room.model.js";
import Bed from "../src/models/bed.model.js";
import Allocation from "../src/models/allocation.model.js";
import RevokedToken from "../src/models/revokedToken.model.js";

let replicaSet;

const API = "/api/v1";

const csrfHeader = {
    "X-Requested-With": "XMLHttpRequest",
};

let adminCookie;
let studentCookie;

let adminUser;
let studentUser;
let hostelDoc;
let roomDoc;
let bedDoc1;
let bedDoc2;
let allocationId;

before(async () => {
    replicaSet = await MongoMemoryReplSet.create({
        replSet: {
            count: 1,
            storageEngine: "wiredTiger",
        },
    });

    await mongoose.connect(replicaSet.getUri());

    await Promise.all([
        User.init(),
        Hostel.init(),
        Room.init(),
        Bed.init(),
        Allocation.init(),
        RevokedToken.init(),
    ]);

    adminUser = await User.create({
        name: "Admin Officer",
        email: "alloc.admin@example.com",
        password: "AdminPass@123",
        role: "admin",
        isActive: true,
    });

    studentUser = await User.create({
        name: "Alloc Student",
        email: "alloc.student@example.com",
        password: "StudentPass@123",
        role: "student",
        isActive: true,
    });

    hostelDoc = await Hostel.create({
        name: "Brahmaputra Hostel",
        code: "BRH",
        location: "IIT Guwahati",
        genderPolicy: "male",
        isActive: true,
    });

    roomDoc = await Room.create({
        hostel: hostelDoc._id,
        roomNumber: "101",
        floor: 1,
        capacity: 2,
        bedCount: 2,
        status: "active",
    });

    bedDoc1 = await Bed.create({
        room: roomDoc._id,
        bedNumber: "B1",
        operationalStatus: "usable",
    });

    bedDoc2 = await Bed.create({
        room: roomDoc._id,
        bedNumber: "B2",
        operationalStatus: "usable",
    });

    // Login admin
    const adminLoginRes = await request(app)
        .post(`${API}/auth/login`)
        .set(csrfHeader)
        .send({
            email: "alloc.admin@example.com",
            password: "AdminPass@123",
        });

    assert.equal(adminLoginRes.status, 200);
    const adminCookieRaw = adminLoginRes.headers["set-cookie"]?.find((c) =>
        c.startsWith("accessToken=")
    );
    adminCookie = adminCookieRaw.split(";")[0];

    // Login student
    const studentLoginRes = await request(app)
        .post(`${API}/auth/login`)
        .set(csrfHeader)
        .send({
            email: "alloc.student@example.com",
            password: "StudentPass@123",
        });

    assert.equal(studentLoginRes.status, 200);
    const studentCookieRaw = studentLoginRes.headers["set-cookie"]?.find((c) =>
        c.startsWith("accessToken=")
    );
    studentCookie = studentCookieRaw.split(";")[0];
});

after(async () => {
    await mongoose.disconnect();

    if (replicaSet) {
        await replicaSet.stop();
    }
});

test("Allocation API workflow and integration", async (t) => {
    await t.test("Admin can list vacant beds", async () => {
        const res = await request(app)
            .get(`${API}/allocations/vacancies`)
            .set("Cookie", adminCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
        assert.equal(res.body.data.length, 2);
    });

    await t.test("Student cannot access vacancies (admin only)", async () => {
        const res = await request(app)
            .get(`${API}/allocations/vacancies`)
            .set("Cookie", studentCookie);

        assert.equal(res.status, 403);
    });

    await t.test("Student initially has no active allocation", async () => {
        const res = await request(app)
            .get(`${API}/allocations/my`)
            .set("Cookie", studentCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data, null);
    });

    await t.test("Admin successfully allocates bed to student", async () => {
        const res = await request(app)
            .post(`${API}/allocations`)
            .set("Cookie", adminCookie)
            .set(csrfHeader)
            .send({
                studentId: studentUser._id.toString(),
                hostelId: hostelDoc._id.toString(),
                roomId: roomDoc._id.toString(),
                bedId: bedDoc1._id.toString(),
            });

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.status, "active");
        assert.equal(res.body.data.student, studentUser._id.toString());
        assert.equal(res.body.data.bed, bedDoc1._id.toString());

        allocationId = res.body.data.id;
        assert.ok(allocationId);
    });

    await t.test("Rejects allocating second bed to same student", async () => {
        const res = await request(app)
            .post(`${API}/allocations`)
            .set("Cookie", adminCookie)
            .set(csrfHeader)
            .send({
                studentId: studentUser._id.toString(),
                hostelId: hostelDoc._id.toString(),
                roomId: roomDoc._id.toString(),
                bedId: bedDoc2._id.toString(),
            });

        assert.equal(res.status, 409);
        assert.match(res.body.message, /already has an active allocation/i);
    });

    await t.test("Allocated bed is no longer in vacancies", async () => {
        const res = await request(app)
            .get(`${API}/allocations/vacancies`)
            .set("Cookie", adminCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.data.length, 1);
        assert.equal(res.body.data[0].id, bedDoc2._id.toString());
    });

    await t.test("Student can retrieve active allocation via /my", async () => {
        const res = await request(app)
            .get(`${API}/allocations/my`)
            .set("Cookie", studentCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.id, allocationId);
        assert.equal(res.body.data.status, "active");
        assert.equal(res.body.data.bed.bedNumber, "B1");
        assert.equal(res.body.data.room.roomNumber, "101");
        assert.equal(res.body.data.hostel.code, "BRH");
    });

    await t.test("Admin can list allocations including filters", async () => {
        const res = await request(app)
            .get(`${API}/allocations?status=active`)
            .set("Cookie", adminCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
        assert.equal(res.body.data.length, 1);
        assert.equal(res.body.data[0].id, allocationId);
    });

    await t.test("Admin vacates student allocation", async () => {
        const res = await request(app)
            .patch(`${API}/allocations/${allocationId}/vacate`)
            .set("Cookie", adminCookie)
            .set(csrfHeader);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.status, "vacated");
        assert.ok(res.body.data.vacatedAt);
    });

    await t.test("Cannot vacate an already vacated allocation", async () => {
        const res = await request(app)
            .patch(`${API}/allocations/${allocationId}/vacate`)
            .set("Cookie", adminCookie)
            .set(csrfHeader);

        assert.equal(res.status, 409);
        assert.match(res.body.message, /already been vacated/i);
    });

    await t.test("Bed becomes available again in vacancies after vacation", async () => {
        const res = await request(app)
            .get(`${API}/allocations/vacancies`)
            .set("Cookie", adminCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.data.length, 2);
    });

    await t.test("Student /my returns null after vacation", async () => {
        const res = await request(app)
            .get(`${API}/allocations/my`)
            .set("Cookie", studentCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.data, null);
    });
});
