import { Router } from "express";

import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

import {
    inventoryReport,
} from "../controllers/inventoryReport.controller.js";
import {
    occupancyReport,
    complaintAnalytics,
    dashboardOverview,
} from "../controllers/report.controller.js";

const router = Router();

/*
 * Every report request requires authentication.
 */
router.use(authenticate);

/*
 * Overview summary for dashboard cards: all authenticated roles.
 */
router.get(
    "/overview",
    authorizeRoles("admin", "warden", "student", "staff"),
    dashboardOverview
);

/*
 * Occupancy report: administrator and warden.
 */
router.get(
    "/occupancy",
    authorizeRoles("admin", "warden"),
    occupancyReport
);

/*
 * Complaint analytics: administrator and warden.
 */
router.get(
    "/complaints",
    authorizeRoles("admin", "warden"),
    complaintAnalytics
);

/*
 * Inventory report: administrator only.
 */
router.get(
    "/inventory",
    authorizeRoles("admin"),
    inventoryReport
);

export default router;
