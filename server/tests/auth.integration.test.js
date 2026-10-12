
import test, { before, after } from "node:test";
import assert from "node:assert/strict";

import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import app from "../src/app.js";
import User from "../src/models/user.model.js";
import RevokedToken from "../src/models/revokedToken.model.js";

let mongoServer;

const API = "/api/v1";

const csrfHeader = {
    "X-Requested-With": "XMLHttpRequest",
};

const studentData = {
    name: "Test Student",
    email: "test.student@example.com",
    password: "StudentPass@123",
    phone: "9876543210",
};

const adminData = {
    name: "Test Administrator",
    email: "test.admin@example.com",
    password: "AdminPass@123",
    role: "admin",
};

// Start isolated MongoDB before testing.
before(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    await Promise.all([
        User.init(),
        RevokedToken.init(),
    ]);
});

// Clean up when tests finish.
after(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }
});

test("Authentication and authorization workflow", async (t) => {
    let studentCookie;
    let adminCookie;
    let studentId;
    let adminId;

    await t.test("Health endpoint works", async () => {
        const res = await request(app)
            .get(`${API}/health`);

        assert.equal(res.status, 200);
    });

    await t.test("CSRF header is required", async () => {
        const res = await request(app)
            .post(`${API}/auth/register`)
            .send(studentData);

        assert.equal(res.status, 403);
    });

    await t.test("Untrusted origin is rejected", async () => {
        const res = await request(app)
            .post(`${API}/auth/register`)
            .set(csrfHeader)
            .set("Origin", "https://evil.example")
            .send(studentData);

        assert.equal(res.status, 403);
    });

    await t.test("Student registration succeeds", async () => {
        const res = await request(app)
            .post(`${API}/auth/register`)
            .set(csrfHeader)
            .send(studentData);

        assert.equal(res.status, 201);
        assert.equal(res.body.data.user.role, "student");

        studentId = res.body.data.user.id;

        // Verify password is hashed in MongoDB.
        const storedUser = await User.findById(
            studentId
        ).select("+password");

        assert.ok(storedUser);
        assert.notEqual(
            storedUser.password,
            studentData.password
        );
    });

    await t.test("Duplicate email is rejected", async () => {
        const res = await request(app)
            .post(`${API}/auth/register`)
            .set(csrfHeader)
            .send(studentData);

        assert.equal(res.status, 409);
    });

    await t.test("Wrong password is rejected", async () => {
        const res = await request(app)
            .post(`${API}/auth/login`)
            .set(csrfHeader)
            .send({
                email: studentData.email,
                password: "wrong-password",
            });

        assert.equal(res.status, 401);
    });

    await t.test("Student login succeeds", async () => {
        const res = await request(app)
            .post(`${API}/auth/login`)
            .set(csrfHeader)
            .send({
                email: studentData.email,
                password: studentData.password,
            });

        assert.equal(res.status, 200);

        const cookieHeader = res.headers["set-cookie"]
            ?.find((cookie) => cookie.startsWith("accessToken="));

        assert.ok(cookieHeader);
        assert.match(cookieHeader, /HttpOnly/);

        studentCookie = cookieHeader.split(";")[0];
    });

    await t.test("Authenticated student can access /me", async () => {
        const res = await request(app)
            .get(`${API}/auth/me`)
            .set("Cookie", studentCookie);

        assert.equal(res.status, 200);
        assert.equal(res.body.data.user.id, studentId);
    });

    await t.test("Student cannot access admin APIs", async () => {
        const res = await request(app)
            .get(`${API}/users`)
            .set("Cookie", studentCookie);

        assert.equal(res.status, 403);
    });

    await t.test("Administrator can access user management", async () => {
        // Direct database setup is only a test fixture.
        const admin = await User.create(adminData);
        adminId = admin._id.toString();

        const login = await request(app)
            .post(`${API}/auth/login`)
            .set(csrfHeader)
            .send({
                email: adminData.email,
                password: adminData.password,
            });

        assert.equal(login.status, 200);

        const cookieHeader = login.headers["set-cookie"]
            ?.find((cookie) => cookie.startsWith("accessToken="));

        assert.ok(cookieHeader);

        adminCookie = cookieHeader.split(";")[0];

        const res = await request(app)
            .get(`${API}/users`)
            .set("Cookie", adminCookie);

        assert.equal(res.status, 200);
        assert.ok(res.body.data.length >= 2);
    });

    await t.test("Admin account cannot be deactivated", async () => {
        const res = await request(app)
            .patch(`${API}/users/${adminId}/status`)
            .set(csrfHeader)
            .set("Cookie", adminCookie)
            .send({ isActive: false });

        assert.equal(res.status, 403);
    });

    await t.test("Logout revokes the current token", async () => {
        const logout = await request(app)
            .post(`${API}/auth/logout`)
            .set(csrfHeader)
            .set("Cookie", studentCookie);

        assert.equal(logout.status, 200);

        // Deliberately replay the original cookie.
        const replay = await request(app)
            .get(`${API}/auth/me`)
            .set("Cookie", studentCookie);

        assert.equal(replay.status, 401);
    });
});
