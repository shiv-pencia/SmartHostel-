
import RevokedToken from "../models/revokedToken.model.js";

import {
    verifyAccessToken,
    hashTokenId,
} from "../utils/token.js";

import ApiError from "../utils/ApiError.js";

/*
 * Check whether a token has been revoked
 */
export const isTokenRevoked = async (tokenId) => {
    const tokenIdHash = hashTokenId(tokenId);

    const revokedToken = await RevokedToken.exists({
        tokenIdHash,
    });

    return Boolean(revokedToken);
};

/*
 * Revoke an access token during logout
 */
export const revokeAccessToken = async (token) => {
    if (!token) {
        return;
    }

    let payload;

    try {
        payload = verifyAccessToken(token);
    } catch (error) {
        // Expired or invalid tokens need no revocation.
        if (
            error instanceof ApiError &&
            error.statusCode === 401
        ) {
            return;
        }

        throw error;
    }

    const tokenIdHash = hashTokenId(payload.jti);

    const expiresAt = new Date(payload.exp * 1000);

    // Avoid inserting already-expired tokens.
    if (expiresAt <= new Date()) {
        return;
    }

    try {
        await RevokedToken.updateOne(
            { tokenIdHash },
            {
                $setOnInsert: {
                    tokenIdHash,
                    expiresAt,
                },
            },
            { upsert: true }
        );
    } catch (error) {
        // Concurrent logout requests may try to
        // revoke the same token. That is harmless.
        if (error.code !== 11000) {
            throw error;
        }
    }
};
