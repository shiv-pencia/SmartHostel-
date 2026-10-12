
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let error = err;

  // Mongoose document validation
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map(
      (item) => ({
        field: item.path,
        message: item.message,
      })
    );

    error = new ApiError(
      400,
      "Validation failed",
      errors
    );
  }

  // Duplicate MongoDB unique index
  else if (err.code === 11000) {
    error = new ApiError(
      409,
      "A record with this unique value already exists"
    );
  }

  // Invalid Mongoose type / ObjectId
  else if (err.name === "CastError") {
    error = new ApiError(
      400,
      "Invalid database field value"
    );
  }

  // Invalid JSON request body
  else if (err.type === "entity.parse.failed") {
    error = new ApiError(
      400,
      "Malformed JSON request body"
    );
  }

  const statusCode = (
    Number.isInteger(error.statusCode) &&
    error.statusCode >= 400 &&
    error.statusCode <= 599
  )
    ? error.statusCode
    : 500;

  // Never reveal unexpected internal errors in production.
  const isInternalError = statusCode >= 500;

  if (isInternalError) {
    console.error("Internal server error:", err);
  }

  const message = (
    env.nodeEnv === "production" &&
    isInternalError
  )
    ? "Internal server error"
    : error.message || "Internal server error";

  const response = {
    success: false,
    message,
  };

  if (
    !isInternalError &&
    Array.isArray(error.errors) &&
    error.errors.length > 0
  ) {
    response.errors = error.errors;
  }

  if (env.nodeEnv === "development") {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

export default errorMiddleware;
