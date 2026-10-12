
import mongoose from "mongoose";

import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

/*
 * Shared helpers
 */

const findUserOrThrow = async (userId) => {
  if (!mongoose.isObjectIdOrHexString(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

const escapeRegExp = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/*
 * LIST USERS
 */

export const listUsers = async (query) => {
  const {
    page,
    limit,
    search,
    role,
    status,
  } = query;

  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (status) {
    filter.isActive = status === "active";
  }

  if (search) {
    const safeSearch = escapeRegExp(search);

    filter.$or = [
      {
        name: {
          $regex: safeSearch,
          $options: "i",
        },
      },
      {
        email: {
          $regex: safeSearch,
          $options: "i",
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),

    User.countDocuments(filter),
  ]);

  return {
    users: users.map((user) => user.toSafeObject()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/*
 * GET USER
 */

export const getUserById = async (userId) => {
  const user = await findUserOrThrow(userId);
  return user.toSafeObject();
};

/*
 * UPDATE USER PROFILE
 */

export const updateUser = async (userId, data) => {
  const user = await findUserOrThrow(userId);

  if (data.name !== undefined) {
    user.name = data.name;
  }

  if (data.phone !== undefined) {
    user.phone = data.phone;
  }

  await user.save();

  return user.toSafeObject();
};

/*
 * ACTIVATE / DEACTIVATE ACCOUNT
 */

export const updateUserStatus = async (
  userId,
  isActive,
  actorId
) => {
  const user = await findUserOrThrow(userId);

  if (user._id.toString() === actorId && !isActive) {
    throw new ApiError(
      403,
      "You cannot deactivate your own account"
    );
  }

  // Admin accounts require a separate workflow.
  if (user.role === "admin") {
    throw new ApiError(
      403,
      "Administrator account status cannot be changed here"
    );
  }

  user.isActive = isActive;

  await user.save();

  return user.toSafeObject();
};

/*
 * CHANGE USER ROLE
 */

export const updateUserRole = async (
  userId,
  role,
  actorId
) => {
  const user = await findUserOrThrow(userId);

  if (user._id.toString() === actorId) {
    throw new ApiError(
      403,
      "You cannot change your own role"
    );
  }

  // Existing admins cannot be demoted here.
  if (user.role === "admin") {
    throw new ApiError(
      403,
      "Administrator roles cannot be changed here"
    );
  }

  // New admins must use a separate provisioning process.
  if (role === "admin") {
    throw new ApiError(
      403,
      "Administrator role assignment is restricted"
    );
  }

  user.role = role;

  await user.save();

  return user.toSafeObject();
};
