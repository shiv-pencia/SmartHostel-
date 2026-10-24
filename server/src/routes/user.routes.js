
import { Router } from "express";

import * as userController from "../controllers/user.controller.js";

import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
    updateUserSchema,
    updateUserStatusSchema,
    updateUserRoleSchema,
} from "../validators/user.validator.js";

const router = Router();

/*
 * All routes below require:
 * 1. A valid authenticated user
 * 2. The admin role
 */

router.use(authenticate);

/*
 * GET ALL USERS
 * Supports search, filters and pagination (Admin and Warden)
 */
router.get(
    "/",
    authorizeRoles("admin", "warden"),
    userController.listUsers
);

/*
 * GET USER BY ID (Admin and Warden)
 */
router.get(
    "/:userId",
    authorizeRoles("admin", "warden"),
    userController.getUserById
);

/*
 * UPDATE BASIC USER DETAILS (Admin only)
 */
router.patch(
    "/:userId",
    authorizeRoles("admin"),
    validate(updateUserSchema),
    userController.updateUser
);

/*
 * ACTIVATE / DEACTIVATE USER (Admin only)
 */
router.patch(
    "/:userId/status",
    authorizeRoles("admin"),
    validate(updateUserStatusSchema),
    userController.updateUserStatus
);

/*
 * CHANGE USER ROLE (Admin only)
 */
router.patch(
    "/:userId/role",
    authorizeRoles("admin"),
    validate(updateUserRoleSchema),
    userController.updateUserRole
);

export default router;
