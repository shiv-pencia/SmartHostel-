
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";

const SAFE_METHODS = new Set([
    "GET",
    "HEAD",
    "OPTIONS",
]);

const csrfProtection = (req, res, next) => {
    // Safe, read-only requests can continue.
    if (SAFE_METHODS.has(req.method)) {
        return next();
    }

    // Reject requests from untrusted browser origins.
    const origin = req.get("Origin");

    if (origin && origin !== env.clientUrl) {
        return next(
            new ApiError(
                403,
                "Request origin is not allowed"
            )
        );
    }

    // Require a custom header for all write operations.
    const requestedWith = req.get("X-Requested-With");

    if (requestedWith !== "XMLHttpRequest") {
        return next(
            new ApiError(
                403,
                "CSRF protection: required header is missing"
            )
        );
    }

    next();
};

export default csrfProtection;
