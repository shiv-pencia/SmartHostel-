
import { Router } from "express";

import {
    register,
    login,
    logout,
    getCurrentUser,
} from "../controllers/auth.controller.js";

import validate from "../middlewares/validate.middleware.js";

import {
    registerSchema,
    loginSchema,
} from "../validators/auth.validator.js";

import {
    registerLimiter,
    loginLimiter,
} from "../middlewares/authRateLimit.middleware.js";

import authenticate from "../middlewares/auth.middleware.js";
import authorizeRoles from "../middlewares/role.middleware.js";

import { sendSuccess } from "../utils/response.js";
import env from "../config/env.js";

const router = Router();

/*
 * PUBLIC AUTHENTICATION ROUTES
 */

// Register a student
router.post(
    "/register",
    registerLimiter,
    validate(registerSchema),
    register
);

// Login
router.post(
    "/login",
    loginLimiter,
    validate(loginSchema),
    login
);

// Logout
// Public so expired sessions can clear their cookies
router.post(
    "/logout",
    logout
);

/*
 * PROTECTED AUTHENTICATION ROUTES
 */

// Get currently authenticated user
router.get(
    "/me",
    authenticate,
    getCurrentUser
);

/*
 * TEMPORARY DEVELOPMENT TEST ROUTES
 */

if (env.nodeEnv === "development") {
    router.get(
        "/profile-check",
        authenticate,
        (req, res) => {
            return sendSuccess(res, {
                message: "Authentication successful",
                data: { user: req.user },
            });
        }
    );

    router.get(
        "/warden-check",
        authenticate,
        authorizeRoles("admin", "warden"),
        (req, res) => {
            return sendSuccess(res, {
                message: "Authorization successful",
                data: { user: req.user },
            });
        }
    );
}

export default router;
