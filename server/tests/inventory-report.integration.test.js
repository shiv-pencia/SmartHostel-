
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

import {
    getInventoryReport,
} from "../src/services/inventoryReport.service.js";

let replicaSet;

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
});

after(async () => {
    await mongoose.disconnect();

    if (replicaSet) {
        await replicaSet.stop();
    }
});

test("Inventory reporting and integrity", async (t) => {
    /*
     * Test data:
     *
     * Active Disang Hostel:
     *   Room 101: active, capacity 3
     *     B1 usable
     *     B2 maintenance
     *
     *   Room 102: maintenance, capacity 1
     *     B1 inactive
     *
     * Inactive Brahmaputra Hostel:
     *   Room 201: active, capacity 2, no beds
     */

    const disang = await Hostel.create({
        name: "Disang Hostel",
        code: "DIS",
        location: "IIT Guwahati",
        genderPolicy: "male",
    });

    const brahmaputra = await Hostel.create({
        name: "Brahmaputra Hostel",
        code: "BRA",
        location: "IIT Guwahati",
        genderPolicy: "male",
        isActive: false,
    });

    const room101 = await roomService.createRoom({
        hostel: disang.id,
        roomNumber: "101",
        floor: 1,
        capacity: 3,
        roomType: "standard",
    });

    const room102 = await roomService.createRoom({
        hostel: disang.id,
        roomNumber: "102",
        floor: 1,
        capacity: 1,
        roomType: "standard",
    });

    await roomService.updateRoomStatus(
        room102.id,
        "maintenance"
    );

    // Create room in active hostel, then deactivate it.
    await Hostel.findByIdAndUpdate(
        brahmaputra.id,
        { isActive: true }
    );

    await roomService.createRoom({
        hostel: brahmaputra.id,
        roomNumber: "201",
        floor: 2,
        capacity: 2,
        roomType: "standard",
    });

    await Hostel.findByIdAndUpdate(
        brahmaputra.id,
        { isActive: false }
    );

    const bedB1 = await bedService.createBed(
        room101.id,
        { bedNumber: "B1" }
    );

    const bedB2 = await bedService.createBed(
        room101.id,
        { bedNumber: "B2" }
    );

    // Create a bed while Room 102 is active.
    await roomService.updateRoomStatus(
        room102.id,
        "active"
    );

    const bedRoom102 = await bedService.createBed(
        room102.id,
        { bedNumber: "B1" }
    );

    await roomService.updateRoomStatus(
        room102.id,
        "maintenance"
    );

    await bedService.updateBedStatus(
        bedB2.id,
        "maintenance"
    );

    await bedService.updateBedStatus(
        bedRoom102.id,
        "inactive"
    );

    await t.test(
        "Calculates hostel and room totals correctly",
        async () => {
            const report = await getInventoryReport();
            const { summary } = report;

            assert.equal(summary.totalHostels, 2);
            assert.equal(summary.activeHostels, 1);
            assert.equal(summary.inactiveHostels, 1);

            assert.equal(summary.totalRooms, 3);
            assert.equal(summary.activeRooms, 2);
            assert.equal(summary.maintenanceRooms, 1);

            assert.equal(summary.totalCapacity, 6);
        }
    );

    await t.test(
        "Counts actual bed documents and statuses",
        async () => {
            const report = await getInventoryReport();
            const { summary } = report;

            assert.equal(summary.provisionedBeds, 3);
            assert.equal(summary.usableBeds, 1);
            assert.equal(summary.maintenanceBeds, 1);
            assert.equal(summary.inactiveBeds, 1);
        }
    );

    await t.test(
        "Separates unprovisioned and provisionable slots",
        async () => {
            const report = await getInventoryReport();
            const { summary } = report;

            // Room 101: 3 - 2 = 1
            // Room 102: 1 - 1 = 0
            // Room 201: 2 - 0 = 2
            assert.equal(summary.unprovisionedSlots, 3);

            // Only Room 101 qualifies:
            // Room 102 is under maintenance.
            // Brahmaputra Hostel is inactive.
            assert.equal(summary.provisionableSlots, 1);
        }
    );

    await t.test(
        "Reports hostel-wise inventory",
        async () => {
            const report = await getInventoryReport();

            const disangReport = report.hostels.find(
                (hostel) => hostel.code === "DIS"
            );

            const brahmaputraReport = report.hostels.find(
                (hostel) => hostel.code === "BRA"
            );

            assert.equal(disangReport.totalRooms, 2);
            assert.equal(disangReport.provisionedBeds, 3);
            assert.equal(disangReport.unprovisionedSlots, 1);

            assert.equal(brahmaputraReport.totalRooms, 1);
            assert.equal(
                brahmaputraReport.provisionableSlots,
                0
            );
        }
    );

    await t.test(
        "Rejects duplicate beds without changing the counter",
        async () => {
            const beforeRoom = await Room.findById(
                room101.id
            );

            await assert.rejects(
                bedService.createBed(room101.id, {
                    bedNumber: "B1",
                }),
                (error) => error.code === 11000
            );

            const afterRoom = await Room.findById(
                room101.id
            );

            assert.equal(
                afterRoom.bedCount,
                beforeRoom.bedCount
            );
        }
    );

    await t.test(
        "Detects an inconsistent bed counter",
        async () => {
            // Simulate legacy/corrupt data.
            await Room.findByIdAndUpdate(
                room101.id,
                { $set: { bedCount: 0 } }
            );

            const report = await getInventoryReport();

            assert.equal(
                report.summary.counterMismatchRooms,
                1
            );

            // Restore the test data.
            await Room.findByIdAndUpdate(
                room101.id,
                { $set: { bedCount: 2 } }
            );
        }
    );

    await t.test(
        "Detects orphaned room and bed records",
        async () => {
            const missingHostelId =
                new mongoose.Types.ObjectId();

            const missingRoomId =
                new mongoose.Types.ObjectId();

            // Deliberately bypass service-level reference checks
            // to simulate corrupted historical data.
            await Room.create({
                hostel: missingHostelId,
                roomNumber: "ORPHAN-1",
                floor: 1,
                capacity: 1,
            });

            await Bed.create({
                room: missingRoomId,
                bedNumber: "B1",
            });

            const report = await getInventoryReport();

            assert.equal(report.summary.orphanRooms, 1);
            assert.equal(report.summary.orphanBeds, 1);

            assert.equal(report.summary.totalRooms, 3);

            // Cleanup for isolation.
            await Room.deleteOne({
                hostel: missingHostelId,
            });

            await Bed.deleteOne({
                room: missingRoomId,
            });
        }
    );

    // Bed B1 remains usable.
    assert.equal(bedB1.operationalStatus, "usable");
});
