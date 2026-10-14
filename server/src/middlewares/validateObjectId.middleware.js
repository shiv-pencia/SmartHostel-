
import mongoose from "mongoose";

import ApiError from "../utils/ApiError.js";

const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (
      typeof value !== "string" ||
      !mongoose.isObjectIdOrHexString(value)
    ) {
      return next(
        new ApiError(
          400,
          `Invalid ${paramName}`
        )
      );
    }

    next();
  };
};

export default validateObjectId;
