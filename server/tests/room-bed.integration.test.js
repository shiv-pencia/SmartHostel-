
import {
    test,
    before,
    after,
} from "node:test";

import assert from "node:assert/strict";
import mongoose from "mongoose";

import {
    MongoMemoryReplSet,
} from "mongodb-memory-server";

import Hostel from "../src/models/hostel.model.js";
import Room from "../src/models/room.model.js";
import Bed from "../src/models/bed.model.js";

import * as roomService from "../src/services/room.service.js";
import * as bedService from "../src/services/bed.service.js";

let replicaSet;
let hostel;
let room;

before(async () => {
    replicaSet = await MongoMemoryReplSet.create({
        replSet: {
            count: 1,
            storageEngine: "wiredTiger",
        },
    });

    await mongoose.connect(replicaSet.getUri());

    await Promise.all([
        Hostel.init(),
        Room.init(),
        Bed.init(),
    ]);

    hostel = await Hostel.create({
        name: "Disang Hostel",
        code: "DIS",
        location: "IIT Guwahati",
        genderPolicy: "male",
    });
});

after(async () => {
    await mongoose.disconnect();

    if (replicaSet) {
        await replicaSet.stop();
    }
});

test("Room and Bed business rules", async (t) => {
    await t.test("Create room", async () => {
        room = await roomService.createRoom({
            hostel: hostel._id.toString(),
            roomNumber: "101",
            floor: 1,
            capacity: 2,
            roomType: "standard",
        });

        assert.equal(room.capacity, 2);
        assert.equal(room.bedCount, 0);
    });

    await t.test("Create first bed", async () => {
        const bed = await bedService.createBed(
            room.id,
            { bedNumber: "B1" }
        );

        assert.equal(bed.bedNumber, "B1");

        const updatedRoom = await Room.findById(room.id);

        assert.equal(updatedRoom.bedCount, 1);
    });

    await t.test(
        "Duplicate bed rolls back room counter",
        async () => {
            await assert.rejects(
                bedService.createBed(room.id, {
                    bedNumber: "B1",
                }),
                (error) => error.code === 11000
            );

            const updatedRoom = await Room.findById(room.id);

            assert.equal(updatedRoom.bedCount, 1);
        }
    );

    await t.test("Create second bed", async () => {
        await bedService.createBed(room.id, {
            bedNumber: "B2",
        });

        const updatedRoom = await Room.findById(room.id);

        assert.equal(updatedRoom.bedCount, 2);
    });

    await t.test(
        "Reject creating more beds than capacity",
        async () => {
            await assert.rejects(
                bedService.createBed(room.id, {
                    bedNumber: "B3",
                }),
                (error) => error.statusCode === 409
            );

            const updatedRoom = await Room.findById(room.id);

            assert.equal(updatedRoom.bedCount, 2);

            const count = await Bed.countDocuments({
                room: room.id,
            });

            assert.equal(count, 2);
        }
    );

    await t.test(
        "Reject reducing capacity below bed count",
        async () => {
            await assert.rejects(
                roomService.updateRoom(room.id, {
                    capacity: 1,
                }),
                (error) => error.statusCode === 409
            );
        }
    );

    await t.test(
        "Mark bed under maintenance",
        async () => {
            const bed = await Bed.findOne({
                room: room.id,
                bedNumber: "B1",
            });

            const updated = await bedService.updateBedStatus(
                bed._id.toString(),
                "maintenance"
            );

            assert.equal(
                updated.operationalStatus,
                "maintenance"
            );
        }
    );
});
