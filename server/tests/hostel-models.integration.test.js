
import {
    test,
    before,
    after,
} from "node:test";

import assert from "node:assert/strict";
import mongoose from "mongoose";

import { MongoMemoryServer } from "mongodb-memory-server";

import Hostel from "../src/models/hostel.model.js";
import Room from "../src/models/room.model.js";
import Bed from "../src/models/bed.model.js";

let mongoServer;

before(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    // Ensure unique indexes have been built.
    await Promise.all([
        Hostel.init(),
        Room.init(),
        Bed.init(),
    ]);
});

after(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }
});

test("Hostel, Room and Bed database constraints", async (t) => {
    let disang;
    let brahmaputra;
    let disangRoom101;
    let brahmaputraRoom101;

    await t.test("Create hostels", async () => {
        disang = await Hostel.create({
            name: "Disang Hostel",
            code: "dis",
            location: "IIT Guwahati",
            genderPolicy: "male",
        });

        brahmaputra = await Hostel.create({
            name: "Brahmaputra Hostel",
            code: "BRA",
            location: "IIT Guwahati",
            genderPolicy: "male",
        });

        assert.equal(disang.code, "DIS");
        assert.equal(brahmaputra.code, "BRA");
    });

    await t.test("Reject duplicate hostel code", async () => {
        await assert.rejects(
            Hostel.create({
                name: "Another Hostel",
                code: "dis",
                location: "IIT Guwahati",
            }),
            (error) => error.code === 11000
        );
    });

    await t.test("Create rooms in two hostels", async () => {
        disangRoom101 = await Room.create({
            hostel: disang._id,
            roomNumber: "101",
            floor: 1,
            capacity: 2,
        });

        brahmaputraRoom101 = await Room.create({
            hostel: brahmaputra._id,
            roomNumber: "101",
            floor: 1,
            capacity: 3,
        });

        // Same room number is allowed across hostels.
        assert.equal(disangRoom101.roomNumber, "101");
        assert.equal(brahmaputraRoom101.roomNumber, "101");
    });

    await t.test("Reject duplicate room in same hostel", async () => {
        await assert.rejects(
            Room.create({
                hostel: disang._id,
                roomNumber: "101",
                floor: 1,
                capacity: 2,
            }),
            (error) => error.code === 11000
        );
    });

    await t.test("Reject invalid room capacity", async () => {
        const invalidRoom = new Room({
            hostel: disang._id,
            roomNumber: "102",
            floor: 1,
            capacity: 0,
        });

        await assert.rejects(
            invalidRoom.validate(),
            (error) => error.name === "ValidationError"
        );
    });

    await t.test("Create beds", async () => {
        const firstBed = await Bed.create({
            room: disangRoom101._id,
            bedNumber: "b1",
        });

        const secondBed = await Bed.create({
            room: disangRoom101._id,
            bedNumber: "B2",
        });

        assert.equal(firstBed.bedNumber, "B1");
        assert.equal(secondBed.bedNumber, "B2");
    });

    await t.test("Reject duplicate bed in same room", async () => {
        await assert.rejects(
            Bed.create({
                room: disangRoom101._id,
                bedNumber: "B1",
            }),
            (error) => error.code === 11000
        );
    });

    await t.test("Allow same bed label in another room", async () => {
        const bed = await Bed.create({
            room: brahmaputraRoom101._id,
            bedNumber: "B1",
        });

        assert.equal(bed.bedNumber, "B1");
    });
});
