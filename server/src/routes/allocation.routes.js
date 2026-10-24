import { Router } from "express";

import * as allocationController from "../controllers/allocation.controller.js";

import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import validateObjectId from "../middlewares/validateObjectId.middleware.js";

import {
    createAllocationSchema,
} from "../validators/allocation.validator.js";

const router = Router();

// Require authentication for every allocation endpoint.
router.use(authenticate);

// Keep named routes before parameter routes
router.get(
    "/my",
    authorizeRoles("student"),
    allocationController.getMyAllocation
);

router.get(
    "/vacancies",
    authorizeRoles("admin", "warden"),
    allocationController.getVacancies
);

router.post(
    "/",
    authorizeRoles("admin"),
    validate(createAllocationSchema),
    allocationController.createAllocation
);

router.get(
    "/",
    authorizeRoles("admin", "warden"),
    allocationController.getAllocations
);

router.patch(
    "/:allocationId/vacate",
    authorizeRoles("admin"),
    validateObjectId("allocationId"),
    allocationController.vacateStudentAllocation
);

export default router;
