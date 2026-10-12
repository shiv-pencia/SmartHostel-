
import * as userService from "../services/user.service.js";

import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";

import {
  listUsersQuerySchema,
} from "../validators/user.validator.js";

/*
 * 1. LIST USERS
 */

export const listUsers = asyncHandler(
  async (req, res) => {
    const parsed = listUsersQuerySchema.safeParse(
      req.query
    );

    if (!parsed.success) {
      const errors = parsed.error.issues.map(
        (issue) => ({
          field: issue.path.join(".") || "query",
          message: issue.message,
        })
      );

      throw new ApiError(
        400,
        "Invalid query parameters",
        errors
      );
    }

    const result = await userService.listUsers(
      parsed.data
    );

    return sendSuccess(res, {
      message: "Users retrieved successfully",
      data: result.users,
      meta: result.pagination,
    });
  }
);

/*
 * 2. GET USER BY ID
 */

export const getUserById = asyncHandler(
  async (req, res) => {
    const user = await userService.getUserById(
      req.params.userId
    );

    return sendSuccess(res, {
      message: "User retrieved successfully",
      data: { user },
    });
  }
);

/*
 * 3. UPDATE USER DETAILS
 */

export const updateUser = asyncHandler(
  async (req, res) => {
    const user = await userService.updateUser(
      req.params.userId,
      req.body
    );

    return sendSuccess(res, {
      message: "User updated successfully",
      data: { user },
    });
  }
);

/*
 * 4. ACTIVATE / DEACTIVATE USER
 */

export const updateUserStatus = asyncHandler(
  async (req, res) => {
    const user = await userService.updateUserStatus(
      req.params.userId,
      req.body.isActive,
      req.user.id
    );

    return sendSuccess(res, {
      message: "User status updated successfully",
      data: { user },
    });
  }
);

/*
 * 5. CHANGE USER ROLE
 */

export const updateUserRole = asyncHandler(
  async (req, res) => {
    const user = await userService.updateUserRole(
      req.params.userId,
      req.body.role,
      req.user.id
    );

    return sendSuccess(res, {
      message: "User role updated successfully",
      data: { user },
    });
  }
);
