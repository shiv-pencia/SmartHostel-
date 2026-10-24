import { Router } from "express";

import * as complaintController from "../controllers/complaint.controller.js";

import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import validateObjectId from "../middlewares/validateObjectId.middleware.js";

import {
    createComplaintSchema,
    assignComplaintSchema,
    updateComplaintStatusSchema,
} from "../validators/complaint.validator.js";

const router = Router();

// Require authentication for all complaint routes
router.use(authenticate);

// 1. Submit complaint (Students only)
router.post(
    "/",
    authorizeRoles("student"),
    validate(createComplaintSchema),
    complaintController.createComplaint
);

// 2. Complaint statistics (Admin and Warden)
router.get(
    "/stats",
    authorizeRoles("admin", "warden"),
    complaintController.getComplaintStats
);

// 3. List complaints (Role-aware: students see own, staff see assigned, admin/warden see all)
router.get(
    "/",
    complaintController.listComplaints
);

// 4. View single complaint details
router.get(
    "/:complaintId",
    validateObjectId("complaintId"),
    complaintController.getComplaintById
);

// 5. Assign staff member to complaint (Admin and Warden)
router.patch(
    "/:complaintId/assign",
    authorizeRoles("admin", "warden"),
    validateObjectId("complaintId"),
    validate(assignComplaintSchema),
    complaintController.assignComplaint
);

// 6. Update complaint status (Staff: in_progress/resolved; Admin/Warden: any)
router.patch(
    "/:complaintId/status",
    authorizeRoles("staff", "admin", "warden"),
    validateObjectId("complaintId"),
    validate(updateComplaintStatusSchema),
    complaintController.updateComplaintStatus
);

export default router;
