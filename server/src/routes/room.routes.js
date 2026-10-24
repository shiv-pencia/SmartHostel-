
import { Router } from "express";

import * as roomController from "../controllers/room.controller.js";
import * as bedController from "../controllers/bed.controller.js";

import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import validateObjectId from "../middlewares/validateObjectId.middleware.js";

import {
    createRoomSchema,
    updateRoomSchema,
    updateRoomStatusSchema,
} from "../validators/room.validator.js";

import {
    createBedSchema,
} from "../validators/bed.validator.js";

const router = Router();

/*
 * All Room and Bed routes require login.
 */
router.use(authenticate);

/*
 * ROOMS
 */

router.post(
    "/",
    authorizeRoles("admin"),
    validate(createRoomSchema),
    roomController.createRoom
);

router.get(
    "/",
    authorizeRoles("admin", "warden"),
    roomController.listRooms
);

router.get(
    "/:roomId",
    authorizeRoles("admin", "warden"),
    validateObjectId("roomId"),
    roomController.getRoomById
);

router.patch(
    "/:roomId",
    authorizeRoles("admin"),
    validateObjectId("roomId"),
    validate(updateRoomSchema),
    roomController.updateRoom
);

router.patch(
    "/:roomId/status",
    authorizeRoles("admin", "warden"),
    validateObjectId("roomId"),
    validate(updateRoomStatusSchema),
    roomController.updateRoomStatus
);

/*
 * BEDS BELONGING TO A ROOM
 */

router.post(
    "/:roomId/beds",
    authorizeRoles("admin"),
    validateObjectId("roomId"),
    validate(createBedSchema),
    bedController.createBed
);

router.get(
    "/:roomId/beds",
    authorizeRoles("admin", "warden"),
    validateObjectId("roomId"),
    bedController.listBedsByRoom
);

export default router;
