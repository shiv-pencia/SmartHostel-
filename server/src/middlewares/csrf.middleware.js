
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

    const allowedOrigins = new Set([
        env.clientUrl,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]);

    if (origin && !allowedOrigins.has(origin)) {
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
