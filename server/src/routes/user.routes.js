
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

router.use(
    authenticate,
    authorizeRoles("admin")
);

/*
 * GET ALL USERS
 * Supports search, filters and pagination
 */

router.get(
    "/",
    userController.listUsers
);

/*
 * GET USER BY ID
 */

router.get(
    "/:userId",
    userController.getUserById
);

/*
 * UPDATE BASIC USER DETAILS
 */

router.patch(
    "/:userId",
    validate(updateUserSchema),
    userController.updateUser
);

/*
 * ACTIVATE / DEACTIVATE USER
 */

router.patch(
    "/:userId/status",
    validate(updateUserStatusSchema),
    userController.updateUserStatus
);

/*
 * CHANGE USER ROLE
 */

router.patch(
    "/:userId/role",
    validate(updateUserRoleSchema),
    userController.updateUserRole
);

export default router;
