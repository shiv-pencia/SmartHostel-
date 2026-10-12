
import * as authService from "../services/auth.service.js";

import {
    revokeAccessToken,
} from "../services/session.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import env from "../config/env.js";

const ACCESS_TOKEN_COOKIE = "accessToken";

/*
 * Cookie configuration
 */

const cookieOptions = {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
};

const {
    maxAge,
    ...clearCookieOptions
} = cookieOptions;

/*
 * REGISTER
 */

export const register = asyncHandler(
    async (req, res) => {
        const user = await authService.registerStudent(
            req.body
        );

        return sendSuccess(res, {
            statusCode: 201,
            message: "Student registered successfully",
            data: { user },
        });
    }
);

/*
 * LOGIN
 */

export const login = asyncHandler(
    async (req, res) => {
        const { user, accessToken } =
            await authService.loginUser(req.body);

        res.cookie(
            ACCESS_TOKEN_COOKIE,
            accessToken,
            cookieOptions
        );

        res.set("Cache-Control", "no-store");

        return sendSuccess(res, {
            message: "Login successful",
            data: { user },
        });
    }
);

/*
 * LOGOUT
 */

export const logout = asyncHandler(
    async (req, res) => {

        const token = req.cookies?.accessToken;

        // Revoke valid JWT in MongoDB
        await revokeAccessToken(token);

        // Clear browser cookie
        res.clearCookie(
            ACCESS_TOKEN_COOKIE,
            clearCookieOptions
        );

        res.set("Cache-Control", "no-store");

        return sendSuccess(res, {
            message: "Logout successful",
        });
    }
);

/*
 * GET CURRENT USER
 */

export const getCurrentUser = asyncHandler(
    async (req, res) => {

        res.set("Cache-Control", "no-store");

        return sendSuccess(res, {
            message: "Current user retrieved successfully",
            data: {
                user: req.user,
            },
        });
    }
);
