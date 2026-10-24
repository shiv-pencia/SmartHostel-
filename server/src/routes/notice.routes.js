import { Router } from "express";
import * as noticeController from "../controllers/notice.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { createNoticeSchema } from "../validators/notice.validator.js";

const router = Router();

router.use(authenticate);

router.get("/", noticeController.getNotices);

router.post(
    "/",
    authorizeRoles("admin", "warden"),
    validate(createNoticeSchema),
    noticeController.createNotice
);

export default router;
