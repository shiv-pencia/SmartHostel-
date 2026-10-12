
import mongoose from "mongoose";

import User from "../models/user.model.js";

import {
    verifyAccessToken,
} from "../utils/token.js";

import {
    isTokenRevoked,
} from "../services/session.service.js";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

/*
 * Authenticate incoming requests
 */

export const authenticate = asyncHandler(
    async (req, res, next) => {

        // Read JWT from HTTP-only cookie
        const token = req.cookies?.accessToken;

        if (!token) {
            throw new ApiError(
                401,
                "Authentication required. Please login."
            );
        }

        // Verify signature and expiry
        const payload = verifyAccessToken(token);

        // Validate MongoDB user ID
        if (!mongoose.isObjectIdOrHexString(payload.sub)) {
            throw new ApiError(
                401,
                "Invalid access token"
            );
        }

        // Check the token revocation list
        const revoked = await isTokenRevoked(
            payload.jti
        );

        if (revoked) {
            throw new ApiError(
                401,
                "Session has been revoked. Please login again."
            );
        }

        // Load user from database
        const user = await User.findById(payload.sub);

        if (!user) {
            throw new ApiError(
                401,
                "User account no longer exists"
            );
        }

        if (!user.isActive) {
            throw new ApiError(
                403,
                "Your account is deactivated"
            );
        }

        // Add authenticated user to request
        req.user = user.toSafeObject();

        next();
    }
);

export default authenticate;
