
import { Router } from "express";

import * as bedController from "../controllers/bed.controller.js";

import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import validateObjectId from "../middlewares/validateObjectId.middleware.js";

import {
    updateBedSchema,
    updateBedStatusSchema,
} from "../validators/bed.validator.js";

const router = Router();

router.use(authenticate);

/*
 * GET BED DETAILS
 */
router.get(
    "/:bedId",
    authorizeRoles("admin", "warden"),
    validateObjectId("bedId"),
    bedController.getBedById
);

/*
 * CHANGE BED LABEL
 */
router.patch(
    "/:bedId",
    authorizeRoles("admin"),
    validateObjectId("bedId"),
    validate(updateBedSchema),
    bedController.updateBed
);

/*
 * CHANGE BED OPERATIONAL STATUS
 */
router.patch(
    "/:bedId/status",
    authorizeRoles("admin", "warden"),
    validateObjectId("bedId"),
    validate(updateBedStatusSchema),
    bedController.updateBedStatus
);

export default router;
