
import { Router } from "express";

import * as hostelController from "../controllers/hostel.controller.js";

import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
    createHostelSchema,
    updateHostelSchema,
    updateHostelStatusSchema,
    hostelIdParamSchema,
} from "../validators/hostel.validator.js";

import ApiError from "../utils/ApiError.js";

const router = Router();

/*
 * Validate :hostelId route parameter
 */

const validateHostelId = (req, res, next) => {
    const parsed = hostelIdParamSchema.safeParse(
        req.params
    );

    if (!parsed.success) {
        const errors = parsed.error.issues.map(
            (issue) => ({
                field: issue.path.join(".") || "hostelId",
                message: issue.message,
            })
        );

        return next(
            new ApiError(
                400,
                "Invalid hostel ID",
                errors
            )
        );
    }

    next();
};

/*
 * Every hostel route requires authentication
 */

router.use(authenticate);

/*
 * CREATE HOSTEL
 * Admin only
 */

router.post(
    "/",
    authorizeRoles("admin"),
    validate(createHostelSchema),
    hostelController.createHostel
);

/*
 * LIST HOSTELS
 * Admin and Warden
 */

router.get(
    "/",
    authorizeRoles("admin", "warden"),
    hostelController.listHostels
);

/*
 * GET HOSTEL BY ID
 * Admin and Warden
 */

router.get(
    "/:hostelId",
    authorizeRoles("admin", "warden"),
    validateHostelId,
    hostelController.getHostelById
);

/*
 * UPDATE HOSTEL DETAILS
 * Admin only
 */

router.patch(
    "/:hostelId",
    authorizeRoles("admin"),
    validateHostelId,
    validate(updateHostelSchema),
    hostelController.updateHostel
);

/*
 * CHANGE HOSTEL STATUS
 * Admin only
 */

router.patch(
    "/:hostelId/status",
    authorizeRoles("admin"),
    validateHostelId,
    validate(updateHostelStatusSchema),
    hostelController.updateHostelStatus
);

export default router;
