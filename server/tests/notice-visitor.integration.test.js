import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../src/app.js";
import User from "../src/models/user.model.js";
import Hostel from "../src/models/hostel.model.js";
import Notice from "../src/models/notice.model.js";
import Visitor from "../src/models/visitor.model.js";
import RevokedToken from "../src/models/revokedToken.model.js";

let mongoServer;

const API = "/api/v1";
const csrfHeader = {
    "X-Requested-With": "XMLHttpRequest",
};

let adminCookie;
let studentCookie;
let wardenCookie;

let adminUser;
let studentUser;
let wardenUser;
let hostelDoc;

before(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    await Promise.all([
        User.init(),
        Hostel.init(),
        Notice.init(),
        Visitor.init(),
        RevokedToken.init(),
    ]);

    adminUser = await User.create({
        name: "Notice Admin",
        email: "notice.admin@example.com",
        password: "AdminPass@123",
        role: "admin",
        isActive: true,
    });

    wardenUser = await User.create({
        name: "Notice Warden",
        email: "notice.warden@example.com",
        password: "WardenPass@123",
        role: "warden",
        isActive: true,
    });

    studentUser = await User.create({
        name: "Notice Student",
        email: "notice.student@example.com",
        password: "StudentPass@123",
        role: "student",
        isActive: true,
    });

    hostelDoc = await Hostel.create({
        name: "Lohit Hostel",
        code: "LOH",
        location: "IIT Guwahati",
        genderPolicy: "male",
        isActive: true,
    });

    // Login admin
    const adminLoginRes = await request(app)
        .post(`${API}/auth/login`)
        .set(csrfHeader)
        .send({
            email: "notice.admin@example.com",
            password: "AdminPass@123",
        });
    adminCookie = adminLoginRes.headers["set-cookie"];

    // Login warden
    const wardenLoginRes = await request(app)
        .post(`${API}/auth/login`)
        .set(csrfHeader)
        .send({
            email: "notice.warden@example.com",
            password: "WardenPass@123",
        });
    wardenCookie = wardenLoginRes.headers["set-cookie"];

    // Login student
    const studentLoginRes = await request(app)
        .post(`${API}/auth/login`)
        .set(csrfHeader)
        .send({
            email: "notice.student@example.com",
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

test("Notice Board and Visitor Management API", async (t) => {
    let createdNoticeId;
    let createdVisitorId;

    await t.test("Admin can publish an official notice", async () => {
        const res = await request(app)
            .post(`${API}/notices`)
            .set("Cookie", adminCookie)
            .set(csrfHeader)
            .send({
                title: "Mess Menu Revisions for Exams",
                content: "Mess committee has scheduled nutritious midnight snacks during end-semester exams.",
                category: "mess",
                priority: "important",
            });

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.title, "Mess Menu Revisions for Exams");
        createdNoticeId = res.body.data.id;
    });

    await t.test("Student cannot publish a notice (admin & warden only)", async () => {
        const res = await request(app)
            .post(`${API}/notices`)
            .set("Cookie", studentCookie)
            .set(csrfHeader)
            .send({
                title: "Student Unofficial Notice",
                content: "Testing student permission",
            });

        assert.equal(res.status, 403);
    });

    await t.test("Student can retrieve published notices", async () => {
        const res = await request(app)
            .get(`${API}/notices`)
            .set("Cookie", studentCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
        assert.equal(res.body.data.length, 1);
        assert.equal(res.body.data[0].category, "mess");
    });

    await t.test("Warden can log visitor check-in", async () => {
        const res = await request(app)
            .post(`${API}/visitors`)
            .set("Cookie", wardenCookie)
            .set(csrfHeader)
            .send({
                visitorName: "Rajesh Sharma",
                visitorPhone: "9876543210",
                studentId: String(studentUser._id),
                hostelId: String(hostelDoc._id),
                purpose: "Guardian visit",
                idProofType: "Aadhaar",
            });

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.visitorName, "Rajesh Sharma");
        assert.equal(res.body.data.status, "inside");
        createdVisitorId = res.body.data.id;
    });

    await t.test("Warden can list visitors", async () => {
        const res = await request(app)
            .get(`${API}/visitors`)
            .set("Cookie", wardenCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.data));
        assert.equal(res.body.data.length, 1);
        assert.equal(res.body.data[0].visitorName, "Rajesh Sharma");
    });

    await t.test("Warden can checkout visitor", async () => {
        const res = await request(app)
            .patch(`${API}/visitors/${createdVisitorId}/checkout`)
            .set("Cookie", wardenCookie)
            .set(csrfHeader);

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.data.status, "checked_out");
        assert.ok(res.body.data.checkOut);
    });
});
