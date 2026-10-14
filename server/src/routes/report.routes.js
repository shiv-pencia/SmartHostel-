
import { Router } from "express";

import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

import {
    inventoryReport,
} from "../controllers/inventoryReport.controller.js";

const router = Router();

/*
 * Every report request requires authentication.
 */
router.use(authenticate);

/*
 * Inventory report: administrator only.
 */
router.get(
    "/inventory",
    authorizeRoles("admin"),
    inventoryReport
);

export default router;
