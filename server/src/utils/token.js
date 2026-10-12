
import jwt from "jsonwebtoken";
import { randomUUID, createHash } from "node:crypto";

import env from "../config/env.js";
import ApiError from "./ApiError.js";

const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "smart-hostel-api";
const JWT_AUDIENCE = "smart-hostel-client";

/*
 * Generate an access token
 */
export const generateAccessToken = (userId) => {
    return jwt.sign(
        {},
        env.jwtSecret,
        {
            subject: userId.toString(),
            jwtid: randomUUID(),
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            expiresIn: env.jwtExpiresIn,
            algorithm: JWT_ALGORITHM,
        }
    );
};

/*
 * Verify access token
 */
export const verifyAccessToken = (token) => {
    try {
        const payload = jwt.verify(
            token,
            env.jwtSecret,
            {
                algorithms: [JWT_ALGORITHM],
                issuer: JWT_ISSUER,
                audience: JWT_AUDIENCE,
            }
        );

        if (
            typeof payload.sub !== "string" ||
            typeof payload.jti !== "string" ||
            typeof payload.exp !== "number"
        ) {
            throw new ApiError(
                401,
                "Invalid access token"
            );
        }

        return payload;

    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (error.name === "TokenExpiredError") {
            throw new ApiError(
                401,
                "Access token has expired"
            );
        }

        throw new ApiError(
            401,
            "Invalid access token"
        );
    }
};

/*
 * Hash token ID before storing it
 */
export const hashTokenId = (tokenId) => {
    return createHash("sha256")
        .update(tokenId)
        .digest("hex");
};
