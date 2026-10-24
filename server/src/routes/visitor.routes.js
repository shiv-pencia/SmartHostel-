import { Router } from "express";
import * as visitorController from "../controllers/visitor.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import validateObjectId from "../middlewares/validateObjectId.middleware.js";
import { createVisitorSchema } from "../validators/visitor.validator.js";

const router = Router();

router.use(authenticate);

router.get(
    "/",
    authorizeRoles("admin", "warden", "staff"),
    visitorController.getVisitors
);

router.post(
    "/",
    authorizeRoles("admin", "warden", "staff"),
    validate(createVisitorSchema),
    visitorController.logEntry
);

router.patch(
    "/:visitorId/checkout",
    authorizeRoles("admin", "warden", "staff"),
    validateObjectId("visitorId"),
    visitorController.checkout
);

export default router;
