
import {
    before,
    after,
    test,
} from "node:test";

import assert from "node:assert/strict";
import mongoose from "mongoose";

import {
    MongoMemoryServer,
} from "mongodb-memory-server";

import Allocation from "../src/models/allocation.model.js";

let mongoServer;

before(async () => {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());

    // Wait for MongoDB to create our unique indexes.
    await Allocation.init();
});

after(async () => {
    await mongoose.disconnect();

    if (mongoServer) {
        await mongoServer.stop();
    }
});

test("Allocation database constraints", async (t) => {
    /*
     * Test IDs.
     *
     * These are valid ObjectIds but do not represent
     * actual User, Hostel, Room or Bed documents.
     *
     * We're testing model constraints here.
     * Referenced-document checks come in Phase 5.2.
     */
    const studentA = new mongoose.Types.ObjectId();
    const studentB = new mongoose.Types.ObjectId();

    const hostelId = new mongoose.Types.ObjectId();
    const roomId = new mongoose.Types.ObjectId();

    const bedA = new mongoose.Types.ObjectId();
    const bedB = new mongoose.Types.ObjectId();

    const adminId = new mongoose.Types.ObjectId();

    /*
     * Test 1: Create an active allocation.
     */
    const firstAllocation = await Allocation.create({
        student: studentA,
        hostel: hostelId,
        room: roomId,
        bed: bedA,
        allocatedBy: adminId,
        allocatedAt: new Date("2026-10-01T00:00:00.000Z"),
    });

    await t.test(
        "Creates active allocation",
        async () => {
            assert.equal(
                firstAllocation.status,
                "active"
            );

            assert.equal(
                firstAllocation.vacatedAt,
                null
            );
        }
    );

    /*
     * Test 2: Same student, different bed.
     * Must fail while first allocation is active.
     */
    await t.test(
        "Rejects two active allocations for one student",
        async () => {
            await assert.rejects(
                Allocation.create({
                    student: studentA,
                    hostel: hostelId,
                    room: roomId,
                    bed: bedB,
                    allocatedBy: adminId,
                }),
                (error) => error.code === 11000
            );
        }
    );

    /*
     * Test 3: Different student, same bed.
     * Must also fail.
     */
    await t.test(
        "Rejects two active students in one bed",
        async () => {
            await assert.rejects(
                Allocation.create({
                    student: studentB,
                    hostel: hostelId,
                    room: roomId,
                    bed: bedA,
                    allocatedBy: adminId,
                }),
                (error) => error.code === 11000
            );
        }
    );

    /*
     * Test 4: Vacate first allocation.
     */
    await t.test(
        "Preserves allocation after vacation",
        async () => {
            firstAllocation.status = "vacated";

            firstAllocation.vacatedAt =
                new Date("2026-10-02T00:00:00.000Z");

            firstAllocation.vacatedBy = adminId;

            await firstAllocation.save();

            const saved = await Allocation.findById(
                firstAllocation._id
            );

            assert.equal(saved.status, "vacated");

            assert.ok(saved.vacatedAt);
            assert.ok(saved.vacatedBy);
        }
    );

    /*
     * Test 5: Student A can receive another bed
     * after vacating the previous allocation.
     */
    await t.test(
        "Allows a new allocation after vacation",
        async () => {
            const newAllocation = await Allocation.create({
                student: studentA,
                hostel: hostelId,
                room: roomId,
                bed: bedB,
                allocatedBy: adminId,
            });

            assert.equal(
                newAllocation.status,
                "active"
            );
        }
    );

    /*
     * Test 6: Bed A can be assigned to Student B
     * after Student A has vacated.
     */
    await t.test(
        "Allows reuse of a vacated bed",
        async () => {
            const newAllocation = await Allocation.create({
                student: studentB,
                hostel: hostelId,
                room: roomId,
                bed: bedA,
                allocatedBy: adminId,
            });

            assert.equal(
                newAllocation.status,
                "active"
            );
        }
    );

    /*
     * Test 7: Historical records remain.
     */
    await t.test(
        "Keeps student allocation history",
        async () => {
            const history = await Allocation.find({
                student: studentA,
            }).sort({
                allocatedAt: 1,
            });

            assert.equal(history.length, 2);

            assert.equal(
                history[0].status,
                "vacated"
            );

            assert.equal(
                history[1].status,
                "active"
            );
        }
    );

    /*
     * Test 8: A vacated allocation must
     * include vacation information.
     */
    await t.test(
        "Rejects vacation without required details",
        async () => {
            const invalid = new Allocation({
                student: new mongoose.Types.ObjectId(),
                hostel: hostelId,
                room: roomId,
                bed: new mongoose.Types.ObjectId(),
                allocatedBy: adminId,
                status: "vacated",
            });

            await assert.rejects(
                invalid.validate(),
                (error) => error.name === "ValidationError"
            );
        }
    );

    /*
     * Test 9: Vacation cannot happen
     * before the allocation date.
     */
    await t.test(
        "Rejects invalid allocation chronology",
        async () => {
            const invalid = new Allocation({
                student: new mongoose.Types.ObjectId(),
                hostel: hostelId,
                room: roomId,
                bed: new mongoose.Types.ObjectId(),
                allocatedBy: adminId,
                status: "vacated",
                allocatedAt:
                    new Date("2026-10-10T00:00:00.000Z"),
                vacatedAt:
                    new Date("2026-10-09T00:00:00.000Z"),
                vacatedBy: adminId,
            });

            await assert.rejects(
                invalid.validate(),
                (error) => error.name === "ValidationError"
            );
        }
    );

    /*
     * Test 10: Verify partial unique indexes.
     */
    await t.test(
        "Creates both partial unique indexes",
        async () => {
            const indexes =
                await Allocation.collection.indexes();

            const studentIndex = indexes.find(
                (index) =>
                    index.name ===
                    "unique_active_allocation_per_student"
            );

            const bedIndex = indexes.find(
                (index) =>
                    index.name ===
                    "unique_active_allocation_per_bed"
            );

            assert.ok(studentIndex);
            assert.ok(bedIndex);

            assert.equal(studentIndex.unique, true);
            assert.equal(bedIndex.unique, true);

            assert.deepEqual(
                studentIndex.partialFilterExpression,
                { status: "active" }
            );

            assert.deepEqual(
                bedIndex.partialFilterExpression,
                { status: "active" }
            );
        }
    );
});
